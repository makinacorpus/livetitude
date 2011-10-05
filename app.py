import os

from flask import Flask, g, request, abort
import flaskext.couchdb
import couchdb
import geojson
from easydict import EasyDict as edict


app = Flask(__name__)


@app.route("/")
def welcome():
    return "Welcome !"


@app.route("/<map_id>")
def map(map_id):
    return "template of %s" % map_id


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
        doc = {
            'map': map_id,
            'lon': request.values['lon'],
            'lat': request.values['lat']
        }
        g.couch.save(doc)
        return '{"ok":true}'
    except KeyError, e:
        abort(500)


if __name__ == "__main__":
    app.config.from_object(os.environ.get("SETTINGS", 'settings.Settings'))
    manager = flaskext.couchdb.CouchDBManager()
    manager.setup(app)
    manager.sync(app)
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
