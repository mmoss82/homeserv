#!/usr/bin/python
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

# Mongo Database Config
client = MongoClient()
db = client.homeserv
collection = db.media