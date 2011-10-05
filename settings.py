import os

class Settings(object):
    DEBUG = True
    TESTING = False
    COUCHDB_SERVER = os.environ.get('COUCHDB_SERVER', 'http://localhost:5984/')
    COUCHDB_DATABASE = os.environ.get('COUCHDB_DATABASE', 'livetitude')
