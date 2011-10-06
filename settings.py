import os

class Settings(object):
    DEBUG = True
    TESTING = False
    COUCHDB_SERVER = os.environ.get('COUCHDB_SERVER', 'http://localhost:5984/')
    COUCHDB_DATABASE = os.environ.get('COUCHDB_DATABASE', 'livetitude')
    PUSHER_ID = os.environ.get("PUSHER_ID")
    PUSHER_KEY = os.environ.get("PUSHER_KEY")
    PUSHER_SECRET = os.environ.get("PUSHER_SECRET")
    PORT = int(os.environ.get("PORT", 5000))
