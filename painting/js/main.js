const divColorRef = document.getElementById("colorRef");
const divColorGuide = document.getElementById("colorGuide");
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

function renderAlphaNumOrder(selectorStr) {
  // get all <figure> tag elements
  const figsNodeList = divColorRef.querySelectorAll("figure");

  // convert to an array (to use the sort method)
  const figsArray = Array.prototype.slice.call(figsNodeList, 0);

  const figsOrdered = alphaNumSort(figsArray, selectorStr);

  // clean and add the ordered list
  divColorRef.innerHTML = null;
  figsOrdered.forEach(function (figItem, index) {
    cleanBackground(figItem);
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
      cleanBackground(figItem);

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
 * clean background color from all div
 */
function cleanBackground(figItem) {
  // clean background from all div
  const divsColor = figItem.querySelectorAll("figcaption > div[id]");
  divsColor.forEach((divItem) => {
    divItem.style.background = null;
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
fetch(`${pathGuide}/drg-grunt.json`)
  .then(response => { return response.json(); })
  .then(data => {
    // loop on each JSON objects
    data.forEach(element => {
      divColorGuide.innerHTML += element.section
      // loop on paint IDs (to retrieve the images)
      element.paints.forEach(paintName => {
        var fullPathImg = `${pathImg}/${paintName}.png`
        divColorGuide.innerHTML += `<img src=${fullPathImg} title=${paintName} height=${imgSize}/>`
      })
      divColorGuide.innerHTML += "<br/>"
    });
  });