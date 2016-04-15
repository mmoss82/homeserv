#!/Users/matt/.virtualenvs/homeserv/bin/python

import traceback
from pymongo import MongoClient
import psycopg2
import sys
import os
import datetime

client = MongoClient()
db = client.homeserv
collection = db.media

conn = psycopg2.connect("dbname=homeserv")
cur = conn.cursor()
ints = ('Width','ISO','DPI','BitDepth','Height')
dates = ('Datetime','OriginalDateTime','CreationDate')
err = []
count = 0

for x in collection.find():
    count += 1
    for n in ints:
        if x[n] == '':
            x[n] = 0
    for d in dates:
        if x[d] == '':
            x[d] = datetime.datetime.utcfromtimestamp(0)
    try:
        for a,b in x.iteritems():
            if "'" in str(b):
                x[a] = b.replace("'","")

        cur.execute("INSERT INTO media (id, compression, gps_gpslatituderef, gps_gpslatitude, width, camera, iso, datetime, shutterspeed, dpi, compressionqual, gps_gpslongitude, original_datetime, hash_dir, focal_length, colorspace, gps_gpsimgdirectionref, bitdepth, gps_gpsaltituderef, gps_gpsimgdirection, gps_gpstimestamp, creation_data, orientation, height, original_path, gps_gpslongituderef, gps_gpsaltitude) VALUES ('{0}','{1}','{2}','{3}','{4}','{5}','{6}','{7}','{8}','{9}','{10}','{11}','{12}','{13}','{14}','{15}','{16}','{17}','{18}','{19}','{20}','{21}','{22}','{23}','{24}','{25}','{26}');"
        .format(
        x['_id'],
        x['Compression'],
        x['GPS GPSLatitudeRef'],
        x['GPS GPSLatitude'],
        x['Width'],
        x['Camera'],
        x['ISO'],
        x['Datetime'],
        x['ShutterSpeed'],
        x['DPI'],
        x['CompressionQual'],
        x['GPS GPSLongitude'],
        x['OriginalDateTime'],
        x['hash_dir'],
        x['FocalLength'],
        x['Colorspace'],
        x['GPS GPSImgDirectionRef'],
        x['BitDepth'],
        x['GPS GPSAltitudeRef'],
        x['GPS GPSImgDirection'],
        x['GPS GPSTimeStamp'],
        x['CreationDate'],
        x['Orientation'],
        x['Height'],
        x['OriginalPath'],
        x['GPS GPSLongitudeRef'],
        x['GPS GPSAltitude']
        ))
        print count
        conn.commit()
        
    except:
        print traceback.print_exc()
        print 'error inserting'
        conn.rollback()
        err.append(x)


for error in err:
    print error