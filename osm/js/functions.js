/**
 * Loop on the Json array and add markers
 * to the layerGroup
 * @param {*} jsonArray 
 * @param {*} layerGroup 
 */
function addRestaurantMarkers(jsonArray, layerGroup) {
  for (var i = 0; i < jsonArray.length; ++i) {
    if (!jsonArray[i].url) { // check null and empty string
      // marker has no url, display name only
      var popupContent = getPopupContent(jsonArray[i].name, "")
    }
    else {
      // add the url in a link
      var popupContent = getPopupContent(`
        <a href="${jsonArray[i].url}" target="_blank">${jsonArray[i].name}</a>`, "")
    }

    var divIcon = getDivIcon(jsonArray[i].emoji)
    addMarker(jsonArray[i].lat, jsonArray[i].lng, divIcon, popupContent, layerGroup)
  }
}

/**
 * Loop on the Json array and add markers
 * to the layerGroup
 * @param {*} jsonArray 
 * @param {*} layerGroup 
 */
function addParkingMarkers(jsonArray, layerGroup) {
  jsonArray.records.forEach(item => {
    var statusColor = item.fields.status === "OUVERT" ? "🟢" : "🔴"
    var iconColor = item.fields.status === "OUVERT" ? greenIcon : redIcon
    // check if the parking has less than 30% place available
    var lowPercent = calculatePercent(30, item.fields.max)
    if (item.fields.free <= lowPercent) {
      statusColor = "🟠"
      iconColor = orangeIcon
    }

    var popupContent = getPopupContent(
      `${item.fields.key} ${statusColor}`, // header
      `Free : ${item.fields.free}/${item.fields.max}` // content
    )

    addMarker(item.fields.geo[0],
      item.fields.geo[1],
      iconColor, // custom icon from leaflet-color-markers folder
      popupContent,
      layerGroup);
  });
}

/**
 * Add a marker in the layerGroup
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} customIcon icon for the marker (could be an object or a string)
 * @param {string} popupContent 
 * @param {object} layerGroup 
 */
function addMarker(lat, lng, customIcon, popupContent, layerGroup) {
  var usableIcon = customIcon;

  /* Replaced by "getDivIcon" method (keep here for reference) */
  /*if (typeof customIcon === typeof "") {
    // CustomIcon is a string, we need to convert it to a usable object
    usableIcon = L.divIcon({
      html: `<div class="emoji-marker">${customIcon}</div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42], // half of width + height
      popupAnchor: [0, -30] // popup on top
    });
  }*/

  var markerOptions = {
    icon: usableIcon
  }

  // set className to use in CSS
  var popupOptions = {
    'maxWidth': '500',
    'className': 'custom-popup'
  }

  new L.marker([lat, lng], markerOptions)
    .bindPopup(popupContent, popupOptions)
    .addTo(layerGroup)
}

/**
 * Create the content to add in the popup
 * @param {string} header 
 * @param {string} content 
 * @returns the div with formated content
 */
function getPopupContent(header, content) {
  return `
    <div>
      <div class="custom-header">${header}</div>
      <div class="custom-content">${content}</div>
    </div>`
}

/**
 * Return an icon object containing the given string.
 * @param {string} inputString 
 */
function getDivIcon(inputString) {
  let displayString = inputString;
  if (!isNaN(parseFloat(inputString)) && isFinite(inputString)) {
    // inputString is a number, extract the decimal part
    const decimalPart = inputString.split('.')[1];
    if (decimalPart) {
      displayString = decimalPart;
    }
  }
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="background-color:#c30b82;" class="marker-pin"></div>
      <span>${displayString}</span>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42], // half of width + height
    popupAnchor: [0, -30] // popup on top
  });
}


/**
 * Custom function that calculates the percent of a number
 * @param {number} percent The percent (float) that you want to get
 * @param {number} num The number (float or int) that you want to calculate the percent of
 * @returns {Number}
 */
function calculatePercent(percent, num) {
  return (percent / 100) * num;
}
