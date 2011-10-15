var map,
    popup,
    markers = {};

$(document).ready(function() {
    // Pusher connection
    var channel = pusher.subscribe('points-' + map_id);
    channel.bind('add', onPointAdded);
    channel.bind('del', onPointDeleted);
    
    // Map initialization
    map = new L.Map('map');
    map.on('locationfound', onLocationFound);
    map.on('click', onMapClick);

    // Tiles layer
    var cloudmade = new L.TileLayer(urltiles, {maxZoom: 18, 
                                               attribution: 'Developed by <a href="http://makina-corpus.com">Makina Corpus</a> — Map data &copy; 2011 OpenStreetMap contributors'});
    map.addLayer(cloudmade);
    
    // GeoJSON layer
    $.getJSON(urljson, function(data) {
        var geojsonLayer = new L.GeoJSON(),
            bounds = new L.LatLngBounds(),
            nb = 0;
        geojsonLayer.on("featureparse", function (e) {
            if (e.properties) {
                e.properties['_id'] = e.id;
                e.layer.bindPopup(buildMarkerPopup(e.properties));
                // Keep a reference on Marker
                markers[e.id] = e.layer;
            }
            bounds.extend(e.layer.getLatLng());
            setMarkerIcon(e.layer, e.properties);
            nb++;
        });
        geojsonLayer.addGeoJSON(data);
        map.addLayer(geojsonLayer);
        if (nb>0) {
            map.fitBounds(bounds);
        }
    });
    map.setView(new L.LatLng(0, 0), 2); 
    
    // Follow me ?
    $("input#followme").change(function() {
        if($(this).is(':checked')){
            map.locate({watch: true,
                        setView: true,
                        enableHighAccuracy: true});
        }
        else {
            map.stopLocate();
        }
    });
});

function buildMarkerPopup(properties) {
    var template = $('#template_marker').html();
    if (properties.timestamp) {
        var date = new Date(properties.timestamp*1000);
        properties['timestamp'] = date.toUTCString();
    }
    return Mustache.to_html(template, properties)
}

function setMarkerIcon(m, properties) {
    var icon = {},
        classid = properties.classid ? properties.classid : 5;
    m.setIcon(new L.Icon('static/marker'+classid+'.png'));
}

function onPointAdded(item) {
    var latlng = new L.LatLng(item.coords[1], item.coords[0]),
            marker = new L.Marker(latlng);
    marker.bindPopup(buildMarkerPopup(item));
    setMarkerIcon(marker, item);
    markers[item._id] = marker;
    map.addLayer(marker);
}

function onPointDeleted(item) {
    var marker = markers[item._id];
    if (marker) {
        marker.closePopup();
        map.removeLayer(marker);
    }
}

function onLocationFound(e) {
    map.setView(e.latlng, 13)
}

function onMapClick(e) {
    popup = new L.Popup();
    var template = $('#template_addpoint').html();
    var content = Mustache.to_html(template, {'data_maxsize': data_maxsize,
                                              'lon': e.latlng.lng.toFixed(4), 
                                              'lat': e.latlng.lat.toFixed(4)});
    popup.setLatLng(e.latlng);
    popup.setContent(content);
    map.openPopup(popup);
}

function onAddPoint(form) {
    $.post(urladd, $(form).serialize(),
        function(data){
            if (!data.ok) {
                alert("An error occured while submitting");
            }
            else {
                popup._close();
            }
        }, "json");
    return false;
}

function onDelPoint(id, link) {
    $.post(urldel, {'id': id},
        function(data){
            if (!data.ok) {
                alert("An error occured while deleting");
            }
        }, "json");
    return false;
}
