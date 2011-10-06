import os

from flask import Flask, g, request, abort, render_template
import flaskext.couchdb
import couchdb
import simplejson
import geojson
from easydict import EasyDict as edict
import pusher

from settings import Settings

app = Flask(__name__)
settings = Settings()


@app.route("/")
def welcome():
    return render_template('index.html')


@app.route("/<map_id>")
def map(map_id):
    return render_template('map.html', map_id=map_id, pusher_key=pusher.key)


@app.route("/<map_id>/points")
def points(map_id):
    query = '''
    function(doc) {
        emit(doc.map, doc);
    }'''
    results = g.couch.query(query)
    features = []
    for row in results[map_id]:
        row = edict(row.value)
        p = geojson.Point([row.lon, row.lat])
        features.append(p)
    mapcontent = geojson.FeatureCollection(features)
    return geojson.dumps(mapcontent)


@app.route("/<map_id>/add", methods=['POST'])
def add_point(map_id):
    try:
        state = False
        doc = {
            'map': map_id,
            'lon': request.values['lon'],
            'lat': request.values['lat']
        }
        g.couch.save(doc)
        p = pusher.Pusher()
        p['points'].trigger('add', doc)
        state = True
    except KeyError, e:
        pass
    return simplejson.dumps({'ok': state})


if __name__ == "__main__":
    pusher.app_id = settings.PUSHER_ID
    pusher.key = settings.PUSHER_KEY
    pusher.secret = settings.PUSHER_SECRET
    app.config.from_object(settings)
    manager = flaskext.couchdb.CouchDBManager()
    manager.setup(app)
    manager.sync(app)
    port = settings.PORT
    app.run(host='0.0.0.0', port=port)
