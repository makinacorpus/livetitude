var map,
    popup,
    members = {},
    markers = {};

$(document).ready(function() {
    // Pusher connection
    var channel = pusher.subscribe('points-' + map_id);
    channel.bind('add', onPointAdded);
    channel.bind('del', onPointDeleted);
    channel.bind('move', onPointMoved);
    
    channel = pusher.subscribe('presence-'+ map_id);
    channel.bind('pusher:subscription_succeeded', onSubscription);
    channel.bind('pusher:member_added', onMemberJoin);
    channel.bind('pusher:member_removed', onMemberLeft);
    
    // Map initialization
    map = new L.Map('map');
    map.on('locationfound', onLocationFound);
    map.on('click', onMapClick);

    // Default map location (location hash)
    var defaultloc = null;
    if (window.location.hash) {
        defaultloc = window.location.hash.replace('#', '').split('/');
    }
    if (defaultloc && defaultloc.length == 3) {
        map.setView(new L.LatLng(defaultloc[2], defaultloc[1]), defaultloc[0]); 
    }
    else {
        map.setView(new L.LatLng(0, 0), 2);
    }
    updateHash();
    map.on('moveend', updateHash);

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
            // Initialize popups with feature properties
            if (!e.properties) {
                e.properties = {};
            }
            e.properties['_id'] = e.id;
            e.layer.bindPopup(buildMarkerPopup(e.properties));
            // Keep a reference on Marker
            markers[e.id] = e.layer;
            initMarker(e.layer, e.properties);
            // Compute layer bounds
            bounds.extend(e.layer.getLatLng());
            nb++;
        });
        geojsonLayer.addGeoJSON(data);
        map.addLayer(geojsonLayer);
        // If no default location and geojson not empty : fit to layer
        if (!defaultloc && nb>0) {
            map.fitBounds(bounds);
            updateHash();
        }
    });
    
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

function updateHash(e) {
    var hash = map.getZoom() + '/' + map.getCenter().lng.toFixed(4) + '/' + map.getCenter().lat.toFixed(4),
      regexp = new RegExp('embed=true(.*)"');
    window.location.hash = hash;
    if($('#info').length > 0) {
        $('input#permalink').val(window.location);
        $('input#embed').val($('input#embed').val().replace(regexp, 'embed=true#' + hash + '"'));
    }
}

function buildMarkerPopup(properties) {
    var template = $('#template_marker').html();
    if (properties.timestamp) {
        var date = new Date(properties.timestamp*1000);
        properties['timestamp'] = date.toUTCString();
    }
    return Mustache.to_html(template, properties)
}

function initMarker(m, properties) {
    // Events
    L.Util.setOptions(m, {'draggable': true});
    m.on('dragend', function(e) {
        movePoint(properties._id, e.target.getLatLng());
    });
    // Icon
    var icon = {},
        classid = properties.classid ? properties.classid : 5;
    m.setIcon(new L.Icon('static/marker'+classid+'.png'));
}

function onSubscription(presentmembers) {
    presentmembers.each(function(member) {
        members[member.id] = member.info;
    });
    $('#users span.number').html($(members).size());
}

function onMemberJoin(member) {
    members[member.id] = member.info;
    $('#users span.number').html($(members).size());
}

function onMemberLeft(member) {
    delete members[member.id];
    $('#users span.number').html($(members).size());
}

function onPointAdded(item) {
    var latlng = new L.LatLng(item.coords[1], item.coords[0]),
            marker = new L.Marker(latlng);
    marker.bindPopup(buildMarkerPopup(item));
    initMarker(marker, item);
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

function onPointMoved(item) {
    var latlng = new L.LatLng(item.coords[1], item.coords[0]);
    var marker = markers[item._id];
    if (marker) {
        marker.setLatLng(latlng);
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

function addPoint(form) {
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

function deletePoint(id) {
    $.post(urldel, {'id': id},
        function(data){
            if (!data.ok) {
                alert("An error occured while deleting");
            }
        }, "json");
    return false;
}

function movePoint(id, latlng) {
    $.post(urlmove, {'id': id, 'coords': latlng.lng + ',' + latlng.lat},
        function(data){
            if (!data.ok) {
                alert("An error occured while deleting");
            }
        }, "json");
    return false;
}
