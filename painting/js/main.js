const divColorRef = document.getElementById("colorRef");
const pathImg = "./resources/color-ref";
const pathGuide = "./resources/color-guide";
const imgSize = 100;

// +-----------------+
// | Color Reference |
// +-----------------+
function orderByName() {
  renderAlphaNumOrder("figcaption > div[id='paintName']");
}

function orderByHexBrowser() {
  renderClustersOrder("div[id='1']");
}

function orderByHexAverage() {
  renderClustersOrder("div[id='2']");
}

function orderByHexFreq() {
  renderClustersOrder("div[id='3']");
}

var cleanUpAllSwitch = true;
function cleanUpUI() {
  resetFigcaptionStyle(divColorRef);

  // alternate visibility, each time button is pressed
  var selectorString = "";
  if (cleanUpAllSwitch) {
    // select all to disappear
    selectorString = "figcaption > div[id]";
  }
  else {
    // select only the Hex codes
    selectorString = "figcaption > div[id]:not(:first-child)"
  }
  cleanUpAllSwitch = !cleanUpAllSwitch;

  const divsColor = divColorRef.querySelectorAll(selectorString);
  divsColor.forEach((divItem) => {
    divItem.style.display = "none";
  });
}

function renderAlphaNumOrder(selectorStr) {
  // get all <figure> tag elements
  const figsNodeList = divColorRef.querySelectorAll("figure");

  // convert to an array (to use the sort method)
  const figsArray = Array.prototype.slice.call(figsNodeList, 0);

  const figsOrdered = alphaNumSort(figsArray, selectorStr);

  // clean and add the ordered list
  divColorRef.innerHTML = null;
  figsOrdered.forEach(function (figItem, index) {
    resetFigcaptionStyle(figItem);
    divColorRef.append(figItem.cloneNode(true));
  });
}

function renderClustersOrder(selectorStr) {
  // get all <figure> tag elements
  const figsNodeList = divColorRef.querySelectorAll("figure");

  // convert to an array (to use the sort method)
  const figsArray = Array.prototype.slice.call(figsNodeList, 0);

  const clusters = sortWithClusters(figsArray, selectorStr);

  // clean and add the ordered list
  divColorRef.innerHTML = null;
  clusters.forEach(function (item, index) {
    item.colors.forEach(function (figItem, index) {
      resetFigcaptionStyle(figItem);

      // get color from div (of the selected algo)
      const hexColor = figItem.querySelector(selectorStr).innerHTML;
      // set background color
      figItem.querySelector(selectorStr).style.background = hexColor;
      // add to main div wrapper
      divColorRef.append(figItem.cloneNode(true));
    });
  });
}

/** 
 * reset style of all div
 */
function resetFigcaptionStyle(figItem) {
  const divsColor = figItem.querySelectorAll("figcaption > div[id]");
  divsColor.forEach((divItem) => {
    divItem.style.background = null;
    divItem.style.display = null;
  });
}


fetch(`${pathImg}/all-ref.json`)
  .then(response => { return response.json(); })
  .then(data => {
    // loop on each string
    data.forEach(paintName => {
      const fullPathImg = `${pathImg}/${paintName}.png`;

      // construct each <figure> block
      const fig = document.createElement("figure");
      divColorRef.appendChild(fig);

      const img = new Image();
      img.src = fullPathImg;
      img.height = imgSize;
      fig.appendChild(img);

      const figCapt = document.createElement("figcaption");
      const divName = document.createElement("div");
      divName.setAttribute("id", "paintName");
      divName.append(paintName);
      figCapt.append(divName);
      fig.appendChild(figCapt);

      // wait the loading of the image, to use it inside a canvas
      img.onload = function () {
        const color1 = document.createElement("div");
        color1.setAttribute("id", "1");
        color1.append(getColorByBrowser(img));
        figCapt.appendChild(color1);
        const color2 = document.createElement("div");
        color2.setAttribute("id", "2");
        color2.append(getAverageRGB(img));
        figCapt.appendChild(color2);
        const color3 = document.createElement("div");
        color3.setAttribute("id", "3");
        color3.append(getColorsFreq(img));
        figCapt.appendChild(color3);
      };
    });
  });

// +-------------+
// | Color Guide |
// +-------------+
function constructAndGetGridColors(data) {
  let allItems = new Array();
  
  // loop on each JSON objects
  data.forEach(item => {
    const divItem = document.createElement("div");
    const divItemName = document.createElement("div");
    divItemName.append(item.model);
    divItemName.style.fontWeight = "bold";
    divItem.appendChild(divItemName);
    divItem.style.border = "1px solid lightgray";
    // loop on parts
    item.parts.forEach(part => {
      const divPart = document.createElement("div");
      const divPartName = document.createElement("div");
      divPartName.append(part.section);
      divPartName.style.borderTop = "1px solid lightgray";
      divPart.append(divPartName);
      // loop on paint IDs (to retrieve the images)
      part.paints.forEach(paintName => {
        var fullPathImg = `${pathImg}/${paintName}.png`
        const img = new Image();
        img.src = fullPathImg;
        img.height = imgSize;
        img.title = paintName;
        divPart.appendChild(img);
      });
      divItem.appendChild(divPart);
    });
    allItems.push(divItem);
  });

  return allItems;
}

fetch(`${pathGuide}/drg-mobs.json`)
  .then(response => { return response.json(); })
  .then(data => {
    const divToAppend = document.getElementById("drg-mob");
    constructAndGetGridColors(data)
      .forEach((item) => divToAppend.appendChild(item));
  });

fetch(`${pathGuide}/drg-player.json`)
  .then(response => { return response.json(); })
  .then(data => {
    const divToAppend = document.getElementById("drg-player");
    constructAndGetGridColors(data)
      .forEach((item) => divToAppend.appendChild(item));
  });

fetch(`${pathGuide}/w40-ultra.json`)
  .then(response => { return response.json(); })
  .then(data => {
    const divToAppend = document.getElementById("w40k-ultra");
    constructAndGetGridColors(data)
      .forEach((item) => divToAppend.appendChild(item));
  });
