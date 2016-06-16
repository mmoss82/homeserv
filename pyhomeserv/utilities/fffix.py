#!/Users/matt/.virtualenvs/homeserv/bin/python

import os
import subprocess
import sys
from pymongo import MongoClient
import re
import shutil
import datetime

# Mongo Database Config
client     = MongoClient()
db         = client.homeserv
collection = db.media

file = '/Users/matt/Desktop/test/IMG_3263.MOV'
count = 0

'''
for result in collection.find({'OriginalPath':{'$regex':'.*[.]mov'}}):
    d = result['hash_dir']
    orig_name = os.path.basename(result['OriginalPath']).split('.')[0]

    new_src = d + result['_id']

    for x in range(10):
        
        src = d + orig_name + '_' + str(x) + '.jpg'
        dest = new_src + '_' + str(x) + '.jpg'

        print src,'--->',dest

        try:
            shutil.move(src,dest)
        except:
            print 'not moving - error'

    print 'moved: ',count
    count += 1
'''
for result in collection.find({'OriginalDateTime':{'$gte':datetime.datetime.strptime('2015-11-25', '%Y-%d-%M')}}):
    files = os.listdir(result['hash_dir'])
    count += 1
    print count
    for f in files:
        if '..' in f:
            src = result['hash_dir'] + f
            dest = result['hash_dir'] + f.split('.')[0]+'.jpg'
            shutil.move(src,dest)
            print src,dest
