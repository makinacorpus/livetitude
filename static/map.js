$(document).ready(function() {
    // Pusher connection
    var channel = pusher.subscribe('points');
    channel.bind('add', onPointAdded);
    
    
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
            if (e.properties) e.layer.bindPopup(buildMarkerPopup(e.properties));
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
    var template = '{{{ data }}}<br/>{{ timestamp }}';
    var date = new Date(properties.timestamp);
    properties['timestamp'] = date.toUTCString();
    return Mustache.to_html(template, properties)
}

function setMarkerIcon(m, properties) {
    var icon = {},
        classid = properties.classid ? properties.classid : 5;
    m.setIcon(new L.Icon('static/marker'+classid+'.png'));
}

function onPointAdded(item) {  
    var latlng = new L.LatLng(item.lat, item.lon),
            marker = new L.Marker(latlng);
    marker.bindPopup(buildMarkerPopup(item));
    setMarkerIcon(marker, item);
    map.addLayer(marker);
}

function onLocationFound(e) {
    map.setView(e.latlng, 13)
}

function onMapClick(e) {
    popup = new L.Popup();
    var latlon = '(' + e.latlng.lat.toFixed(3) + ', ' + e.latlng.lng.toFixed(3) + ')';
    var template = '<p>Add a point at {{ latlon }} ?</p>' +
                   '<form id="addpoint" onsubmit="return onAddPoint(this);">' +
                   '  <span class="class1"><input type="radio" name="classid" value="1"/></span>' +
                   '  <span class="class2"><input type="radio" name="classid" value="2"/></span>' +
                   '  <span class="class3"><input type="radio" name="classid" value="3"/></span>' +
                   '  <span class="class4"><input type="radio" name="classid" value="4"/></span>' +
                   '  <span class="class5"><input type="radio" name="classid" value="5" checked="checked"/></span>' +
                   '  <span class="class6"><input type="radio" name="classid" value="6"/></span>' +
                   '  <span class="class7"><input type="radio" name="classid" value="7"/></span>' +
                   '  <textarea name="data"></textarea><br/>' +
                   '  <input type="hidden" name="lon" value="{{ lon }}"/>' +
                   '  <input type="hidden" name="lat" value="{{ lat }}"/>' +
                   '  <input type="submit" value="Ok"/>' +
                   '</form>';

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
