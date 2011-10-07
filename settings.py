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
    TILES_URL = os.environ.get("TILES_URL", 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png')
