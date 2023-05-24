const divColorRef = document.getElementById("colorRef");
const divColorGuide = document.getElementById("colorGuide");
const pathImg = "./resources/color-ref";
const pathGuide = "./resources/color-guide";
const imgSize = 100;

// +-----------------+
// | Color Reference |
// +-----------------+
function orderByName() {
  renderAlphaNumOrder("figcaption");
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
  const colors = divColorRef.querySelectorAll("figure");

  // convert to an array (to use the sort method)
  const colorsArray = Array.prototype.slice.call(colors, 0);

  const colorsOrdered = alphaNumSort(colorsArray, selectorStr);

  // clean and add the ordered list
  divColorRef.innerHTML = null;
  colorsOrdered.forEach(function (item, index) {
    divColorRef.append(item.cloneNode(true));
  });
}

function renderClustersOrder(selectorStr) {
  // get all <figure> tag elements
  const colors = divColorRef.querySelectorAll("figure");

  // convert to an array (to use the sort method)
  const colorsArray = Array.prototype.slice.call(colors, 0);

  const clusters = sortWithClusters(colorsArray, selectorStr);

  // clean and add the ordered list
  divColorRef.innerHTML = null;
  clusters.forEach(function (item, index) {
    item.colors.forEach(function (item, index) {
      divColorRef.append(item.cloneNode(true));
    });
  });
}


fetch(`${pathImg}/all-ref.json`)
  .then(response => { return response.json(); })
  .then(data => {
    // loop on each string
    data.forEach(paintName => {
      const fullPathImg = `${pathImg}/${paintName}.png`;

      // construct each color block
      const fig = document.createElement("figure");
      const img = new Image();
      img.src = fullPathImg;
      img.height = imgSize;
      const figCapt = document.createElement("figcaption");
      figCapt.append(paintName);

      fig.appendChild(img);
      fig.appendChild(figCapt);
      divColorRef.appendChild(fig);

      // wait the loading of the image, to use it inside a canvas
      img.onload = function () {
        const color1 = document.createElement("div");
        color1.setAttribute("id", "1");
        color1.append(getColorByBrowser(img));
        fig.appendChild(color1);
        const color2 = document.createElement("div");
        color2.setAttribute("id", "2");
        color2.append(getAverageRGB(img));
        fig.appendChild(color2);
        const color3 = document.createElement("div");
        color3.setAttribute("id", "3");
        color3.append(getColorsFreq(img));
        fig.appendChild(color3);
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