import os
from datetime import datetime

from flask import Flask
from flask import render_template
from flask_socketio import SocketIO
from pymongo import MongoClient

app = Flask(__name__)

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

client = MongoClient()
db = client.homeserv

@socketio.on("initialLoad")
def initialLoad(data_map):
    # this is the initial image dump for the first "search click"
    # it also works for the bottom scroll "infinite scroll"
    
    print 'socketing',data_map
    
    map_date = getDateTime(data_map["date"])
    
    print "map_date:",map_date
    
    # search the database with found criteria from map (tag,date)
    results = db.media.find(
        { "$or" : [
                      { "OriginalPath" : {"$regex" : data_map["tag"] }},
                      { "tags" : {"$regex" : data_map["tag"] }}
                  ],
                  "OriginalDateTime" : { "$gt" : map_date }
        },
	).limit(20).sort( "OriginalDateTime" )
    
    results_list = list(results)

    # convert datetime.datetime objects to JSONparseable strings
    for x in results_list:
        for a,b in x.iteritems():
            if type(b) == datetime:
                x[a] = b.strftime("%Y/%m/%d %H:%M:%S")
    
    print "results_len:",len(results_list)
    # send the results back to client
    socketio.emit('moreImages', { "data": results_list } )

@socketio.on("addTagSingle")
def addTagSingle(data_map):
    # method for updating a single doc's tag
    
    print 'updating tags for single file'
    
    update_map = {}
    update_map["find_map"] = { '_id' : data_map["id"] }
    update_map["change_map"] = { "$push" : {"tags" : data_map["tag"] }}
    
    result = updateField(update_map)
    
    print 'Updated:',result.modified_count,'files'
    
    # I don't think this does anything ("result" is kind of garbagy)
    socketio.emit("multiTagResults", result)

@socketio.on("addTagMulti")
def addTagMulti(data_map):
    # method for updating multiple tag documents
    # 1. search for original tagged photo
    # 2. set dirname as new findMany criteria
    # 3. update change_map for results
    # 4. emit results["data"]
    
    print 'adding tag for multi files: ',data_map
    
    result = db.media.find_one({ "_id": data_map["id"] })
    
    print "result: ",result
    print "found tag source match!"
    
    # find the path of the file so we can update all files in that directory
    original_path = os.path.dirname( result["OriginalPath"] )
    
    update_map = {};
                        
    update_map["find_map"] = { 'OriginalPath' : { "$regex" : original_path } };
    update_map["change_map"] = { "$push" : {"tags" : data_map["tag"] } };
    
    if updateField(update_map).modified_count == 0:
        print "error adding tags to multi files"
    else:
        print "success adding tags to multi files"
    
    # find all the updated docs from dirname find
    result = db.media.find(
        update_map["find_map"], 
        {'_id':1,'OriginalPath':1}
    )
    
    # send back the results to be updated on the UI side
    socketio.emit('multiTagResult', { "data" : list(result), "tag" : data_map["tag"] })
                    
@socketio.on("connect")
def connect():
    # it works!
    print "user connected"

@socketio.on("disconnect")
def disconnect():
    # it stopped working!
    print "user disconnected"

@app.route("/")
def hello():
    # meet and greet
    return render_template('homeserv.html')
    
def getDateTime(d):
    # format the date to an array of formats, whichever one works
    formats = ['%m/%d/%Y %H:%M:%S', '%Y/%m/%d %H:%M:%S', '%m/%d/%Y', '%Y/%m/%d']
    
    for fmt in formats:
        try:
            return datetime.strptime(d, fmt)
        except ValueError:
            pass        
    raise ValueError('No valid format found')
    
def updateField(data_map):
    # function to edit mongo document
    # data_map is a dict with find_map (what docs are we changing)
    # and a change_map (what data are we changing)
    # return the number of changed docs
    
    update_result = db.media.update_many(
        data_map["find_map"],
        data_map["change_map"]
    )
        
    return update_result

if __name__ == "__main__":
    app.debug = True
    socketio.run(app)
