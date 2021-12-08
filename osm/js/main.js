/*
/!\ DISCLAIMER /!\

To debug localy on Firefox :
In response to CVE-2019-11730, Firefox 68 and later define the origin of a page 
opened using a file:/// URI as unique. Therefore, other resources in the same 
directory or its subdirectories no longer satisfy the CORS same-origin rule. 
This new behavior is enabled by default using the 'privacy.file_unique_origin' preference. 
*/

// =======================
//        INIT MAP
// =======================
// create a new map, assigns it to the ‘map’ div and sets some options
var map = L.map('map', {
  center: [48.1101, -1.6607],
  zoom: 13,
})

// add a simple tile layer
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: ['a', 'b', 'c']
}).addTo(map);

// =======================
//     INIT VARIABLES
// =======================
var lgRestaurant = L.layerGroup();
var lgParking = L.layerGroup();

// =======================
//        METHODS
// =======================
/**
 * Add markers to the layerGroup if it's empty,
 * then toggle it's visibility
 * @param {*} element
 */
function toggleRestaurantCheckbox(element) {
  if (element.type != "checkbox") {
    // the method doesn't know the element
    return;
  }

  if (element.checked) {
    if (lgRestaurant.getLayers().length === 0) {
      // our layerGroup is empty, we load data from the file
      fetch("./ressources/data/restaurant.json")
        .then(response => { return response.json(); })
        .then(data => addRestaurantMarkers(data, lgRestaurant));
    }
    // add markers on the map
    lgRestaurant.addTo(map);
  }
  else {
    // remove markers from the map
    map.removeLayer(lgRestaurant);
  }
}

/**
 * Add or remove elements in the layerGroup
 * @param {*} element
 */
function toggleParkingCheckbox(element) {
  if (element.type != "checkbox") {
    // the method doesn't know the element
    return;
  }

  if (element.checked) {
    // disable checkbox while loading data
    element.disabled = true;

    // load data from the API.
    // Doc : https://data.rennesmetropole.fr/explore/dataset/export-api-parking-citedia/information/
    fetch("https://data.rennesmetropole.fr/api/records/1.0/search/?dataset=export-api-parking-citedia")
      .then(response => { return response.json(); })
      .then(data => {
        addParkingMarkers(data, lgParking)
        element.disabled = false;
      });

    // add markers on the map
    lgParking.addTo(map);
  }
  else {
    // clear layerGroup, because data are recalculated everytime
    lgParking.clearLayers();
  }
}