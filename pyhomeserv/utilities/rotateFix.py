#!/Users/matt/.virtualenvs/homeserv/bin/python

from PIL import Image
from pymongo import MongoClient
import sys

# Mongo Database Config
client     = MongoClient()
db         = client.homeserv
collection = db.media

ROTATEMAP = {
    'Rotated 90 CCW':270,
    'Rotated 180':180,
    'Rotated 90 CW':90
}
start = False

for doc in collection.find({"$or":
    [
        {'Orientation':'Rotated 90 CCW'},
        {'Orientation':'Rotated 180'},
        {'Orientation':'Rotated 90 CW'}
    ]
}):
    id = doc['_id']
    print id
    if id == '37103217a0522c0d':
        start = True
        print 'this is it dude'
    if start:
        file = doc['hash_dir']+id
        orientation = doc['Orientation']

        for x in range(2):
            file_path = file + '_' + str(x) + '.jpg'
            print file_path
            im = Image.open(file_path)

            print 'ROTATING!',orientation
            im = im.rotate(ROTATEMAP[orientation], expand=True)
            im.save(file_path)
            im.close()


#if orientation in ROTATEMAP:
#    print 'ROTATING!',orientation
#    im = im.rotate(ROTATEMAP[orientation], expand=True)

