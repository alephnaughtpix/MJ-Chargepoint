/*
 * Charging points map application
 */
var use_local = true;

var api_key = 'AIzaSyCVVVScZlP4Qbq4J3fTMxtbu4H62KWV8tY';
var data_url = (use_local) ?
			'data/chargepoint.json' : 
			'http://chargepoints.dft.gov.uk/api/retrieve/registry/format/json/SubscriptionRequiredFlag/false';

var data = {};
var displayData = {};
var map, infoWindow;
var markers = [];
locationMarker = null;

var handleLocation = (navigator.geolocation);

window.onload = loadMapScript;

function loadMapScript() {
	var script = document.createElement('script');
	 script.type = 'text/javascript';
	 script.src = 'http://maps.googleapis.com/maps/api/js?' +
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
	loadData(startApplication);
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
	displayData = data;
	populateMap(displayData);
	
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
		var iconUrl = 'images/markers/electric_charger'+ 
		((inputData.ChargeDevice[i].Accessible24Hours) ? '_24h' : '')
		+ '.png';
		var pos = {
			lat: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Latitude), 
			lng: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Longitude)
		};
		var marker = new google.maps.Marker({
			position: {
				lat: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Latitude), 
				lng: eval(inputData.ChargeDevice[i].ChargeDeviceLocation.Longitude)
			},
			icon: iconUrl
		});
		marker.set('charger_id', i);
		var title = inputData.ChargeDevice[i].ChargeDeviceName
		marker.addListener('click', function() {
			var chargerID = this.get('charger_id');
			var chargerData = displayData.ChargeDevice[this.get('charger_id')];
			var pos = {
				lat: eval(chargerData.ChargeDeviceLocation.Latitude), 
				lng: eval(chargerData.ChargeDeviceLocation.Longitude)
			};
			infoWindowOpen(pos, infoWindow, chargerData.ChargeDeviceName, chargerDetails(chargerData), marker);
	    });
		markers.push( 
			marker
		);
	}
    var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'images/markers/m'});	
}

function chargerDetails(chargerData) {
	var content = '<div class="charger_info">';
	content += '<div class="address more_container">Address:';
	content += '<div class="more_container-data">';
	var addressData = chargerData.ChargeDeviceLocation.Address;
	if (addressData.SubBuildingName)
		content += addressData.SubBuildingName + '<br/>';
	if (addressData.BuildingName)
		content += addressData.BuildingName + '<br/>';
	if (addressData.BuildingNumber)
		content += addressData.BuildingNumber;
	if (addressData.Thoroughfare)
		content += addressData.Thoroughfare + '<br/>';
	if (addressData.Street)
		content += addressData.Street + '<br/>';
	if (addressData.PostTown)
		content += addressData.PostTown + '<br/>';
	if (addressData.County)
		content += addressData.County + '<br/>';
	if (addressData.PostCode)
		content += addressData.PostCode + '<br/>';
	if (chargerData.Accessible24Hours)
		content += '<div class="access_24_hours">24 Hour access</div>';
	content += '</div>';
	content += '</div>';
	content += '</div>';
	return content;
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
			locationMarker.addListener('click', function() {
				infoWindowOpen(locationMarker.postion, infoWindow, null, 'Your current location', locationMarker);
		    });
		}, 
		function() {
			handleLocationError(true, infoWindow, map.getCenter());
		}
	);
	return false;
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
	infoWindowOpen(pos, infoWindow, 'Error', 
			browserHasGeolocation ?
                    'Error: The Geolocation service failed.' :
                    'Error: Your browser doesn\'t support geolocation.', 
    null);
}

function infoWindowOpen(pos, infoWindow, title, text, marker) {
	var content = '<div class="info_window">';
	if (title != null)
		content += '<div class="title">' + title + '</div>';
	if (text != null)
		content += '<div class="text">' + text + '</div>';
	content += '</div>';
    infoWindow.setPosition(pos);
    infoWindow.setContent(content);
    if (marker != null)
    	infoWindow.open(map, marker);
    else
    	infoWindow.open(map);
}
