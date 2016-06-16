#!/Users/matt/.virtualenvs/homeserv/bin/python

import os
import subprocess
import sys
from pymongo import MongoClient

# Mongo Database Config
client     = MongoClient()
db         = client.homeserv
collection = db.media

file = '/Users/matt/Desktop/test/IMG_3263.MOV'

def seconds2tc(secs):
    
    f = str(secs % 1).split('.')[1]
    s = secs % 60
    m = secs / 60
    h = secs / 3600

    return "%02d:%02d:%02d.%0s" % (h, m, s, f)

for result in collection.find({'OriginalPath':{'$regex':'.*[.]MOV'}}):
    file = result['OriginalPath']
    print file

    if not os.path.exists(result['hash_dir'] + result['_id'] + '_0.jpg'):

        meta_cmd = subprocess.Popen(['ffprobe',file,'-show_streams','-loglevel','quiet'], close_fds=True,stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        meta_output = meta_cmd.stdout.read().split('\n')

        for x in meta_output:
            if 'duration=' in x:
                dur = float(x.strip('duration='))
                break

        try:
            print 'dur: ',dur
        except:
            print 'duration not found, making it up...'
            dur = 1
        dur_split = dur / 10.0


        
        # process thumbnails
        for x in range(10):
            outfile =  result['hash_dir'] + result['_id'] + '_' + str(x) + '.jpg'
            tc = seconds2tc(dur_split * x)
            print x,tc
            print outfile
            thumb_cmd = subprocess.Popen(['ffmpeg','-ss',tc,'-i',file,'-vf','scale=250:-1','-vframes','1',outfile],close_fds=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print 'processing thumbnail',x

    else:
        print 'already processed - skipping...'
        

