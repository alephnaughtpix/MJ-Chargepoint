/*
 * Charging points map application
 */
var use_local = true;

var api_key = 'AIzaSyCVVVScZlP4Qbq4J3fTMxtbu4H62KWV8tY';
var data_url = (use_local) ?
			'data/chargepoint.json' : 
			'http://chargepoints.dft.gov.uk/api/retrieve/registry/format/json/SubscriptionRequiredFlag/false';

var data = {};
var map, infoWindow;
var markers = [];
locationMarker = null;

var handleLocation = (navigator.geolocation);

window.onload = loadMapScript;

$(document).ready(function(){
	loadData(startApplication);
});

function loadMapScript() {
	var script = document.createElement('script');
	 script.type = 'text/javascript';
	 script.src = 'https://maps.googleapis.com/maps/api/js?' +
	 'key=' + api_key +
	 '&callback=loadDefaultMap'; 
	 document.body.appendChild(script);
}

function loadDefaultMap() {
	var mapProp= {
		    center:new google.maps.LatLng(54.7961254,-4.1404025),
		    zoom:5,
	};
	map= new google.maps.Map(document.getElementById("map"),mapProp);
}

function loadData(callbackWhenLoaded) {
	$('#loader').fadeIn('slow');
	$.ajax({
		url: data_url, 
		success: function(result){
			console.log(result);
			callbackWhenLoaded(result);
		},
		error: function(error){
            alert("An error occured: " + error.status + " " + error.statusText);
        }
	});
}

function startApplication(result) {
	data = processData(result)
	populateMap(data);
	
	if (handleLocation) {
		$('#btnLocation').fadeIn('slow');
		$('#btnLocation').click(goToMyLocation);
	}
	
	infoWindow = new google.maps.InfoWindow;
	$('#loader').fadeOut('slow');
}

function processData(inputData, connectorType) {
	var outputData = {};
	outputData.ChargeDevice = [];
	var noOfChargepoints = inputData.ChargeDevice.length;
	for(var i =0; i < noOfChargepoints; i++) {
		var pushEntry = false;
		pushEntry = (!inputData.ChargeDevice[i].SubscriptionRequiredFlag)
		if (connectorType != undefined) {
			var noOfConnectors = inputData.ChargeDevice[i].Connector.length;
			var connectorFound = false;
			for (var j = 0; j < noOfConnectors; j++)
				if (inputData.ChargeDevice[i].Connector[j].ConnectorType == connectorType)
					connectorFound = true;
			pushEntry = pushEntry && connectorFound;
		}
		if (pushEntry)
			outputData.ChargeDevice.push(inputData.ChargeDevice[i]);
	}
	return outputData
}

function populateMap(inputData) {
	var noOfMarkers = markers.length;
	for(var i =0; i < noOfMarkers; i++)
		markers[i].setMap(null);
	markers = [];
	var noOfChargepoints = inputData.ChargeDevice.length;
	for(var i =0; i < noOfChargepoints; i++) {
		var pos = {
			lat: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Latitude), 
			lng: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Longitude)
		};
		var marker = new google.maps.Marker({
			position: {
				lat: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Latitude), 
				lng: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Longitude)
			},
			icon: 'images/markers/electric_charger.png'
		});
		var title = inputData.ChargeDevice[i].ChargeDeviceName
		marker.addListener('click', function() {
			infoWindowOpen(pos, infoWindow, title, 'test text', marker);
	    });
		markers.push( 
			marker
		);
	}
    var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'images/markers/m'});	
}

function goToMyLocation() {
	navigator.geolocation.getCurrentPosition(
		function(position) {
			var pos = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			map.setCenter(pos);
			map.setZoom(12);
			if (locationMarker != null)
				locationMarker.setMap(null);
			locationMarker = new google.maps.Marker({
				map: map,
				position: pos,
				title: 'Your current location',
				icon: 'images/markers/you_are_here.png',
				animation: google.maps.Animation.DROP
			})
		}, 
		function() {
			handleLocationError(true, infoWindow, map.getCenter());
		}
	);
	return false;
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

function infoWindowOpen(pos, infoWindow, title, text, marker) {
	var content = '<div class="info_window"><div class="title">' + title +
		'</div><div class="text">' + text + '</div></div>';
    infoWindow.setPosition(pos);
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}
