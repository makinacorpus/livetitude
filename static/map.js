$(document).ready(function() {
    // Pusher connection
    var channel = pusher.subscribe('points');
    channel.bind('add', onPointAdd);
    
    
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
        var geojsonLayer = new L.GeoJSON(data, {
        pointToLayer: function (latlng) {
                return new L.Marker(latlng);
            }
        });
        map.addLayer(geojsonLayer);
    });
    
    map.locateAndSetView();
});

function onPointAdd(point) {
    var markerLocation = new L.LatLng(point.lat, point.lon),
        marker = new L.Marker(markerLocation);
    map.addLayer(marker);
}

function onLocationFound(e) {
    map.setView(e.latlng, 13)
}

function onMapClick(e) {
    popup = new L.Popup();
    var latlon = '(' + e.latlng.lat.toFixed(3) + ', ' + e.latlng.lng.toFixed(3) + ')';
    var template = '{{# latlon }}' +
                   '<p>Add a point at {{ latlon }} ?</p>' +
                   '<form id="addpoint" onsubmit="return onAddPoint(this);">' +
                   '  <input type="hidden" name="lon" value="{{ lon }}"/>' +
                   '  <input type="hidden" name="lat" value="{{ lat }}"/>' +
                   '  <input type="submit" value="Ok"/>' +
                   '</form>' +
                   '{{/ latlon }}';

    var content = Mustache.to_html(template, {'latlon': latlon, 'lon': e.latlng.lng, 'lat': e.latlng.lat});
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
