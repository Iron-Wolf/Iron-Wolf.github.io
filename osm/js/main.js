/*
/!\ DISCLAIMER /!\

To debug localy on Firefox :
In response to CVE-2019-11730, Firefox 68 and later define the origin of a page 
opened using a file:/// URI as unique. Therefore, other resources in the same 
directory or its subdirectories no longer satisfy the CORS same-origin rule. 
This new behavior is enabled by default using the 'privacy.file_unique_origin' preference. 
*/

// =======================
//    INIT RAINBOW TEXT
// =======================
var greetings = [
  "Light mode 4 ever",
  "Dark mode is ****",
  "OMG !",
  "Made with ❤️",
  "Adopt a 🐧",
  "Fork me 🍴",
  "Tested on Linux",
  "Tested on Firefox",
  "Need help ?",
  "CSS4 isn't a thing",
  "Lezgongue",
  "La légendre"
];
var greetingId = Math.floor(Math.random() * greetings.length);
document.getElementById('rainbowTextId').innerHTML = greetings[greetingId];

// =======================
//        INIT MAP
// =======================
// create a new map, assigns it to the ‘map’ div and sets some options
var map = L.map('map', {
  center: [48.1101, -1.6607],
  zoom: 13,
})

// coords can be extracted with : https://nominatim.openstreetmap.org
var cornerNW = L.latLng(48.1503, -1.7891)
var cornerSE = L.latLng(48.0746, -1.5331)
var boundsRennes = L.latLngBounds(cornerNW, cornerSE);

// add a simple tile layer
var tileLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: ['a', 'b', 'c'],
  maxNativeZoom: 19, // max value authorized by the leaflet API, to retrieve the map tiles
  maxZoom: 20, // allow to zoom beyond the maxNativeZoom (but image will be blurred)
  crossOrigin: true, // tile caching
  bounds: boundsRennes,
}).addTo(map);

// debug leaflet map
// tileLayer.on('tileloadstart', function(e) {
//   console.log('Tile (' + e.coords.x + ', ' + e.coords.y + ') at zoom level ' + e.coords.z + ' started loading.');
// });

// =======================
//     INIT VARIABLES
// =======================
var lgRestauFav = L.layerGroup();
var lgRestauGoogle = L.layerGroup();
var lgParking = L.layerGroup();
var lgParkingStar = L.layerGroup();

// =======================
//        METHODS
// =======================

// Set the speed outside of the function, because it's
// not possible to change speed on mid-animation in CSS.
// We need to use a JS lib or create our own custom animation.
var randomSpeed = getRandomFloat(0.1, 1, 2);
function getRandomFloat(min, max, decimals) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

var audio;
/**
 * Add the rotation to the child element (otherwise, 
 * the mouse will be outside the element, as it rotates, because
 * of the rectangle shape).
 * The rotation is applied with a random speed, and use 
 * the existing "rotateKf" KeyFrame in the CSS file.
 * @param {*} element Element where mouse is positionned
 */
function spibidiStart(element) {
  // start animation
  element.children[0].style.animationDuration = randomSpeed + "s";
  element.children[0].style.animationPlayState = "running";

  // start audio
  var audioList = [
    "https://www.myinstants.com/media/sounds/r2d2_scream_converted.mp3",
    "https://www.myinstants.com/media/sounds/r2d2.swf.mp3",
    "https://www.myinstants.com/media/sounds/r2d2-doesnt-feel-that-good.mp3",
    "https://www.myinstants.com/media/sounds/processing-r2d2.mp3",
    "https://www.myinstants.com/media/sounds/r2d2-excited.mp3",
    "https://www.myinstants.com/media/sounds/r2d2-laugh.mp3"
  ];
  var audioId = Math.floor(Math.random() * audioList.length);
  audio = new Audio(audioList[audioId]);

  var promise = audio.play();
  if (promise) {
    //Older browsers may not return a promise, according to the MDN website
    promise.catch(function(error) { 
      alert("😲 Experience d'utilisation non optimale 😲\n" +
        "Il semblerais que la lecture automatique des média soit désactivée.\n" +
        "Pensez à les réactiver, pour profiter de la meilleur experience possible !");
    });
  }
}

function spibidiStop(element) {
  element.children[0].style.animationPlayState = "paused";
  audio.pause();
}

/**
 * Add markers to the layerGroup if it's empty,
 * then toggle it's visibility
 * @param {*} element The input checkbox
 */
function toggleRestauFavCheckbox(element) {
  if (element.type != "checkbox") {
    // the method doesn't know the element
    return;
  }

  if (element.checked) {
    if (lgRestauFav.getLayers().length === 0) {
      // our layerGroup is empty, we load data from the file
      fetch("./resources/data/restaurant_fav.json")
        .then(response => { return response.json(); })
        .then(data => addRestaurantMarkers(data, lgRestauFav));
    }
    // add markers on the map
    lgRestauFav.addTo(map);
  }
  else {
    // remove markers from the map
    map.removeLayer(lgRestauFav);
  }
}

/**
 * Add markers to the layerGroup if it's empty,
 * then toggle it's visibility
 * @param {*} element The input checkbox
 */
function toggleRestauGoogleCheckbox(element) {
  if (element.type != "checkbox") {
    // the method doesn't know the element
    return;
  }

  if (element.checked) {
    if (lgRestauGoogle.getLayers().length === 0) {
      // our layerGroup is empty, we load data from the file
      fetch("./resources/data/restaurant_google_202503.json")
        .then(response => { return response.json(); })
        .then(data => addRestaurantMarkers(data, lgRestauGoogle));
    }
    // add markers on the map
    lgRestauGoogle.addTo(map);
  }
  else {
    // remove markers from the map
    map.removeLayer(lgRestauGoogle);
  }
}

/**
 * Add or remove elements in the layerGroup
 * @param {*} element The input checkbox
 */
function toggleParkingCheckbox(element) {
  if (element.type !== "checkbox") {
    // the method doesn't know the element
    return;
  }

  if (element.checked) {
    // disable checkbox while loading data
    element.disabled = true;

    // Doc : https://data.rennesmetropole.fr/explore/dataset/export-api-parking-citedia/information/
    const rennesApi = "https://data.rennesmetropole.fr/api/records/1.0/search/?dataset=export-api-parking-citedia";
    // Doc : https://data.explore.star.fr/explore/dataset/tco-parcsrelais-star-etat-tr/api/
    const starApi = "https://data.explore.star.fr/api/explore/v2.1/catalog/datasets/tco-parcsrelais-star-etat-tr/records?select=nom%2C%20coordonnees%2C%20etatouverture%2C%20capacitesoliste%2C%20jrdinfosoliste&limit=20";

    Promise.all([
      fetch(rennesApi)
        .then(res => res.json())
        .then(data => {
          addGenericParkingMarkers(data, lgParking, rennesApiExtractor);
          // add markers on the map
          lgParking.addTo(map);
        }),
      fetch(starApi)
        .then(res => res.json())
        .then(data => {
          addGenericParkingMarkers(data, lgParkingStar, starApiExtractor);
          // add markers on the map
          lgParkingStar.addTo(map);
        })
    ])
    .catch(err => console.error("Erreur de chargement :", err))
    .finally(() => {
      element.disabled = false;
    });
  }
  else {
    // clear layerGroup, because data are recalculated everytime
    lgParking.clearLayers();
    lgParkingStar.clearLayers();
  }
}

// =======================
//       EXTRACTORS
// =======================
/**
 * @typedef {Object} ParkingDataExtractor
 * Extractor object used to adapt API-specific data structures to a common format.
 *
 * @property {(data: Object) => Array} getRecords - Extracts the array of records from the API response.
 * @property {(record: Object) => string} getStatus - Extracts the parking status ("OUVERT", etc.).
 * @property {(record: Object) => number} getFree - Extracts the number of free spots.
 * @property {(record: Object) => number} getMax - Extracts the total capacity.
 * @property {(record: Object) => { lat: number, lon: number }} getCoordinates - Extracts GPS coordinates.
 * @property {(record: Object) => string} getName - Extracts the parking name or key.
 */

/** @type {ParkingDataExtractor} */
const rennesApiExtractor = {
  getRecords: data => data.records,
  getStatus: item => item.fields.status,
  getFree: item => item.fields.free,
  getMax: item => item.fields.max,
  getCoordinates: item => ({
    lat: item.fields.geo[0],
    lon: item.fields.geo[1]
  }),
  getName: item => item.fields.key
};

/** @type {ParkingDataExtractor} */
const starApiExtractor = {
  getRecords: data => data.results,
  getStatus: item => item.etatouverture,
  getFree: item => item.jrdinfosoliste,
  getMax: item => item.capacitesoliste,
  getCoordinates: item => ({
    lat: item.coordonnees.lat,
    lon: item.coordonnees.lon
  }),
  getName: item => item.nom
};