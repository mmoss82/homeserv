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
import subprocess
from time import strftime

# Mongo Database Config
client     = MongoClient()
db         = client.homeserv
collection = db.media

# Postgres Database Config
#con = psycopg2.connect("dbname='homeserv' user='matt'")   
#cur = con.cursor() 

THUMB_SIZE = [(250,250),(800,800)]

# Supported Filetypes ( for now )
FILETYPES = ('.jpg', '.JPG', '.TIF', '.tif', '.tiff', '.TIFF', '.psd', '.NEF', '.nef', '.CR2', '.cr2', '.PSD','.jpeg','.JPEG','.mov','.MOV')
MOVIE_EXTENSIONS = ('.mov','.MOV')
RAW_EXTENSIONS = ['.nef', '.cr2', '.dng']
LOGFILE = open('/var/log/homeserv/processor.log','a')
# Object to count filetypes in search directory
FILEINDEX = {x.lower():0 for x in FILETYPES}
OUTDIR = '/Volumes/SATA 1500/homeserv_media/'
#OUTDIR = '/Users/matt/Desktop/test2/'
COUNT = 0
DB_ERRORS = ['db_errors']
IM_ERRORS = ['im_errors']
TEST = False
MOVIE = False
OUTEXT = '.jpg'


# Directory of media to scan

if '-s' in sys.argv:
    SOURCE_MEDIA_DIR = sys.argv[sys.argv.index('-s')+1]
else:    
    SOURCE_MEDIA_DIR = '/Volumes/SATA 1500/'
if '-test' in sys.argv:
    TEST = True
if '-movie' in sys.argv:
    MOVIE = True
    FILETYPES = MOVIE_EXTENSIONS
    OUTEXT = '.mov'
    
ROTATEMAP = {
    'Rotated 90 CCW':270,
    'Rotated 180':180,
    'Rotated 90 CW':90
}

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
    'GPS GPSLongitudeRef':'GPS GPSLongitudeRef',
#    'creation_time':'OriginalDateTime',
    'date':'OriginalDatetime',
    'location':'Location',
    'encoder':'Compression',
    'model':'Camera',
    'width':'Width',
    'height':'Height'
}

def logger(message):
    
    message = strftime("%Y-%m-%d %H:%M:%S") + ' | ' + str(message)
    
    LOGFILE.write( message + '\n' )
    
    return message

def findImage():
    # This is where the magic happens
    # We create an md5 hash of the file and use it for the mongodb _id
    # as well as the filename for the proxy and location ( dirs split every 2 characters )
    TAG_LIST = {}
    m = hashlib.md5()
    found_files = []
    logger('hellooooo')
    
    global COUNT

    # Dump mongodb

    print logger('Dumping out entire mongodb...')

    MONGOSET = set()

    for asset in collection.find({},{'OriginalPath':1}):
        MONGOSET.add(asset['OriginalPath'])

    print logger('...Done')
    print logger('Found ' + str(len(MONGOSET)) + ' assets')

    try:
        for root, dirs, files in os.walk(SOURCE_MEDIA_DIR):
            for f in files:
                ext = os.path.splitext(f)[-1]
                if ext in FILETYPES and '/Volumes/SATA 1500/homeserv_media' not in root:
                    file_path = os.path.join(root, f)

                    if not file_path in MONGOSET or TEST or MOVIE:
                        m.update(file_path)
                        file_hash = m.hexdigest()[:16]
                        file_hash_dir = OUTDIR+'/'.join([file_hash[x:x+2] for x in range(0,len(file_hash),2)])+'/'
                    
			if ext in MOVIE_EXTENSIONS:
				tags = subprocess.Popen(['ffprobe','-show_streams','-show_format',file_path],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
				tags = tags.stdout.read().split('\n')
                                d = {}
                                for x in tags:
                                        tag = x.split('=')
					if len(tag) > 1:
						d[tag[0].strip('TAG:')] = tag[1]
                                tags = d
			else:
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
                    
                        for x,y in meta.iteritems():
                            print logger( str(x) + ':' + str(y) )
                            
                        outfile = file_hash_dir+file_hash+OUTEXT
                    
                        filetype = proxify(file_path, file_hash_dir+file_hash, meta['Orientation'])
                
                        meta['FileType'] = filetype

                        try:
                            insert_id = collection.insert_one(meta).inserted_id
                            COUNT += 1
                            print logger(outfile + ' ' + os.path.basename(file_path) +  '  <---- inserting')

                        except:
                            print logger(str(traceback.print_exc()))
                            print logger( 'error adding to db: ' + file_path)
                            DB_ERRORS.append(meta['OriginalPath'])
                    
                    #sys.exit()
#                    else:
#                        print os.path.basename(file_path) # Disabled for speed
                        
        return found_files
    except:
        print logger( str(traceback.print_exc()))
        print logger('Found ' + str(COUNT) + 'items')
        for x,y in FILEINDEX.iteritems():
            print logger(str(x) + ' ' + str(y))

def proxify(file_path, out_path, orientation):
    # create proxies and output to hashdir.
    
    try:
        os.makedirs(os.path.dirname(out_path))
    except:
        print logger('error creating dir - exists')

    try:
        ext = os.path.splitext(file_path)[-1].lower()
        # create image object for raw files through rawpy module
        if ext in RAW_EXTENSIONS:
            print logger( 'processing raw image')
            raw = rawpy.imread(file_path)
            rgb = raw.postprocess()
            im = Image.fromarray(rgb)
            filetype = 'raw'

        elif ext in MOVIE_EXTENSIONS:
            print logger('found a movie!')
            ffmpeg(file_path, out_path)
	    print logger('not making a proxy!')
            filetype = 'mov'
            return filetype

        else:
            # otherwise every other image type (not raw)
            filetype = 'img'
            im = Image.open(file_path)

        # rotate image as necessary 90, 180, 270 from metadata.
        if orientation in ROTATEMAP:
            print logger( 'ROTATING! ' + orientation)
            im = im.rotate(ROTATEMAP[orientation], expand=True)

        for s in THUMB_SIZE:
            im2 = im.copy() # create copy to allow for different resolution images to be created from full res. Just trust me...
            im2.thumbnail(s, Image.ANTIALIAS)
            im2.save(out_path + '_' + str(THUMB_SIZE.index(s)) + OUTEXT, "JPEG")
            im2.close()
        im.close()

        return filetype

    except:
        print logger( str(traceback.print_exc()))
        print logger( 'error creating image: ' + file_path )
        IM_ERRORS.append(file_path)

        return filetype

def seconds2tc(secs):
    # convert seconds to timecode with fractional seconds
    
    f = str(secs % 1).split('.')[1]
    s = secs % 60
    m = secs / 60
    h = secs / 3600

    return "%02d:%02d:%02d.%0s" % (h, m, s, f)

def ffmpeg(file, outpath):
    # Determine length of video and process 10 images evenly spaced throughout
    
    print logger(file)

    meta_cmd = subprocess.Popen(['ffprobe',file,'-show_streams','-loglevel','quiet'], close_fds=True,stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    meta_output = meta_cmd.stdout.read().split('\n')

    for x in meta_output:
        if 'duration=' in x:
            dur = float(x.strip('duration='))
            break

    print logger( 'dur: ' + str(dur))

    dur_split = dur / 10.0

    # process thumbnails
    for x in range(10):
        outfile =  outpath + '_' + str(x) + '.jpg'
        tc = seconds2tc(dur_split * x)
        print logger(str(x) + ' ' + tc)
        print logger(outfile)
        thumb_cmd = subprocess.Popen(['ffmpeg','-ss',tc,'-i',file,'-vf','scale=250:-1','-vframes','1',outfile],close_fds=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print logger( 'processing thumbnail ' + str(x))


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
    # normalize dates
    if d not in ('','    :  :     :  :  '):
        try:
		return datetime.strptime(d, '%Y:%m:%d %H:%M:%S')
	except:
		return datetime.strptime(d[0:len(d)-5], '%Y-%m-%dT%H:%M:%S')
    else:
	print d,'not working'
        return ''

def main():
    
    start_time = datetime.now()
    
    print findImage()
    print logger('Added: '+str(COUNT)+' assets')
    for x in IM_ERRORS:
        print logger(x)
    print '-'*50
    for x in DB_ERRORS:
        print logger(x)

    end_time = datetime.now()
    total_time = (end_time - start_time).seconds
    print logger('Process completed in: ' + str(seconds2tc(float(total_time)))) 
    
if __name__ == '__main__':
    main()
