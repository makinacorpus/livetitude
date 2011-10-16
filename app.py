import os
import time
from uuid import uuid4

from flask import Flask, g, request, abort, render_template
import flaskext.couchdb
import couchdb
from couchdb.design import ViewDefinition
from couchdb import ResourceNotFound, ResourceConflict
import simplejson
import geojson
from easydict import EasyDict as edict
import pusher

from settings import Settings

app = Flask(__name__)
settings = Settings()


"""
CouchDB permanent queries
"""
points_by_map = ViewDefinition('points', 'bymap', 
                               'function(doc) { emit(doc.map, doc);}')


@app.route("/")
def welcome():
    return render_template('index.html')


@app.route("/<map_id>")
def viewmap(map_id):
    return render_template('map.html', 
                           map_id=map_id, 
                           embed=request.values.get('embed', False))


@app.route("/<map_id>/points")
def points(map_id):
    features = []
    for row in points_by_map(g.couch)[map_id]:
        row = edict(row.value)
        # Guess geometries from coordinates
        if not row.coords or len(row.coords) != 2:
            continue   #TODO: linestrings, polygons...
        geom = geojson.Point(row.coords)
        # Strip useless properties
        for k in ['_id', '_rev', 'coords']: del row[k]
        f = geojson.Feature(id=row._id,
                            geometry=geom,
                            properties=row)
        features.append(f)
    mapcontent = geojson.FeatureCollection(features)
    return geojson.dumps(mapcontent)


@app.route("/pusher/auth", methods=['POST'])
def pusher_auth():
    try:
        if settings.PUSHER_ID:
            p = pusher.Pusher()
            socket = request.values['socket_id']
            channel = request.values['channel_name']
            response = p[channel].authenticate(socket, {'user_id': socket})
            return simplejson.dumps(response)
    except KeyError, e:
        pass
    abort(403)


@app.route("/<map_id>/add", methods=['POST'])
def add_point(map_id):
    try:
        state = False

        # Data Validation
        coords = map(float, request.values['coords'].split(','))
        if len(coords) != 2 or abs(coords[0]) > 180 or abs(coords[1]) > 90:
            raise ValueError("Invalid coordinates %s" % coords)
        if len(request.values['data']) > settings.DATA_MAX_SIZE:
            raise ValueError("Data size over limit (%s)" % settings.DATA_MAX_SIZE)

        # Insert into database
        doc = {
            'id' : uuid4().hex,
            'map': map_id,
            'coords': coords,
            'data': request.values['data'],
            'classid': request.values['classid'],
            'timestamp': int(time.time()),
        }
        g.couch.save(doc)

        # Send to websocket !
        if settings.PUSHER_ID:
            p = pusher.Pusher()
            p['points-%s' % map_id].trigger('add', doc)
        state = True
    except (KeyError, ValueError), e:
        pass
    return simplejson.dumps({'ok': state})


@app.route("/<map_id>/del", methods=['POST'])
def del_point(map_id):
    try:
        state = False
        docid = request.values['id']
        doc = g.couch[docid]
        assert doc['map'] == map_id
        g.couch.delete(doc)
        # Send to websocket !
        if settings.PUSHER_ID:
            p = pusher.Pusher()
            p['points-%s' % map_id].trigger('del', doc)
        state = True
    except (ResourceNotFound, 
            ResourceConflict,
            KeyError, 
            AssertionError), e:
        pass
    return simplejson.dumps({'ok': state})


@app.route("/<map_id>/move", methods=['POST'])
def move_point(map_id):
    try:
        state = False
        docid = request.values['id']
        doc = g.couch[docid]
        # Data Validation
        coords = map(float, request.values['coords'].split(','))
        if len(coords) != 2 or abs(coords[0]) > 180 or abs(coords[1]) > 90:
            raise ValueError("Invalid coordinates %s" % coords)
        doc['coords'] = coords
        g.couch.save(doc)
        # Send to websocket !
        if settings.PUSHER_ID:
            p = pusher.Pusher()
            p['points-%s' % map_id].trigger('move', doc)
        state = True
    except (ResourceNotFound, 
            ResourceConflict,
            ValueError,
            KeyError, 
            AssertionError), e:
        print e
        pass
    return simplejson.dumps({'ok': state})


if __name__ == "__main__":
    pusher.app_id = settings.PUSHER_ID
    pusher.key = settings.PUSHER_KEY
    pusher.secret = settings.PUSHER_SECRET
    app.config.from_object(settings)
    manager = flaskext.couchdb.CouchDBManager()
    manager.setup(app)
    manager.add_viewdef(points_by_map)
    manager.sync(app)
    app.run(host=settings.HOST, port=settings.PORT)
