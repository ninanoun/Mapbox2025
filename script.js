// Configuration de la carte
var map = new maplibregl.Map({
container: 'map',
style: 'https://openmaptiles.geo.data.gouv.fr/styles/positron/style.json', // Fond de carte
center: [-1.68, 48.11], // lat/long
zoom: 11.5, // zoom
pitch:20, // Inclinaison
bearing: 0 // Rotation
});


// Gestion du changement de style
document.getElementById('style-selector').addEventListener('change', function () {
    map.setStyle(this.value);
    map.once('style.load', addLayers); // Recharge les couches après changement de style
  });


// Boutons de navigation
var nav = new maplibregl.NavigationControl();
map.addControl(nav, 'top-left');

// Ajout Echelle cartographique
map.addControl(new maplibregl.ScaleControl({
maxWidth: 120,
unit: 'metric'}));

// Bouton de géolocalisation
map.addControl(new maplibregl.GeolocateControl
({positionOptions: {enableHighAccuracy: true},
trackUserLocation: true,
showUserHeading: true}));



// Fonction pour ajouter les couches
function addLayers() {
  
  // Ajour source OSM
map.addSource('mapbox-streets-v8', {
type: 'vector',
url: 'https://openmaptiles.geo.data.gouv.fr/data/france-vector.json'});
  
  
    // La couche des routes
  
map.addLayer({
"id": "Routes",
"type": "line",
"source": "mapbox-streets-v8",
"layout": {'visibility': 'visible'},
"source-layer": "transportation",
"filter": ["all", ["in", "class", "motorway", "trunk", "primary"]],
"paint": {"line-color": "#ff6700 ", "line-width": 1},
"maxzoom": 15.5
});
  
// Hydrologie
map.addLayer({"id": "hydrologie",
"type": "fill",
"source": "mapbox-streets-v8",
"source-layer": "water",
"layout": {'visibility': 'visible'},
"paint": {"fill-color": "#4dd2ff"}
});
  
  
  
  
//BATIMENTS IGN 
map.addSource('BDTOPO', {
type: 'vector',
url: 'https://data.geopf.fr/tms/1.0.0/BDTOPO/metadata.json',
minzoom: 15,
maxzoom: 19
});
map.addLayer({
'id': 'batiments',
'type': 'fill-extrusion',
'source': 'BDTOPO',
'source-layer': 'batiment',
'layout': {'visibility': 'visible'},
'paint': {'fill-extrusion-color': {'property': 'hauteur',
'stops': [[1, '#1a9850'],
         [5, '#91cf60'],
         [10, '#d9ef8b'],
         [20, '#ffffbf'],
         [30, '#fee08b'],
         [40, '#fc8d59'],
         [50, '#d73027']]},
'fill-extrusion-height':{'type': 'identity','property': 'hauteur'},
'fill-extrusion-opacity': 0.90,
'fill-extrusion-base': 0}
});
   
  
// AJOUT DU CADASTRE ETALAB
map.addSource('Cadastre', {
type: 'vector',
url: 'https://openmaptiles.geo.data.gouv.fr/data/cadastre.json' });
map.addLayer({
'id': 'Cadastre',
'type': 'line',
'source': 'Cadastre',
'source-layer': 'parcelles',
'layout': {'visibility': 'none'},
"filter": ['>', 'contenance', 1000],  
'paint': {'line-color': '#000000'},
'minzoom':16, 'maxzoom':19 });
map.setPaintProperty('communeslimites', 'line-width', ["interpolate",["exponential",1],["zoom"],16,0.3,18,1]); 
  
  
  
// COntour de la ville de Rennes

dataCadastre = 'https://apicarto.ign.fr/api/cadastre/commune?code_insee=35238';
jQuery.when( jQuery.getJSON(dataCadastre)).done(function(json) {
for (i = 0; i < json.features.length; i++) {
json.features[i].geometry = json.features[i].geometry;
};
map.addLayer(
{'id': 'Contourcommune',
'type':'line',
'source': {'type': 'geojson','data': json},
'paint' : {'line-color': 'black',
'line-width':2.5},
'layout': {'visibility': 'none'},
});
});

  
  
// PLU

dataPLU = 'https://apicarto.ign.fr/api/gpu/zone-urba?partition=DU_243500139';
jQuery.when(jQuery.getJSON(dataPLU)).done(function(json) {
// Filtrer les entités pour ne garder que celles avec typezone = 'U'
var filteredFeatures = json.features.filter(function(feature)
{return feature.properties.typezone === 'N';});
// Créer un objet GeoJSON avec les entités filtrées
var filteredGeoJSON = { type: 'FeatureCollection', features: filteredFeatures};
map.addLayer({
'id': 'PLU',
'type': 'fill',
'source': {'type': 'geojson',
'data': filteredGeoJSON},
"layout": {'visibility': 'none'},
'paint': {'fill-color': 'green',
'fill-opacity': 0.5},
});
})


// AJOUT PARCS RELAIS

$.getJSON('https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/tco-parcsrelais-star-etat-tr/records?limit=20',
function(data) {var geojsonData4 = {
type: 'FeatureCollection',
features: data.results.map(function(element) {
return {type: 'Feature',
geometry: {type: 'Point',
coordinates: [element.coordonnees.lon, element.coordonnees.lat]},
properties: { name: element.nom,
capacity: element.jrdinfosoliste}};
})
};
                
map.addLayer({ 'id': 'Parcrelais',
'type':'circle',
'source': {'type': 'geojson',
'data': geojsonData4},
'paint': {'circle-color': '#0F4C81', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-radius': {property: 'capacity',
                                                       type: 'exponential',
                                                       stops: [[1, 5],[500, 40]]}}
});
});



// AJOUT STATIONS VLS

$.getJSON('https://data.explore.star.fr/api/explore/v2.1/catalog/datasets/vls-stations-etat-tr/records?limit=60',
function(data) {var geojsonVLS = {
type: 'FeatureCollection',
features: data.results.map(function(element) {
return {type: 'Feature',
geometry: {type: 'Point',
coordinates: [element.coordonnees.lon, element.coordonnees.lat]},
properties: { nom: element.nom,
emplacements: element.nombreemplacementsdisponibles,
velos: element.nombrevelosdisponibles}};
})
};
map.addLayer({ 'id': 'VLS',
'type':'circle',
'source': {'type': 'geojson',
'data': geojsonVLS},
"layout": {'visibility': 'none'},             
'paint': {'circle-color': 'pink', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-radius': {property: 'velos',
                                                       type: 'exponential',
                                                       stops: [[1, 5],[50, 10]]}
         
         
         }
});
});


// AJOUT OSM API OVERPASS

const ville = "Rennes";
$.getJSON(`https://overpass-api.de/api/interpreter?data=[out:json];area[name="${ville}"]->.searchArea;(node["shop"="bakery"](area.searchArea););out center;`,
function(data) {var geojsonData = {
type: 'FeatureCollection',
features: data.elements.map(function(element) {
return {type: 'Feature',
geometry: { type: 'Point',coordinates: [element.lon, element.lat] },
properties: {}};
})
};
map.addSource('customData', {
type: 'geojson',
data: geojsonData
});
map.addLayer({
'id': 'boulangeries',
'type': 'circle',
'source': 'customData',
 "layout": {'visibility': 'none'},
'paint': {'circle-color': 'green',
'circle-radius': 5},
});
});

$.getJSON(`https://overpass-api.de/api/interpreter?data=%2F*%0AThis%20query%20looks%20for%20nodes%2C%20ways%20and%20relations%20%0Awith%20the%20given%20key%2Fvalue%20combination.%0AChoose%20your%20region%20and%20hit%20the%20Run%20button%20above%21%0A*%2F%0A%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%2F%2F%20gather%20results%0Away%5B%22railway%22%3D%22subway%22%5D%2848.07671221987471%2C-1.7293240614840435%2C48.136088883744534%2C-1.6117360182711529%29%3B%0A%2F%2F%20print%20results%0Aout%20geom%3B`,
function(data) {var geojsonmetro = {
type: 'FeatureCollection',
features: data.elements.map(function(element) {
return {type: 'Feature',
geometry: {type: 'LineString', coordinates: element.geometry.map(coord => [coord.lon, coord.lat]) // Correction ici
                    },
  
properties: {}};
})
};
map.addSource('customData2', {
type: 'geojson',
data: geojsonmetro
});
map.addLayer({
'id': 'lignemetro',
'type': 'line',
'source': 'customData2',
'paint': {'line-color': 'red'},
 'layout': {'visibility': 'none'}
});
});

// ARRETS DE BUS OSM
  
  
  
  $.getJSON(`https://overpass-api.de/api/interpreter?data=[out:json];area[name="${ville}"]->.searchArea;(node["highway"="bus_stop"](area.searchArea););out center;`,
function(data) {var geojsonbus = {
type: 'FeatureCollection',
features: data.elements.map(function(element) {
return {type: 'Feature',
geometry: { type: 'Point',coordinates: [element.lon, element.lat] },
properties: {}};
})
};
map.addSource('customData3', {
type: 'geojson',
data: geojsonbus
});
map.addLayer({
'id': 'Arrets',
'type': 'circle',
'source': 'customData3',
 "layout": {'visibility': 'none'},
'paint': {'circle-color': 'red',
'circle-radius': 2},
});
});
  
  
  
      switchlayer = function (lname) {
            if (document.getElementById(lname + "CB").checked) {
                map.setLayoutProperty(lname, 'visibility', 'visible');
            } else {
                map.setLayoutProperty(lname, 'visibility', 'none');
           }
        }

  
// FIN DU MAP ON
  
  }


// Ajout des couches au chargement initial
map.on('load', addLayers);

// Gestion du changement de style
document.getElementById('style-selector').addEventListener('change', function () {
    map.setStyle(this.value);
    map.once('style.load', addLayers); // Recharge les couches après changement de style
});



// INTERACTIVITE


// COUCHE BUS CLICK

//Interactivité CLICK BUS
map.on('click', function (e) {
var features = map.queryRenderedFeatures(e.point, { layers: ['VLS'] });
if (!features.length) {
return;
}
var feature = features[0];
var popup = new maplibregl.Popup({ offset: [0, -15] })
.setLngLat(feature.geometry.coordinates)
.setHTML('<h2>' + feature.properties.nom + '</h2><hr><h3>'
+ feature.properties.emplacements + ' socles libres </h3><h3>'
+ feature.properties.velos + ' vélos libres </h3>' )
.addTo(map);
});


map.on('mousemove', function (e) {
var features = map.queryRenderedFeatures(e.point, { layers: ['Arrets'] });
map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});


//Interactivité CLICK BUS
map.on('click', function (e) {
var features = map.queryRenderedFeatures(e.point, { layers: ['Arrets'] });
if (!features.length) {
return;
}
var feature = features[0];
var popup = new maplibregl.Popup({ offset: [0, -15] })
.setLngLat(feature.geometry.coordinates)
.setHTML('<h3>' + feature.properties.nom + '</h3><hr><h4>'
+"Mobilier : " + feature.properties.mobilier + '</h4>' )
.addTo(map);
});
map.on('mousemove', function (e) {
var features = map.queryRenderedFeatures(e.point, { layers: ['Arrets'] });
map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});



// INTERACTIVITE PARCS RELAIS HOVER
var popup = new maplibregl.Popup({className: "Mypopup", closeButton: false,closeOnClick: false });
map.on('mousemove', function(e) {
var features = map.queryRenderedFeatures(e.point, { layers: ['Parcrelais'] });
// Change the cursor style as a UI indicator.
map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
if (!features.length) {
popup.remove();
return; }
var feature = features[0];
popup.setLngLat(feature.geometry.coordinates)
.setHTML('<h3>' +  feature.properties.name + '</h3><hr><h4>'
 + feature.properties.capacity  +'  places disponibles 😱</h4>')
.addTo(map);
});


// ONGLETS GEOGRAPHIQUE

// Configuration onglets geographiques
document.getElementById('Charly').addEventListener('click', function ()
{ map.flyTo({zoom: 16,
center: [-1.672, 48.1043],
pitch: 30});
});

// Configuration onglets geographiques
document.getElementById('Rennes1').addEventListener('click', function ()
{ map.flyTo({zoom: 16,
center: [-1.642, 48.1043],
pitch: 30});
});

// Configuration onglets geographiques
document.getElementById('Rennes2').addEventListener('click', function ()
{ map.flyTo({zoom: 16,
center: [-1.682, 48.1013],
pitch: 30});
});