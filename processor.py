#!/Users/matt/.virtualenvs/homeserv/bin/python

# Created by Matt Moss 4/29/15
# Processor to create a media database given a folder of images or other media specified in the FILETYPES array.
import os
import sys
import hashlib
from PIL import Image
import exifread
from pymongo import MongoClient
from datetime import datetime
import traceback
import shutil
import rawpy
import psycopg2
import sys
import json

# Mongo Database Config
client     = MongoClient()
db         = client.homeserv
collection = db.media

# Postgres Database Config
#con = psycopg2.connect("dbname='homeserv' user='matt'")   
#cur = con.cursor() 



THUMB_SIZE = [(250,250),(800,800)]

# Supported Filetypes ( for now )
FILETYPES = ('.jpg', '.JPG', '.TIF', '.tif', '.tiff', '.TIFF', '.psd', '.NEF', '.nef', '.CR2', '.cr2', '.PSD','.jpeg','.JPEG')
RAW_EXTENSIONS = ['.nef', '.cr2', '.dng']

# Object to count filetypes in search directory
FILEINDEX = {x.lower():0 for x in FILETYPES}
OUTDIR = '/Volumes/SATA 1500/homeserv_media/'
DB_ERRORS = ['db_errors']
IM_ERRORS = ['im_errors']

# Directory of media to scan
SOURCE_MEDIA_DIR = '/Volumes/SATA 1500/'


# EXIF metadata to store - and give it a nice new name that I recognize
METATAGS = {
    'Image BitsPerSample':'BitDepth',
    'Image ImageLength':'Height', 
    'Image ImageWidth':'Width',
    'Image Compression':'Compression', 
    'Image DateTime':'Datetime', 
    'Image XResolution':'DPI',
    'EXIF ColorSpace':'Colorspace', 
    'Image Orientation':'Orientation', 
    'EXIF DateTimeOriginal':'OriginalDateTime',
    'MakerNote Quality':'CompressionQual', 
    'EXIF ISOSpeedRatings':'ISO', 
    'EXIF ExposureTime':'ShutterSpeed',
    'EXIF FocalLength':'FocalLength', 
    'Image Model':'Camera', 
    'EXIF ExifImageLength':'Height',
    'EXIF ExifImageWidth':'Width', 
    'GPS GPSLatitudeRef':'GPS GPSLatitudeRef', 
    'GPS GPSAltitudeRef':'GPS GPSAltitudeRef',
    'GPS GPSLongitude':'GPS GPSLongitude',
    'GPS GPSImgDirectionRef':'GPS GPSImgDirectionRef',
    'GPS GPSImgDirection':'GPS GPSImgDirection',
    'GPS GPSLatitude':'GPS GPSLatitude',
    'GPS GPSTimeStamp':'GPS GPSTimeStamp',
    'GPS GPSAltitude':'GPS GPSAltitude',
    'GPS GPSLongitudeRef':'GPS GPSLongitudeRef'
}

def findImage():
    # This is where the magic happens
    # We create an md5 hash of the file and use it for the mongodb _id
    # as well as the filename for the proxy and location ( dirs split every 2 characters )
    TAG_LIST = {}
    m = hashlib.md5()
    found_files = []
    print 'helloooo'
    count = 0
    try:
        for root, dirs, files in os.walk(SOURCE_MEDIA_DIR):
            for f in files:
                ext = os.path.splitext(f)[-1]
                if ext in FILETYPES and '/Volumes/SATA 1500/homeserv_media' not in root : # This is where I went wrong! DOUBLECHECK!!!
                    file_path = os.path.join(root, f)

                    if not collection.find_one({'OriginalPath':file_path}):
                        m.update(file_path)
                        file_hash = m.hexdigest()[:16]
                        file_hash_dir = OUTDIR+'/'.join([file_hash[x:x+2] for x in range(0,len(file_hash),2)])+'/'
                    
                        tags = exifread.process_file(open(file_path, 'rb'))
                        meta = makeMeta(tags)
                        meta['OriginalPath'] = file_path
                        meta['_id'] = file_hash
                        meta['hash_dir'] = file_hash_dir
                        meta['CreationDate'] = datetime.fromtimestamp(os.path.getctime(file_path))
                    
                        for x,y in tags.iteritems():
                            if x not in TAG_LIST and x not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote') and y != '':
                                TAG_LIST[x]=y
                        FILEINDEX[ext.lower()] += 1
                    
                        #for x,y in meta.iteritems():
                        #    print x,':',y,type(y)
                        outfile = file_hash_dir+file_hash+'.jpg'
                    
                        proxify(file_path, file_hash_dir+file_hash)
                
                        try:
                            insert_id = collection.insert_one(meta).inserted_id
                            print outfile, os.path.basename(file_path), ' <---- inserting'
                        
                        except:
                            print traceback.print_exc()
                            print 'error adding to db: ',file_path
                            DB_ERRORS.append(meta.file_path)
                    #sys.exit()
#                    else:
#                        print os.path.basename(file_path) # Disabled for speed
                        
        return found_files
    except:
        print traceback.print_exc()
        print 'Found',count,'items'
        for x,y in FILEINDEX.iteritems():
            print x,y

def proxify(file_path, out_path):
    os.makedirs(os.path.dirname(out_path))
    
    try:

        # create image object for raw files through rawpy module
        if os.path.splitext(file_path)[-1].lower() in RAW_EXTENSIONS:
            print 'processing raw image'
            raw = rawpy.imread(file_path)
            rgb = raw.postprocess()
            im = Image.fromarray(rgb)
        else:
            # otherwise every other image type (not raw)
            im = Image.open(file_path)

        for s in THUMB_SIZE:
            im2 = im.copy()
            im2.thumbnail(s, Image.ANTIALIAS)
            im2.save(out_path + '_' + str(THUMB_SIZE.index(s)) + '.jpg', "JPEG")
            im2.close()
        im.close()
    except:
        print traceback.print_exc()
        print 'error creating image: ',file_path
        IM_ERRORS.append(file_path)


def makeMeta(tags):
    # Create the mongo instance from the EXIF metadata
    # If the tag does not exist, the KeyError exception will
    # make it None instead
    meta = {}
    for x,y in METATAGS.iteritems():
        try:
            if hasattr(tags[x],'printable'):
                tag = tags[x].printable
            else:
                tag = tags[x]

            meta[METATAGS[x]] = tag
        except KeyError:
            meta[METATAGS[x]] = ''
    meta['Datetime'] = convertDate(meta['Datetime'])
    meta['OriginalDateTime'] = convertDate(meta['OriginalDateTime'])

    return meta

def convertDate(d):

    if d not in ('','    :  :     :  :  '):
        return datetime.strptime(d, '%Y:%m:%d %H:%M:%S')
    else:
        return ''

def main():
    print os.system('date')
    print findImage()
    print os.system('date')
    for x in IM_ERRORS:
        print x
    print '-'*50
    for x in DB_ERRORS:
        print x
    
if __name__ == '__main__':
    main()
