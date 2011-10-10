import os

class Settings(object):
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '0.0.0.0')
    DEBUG = bool(os.environ.get('DEBUG'))
    TESTING = bool(os.environ.get('TESTING'))
    COUCHDB_SERVER = os.environ.get('COUCHDB_SERVER', 'http://localhost:5984/')
    COUCHDB_DATABASE = os.environ.get('COUCHDB_DATABASE', 'livetitude')
    PUSHER_ID = os.environ.get('PUSHER_ID')
    PUSHER_KEY = os.environ.get('PUSHER_KEY')
    PUSHER_SECRET = os.environ.get('PUSHER_SECRET')
    TILES_URL = os.environ.get('TILES_URL', 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png')
    DATA_MAX_SIZE = int(os.environ.get('DATA_MAX_SIZE', 256))
