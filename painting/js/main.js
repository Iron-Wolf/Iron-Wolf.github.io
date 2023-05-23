const divColorRef = document.getElementById("colorRef");
const divColorGuide = document.getElementById("colorGuide");
const pathImg = "./resources/color-ref";
const pathGuide = "./resources/color-guide";
const imgSize = 100;

// +-----------------+
// | Color Reference |
// +-----------------+
function orderByName() {
  orderColorAlphaNum("figcaption");
}

function orderByHexBrowser() {
  sortWithClusters("div[id='1']");
}

function orderByHexAverage() {
  sortWithClusters("div[id='2']");
}

function orderByHexFreq() {
  sortWithClusters("div[id='3']");
}

function orderColorAlphaNum(selectorStr) {
  // get all <figure> tag elements
  const colors = divColorRef.querySelectorAll("figure");

  // convert to an array (to use the sort method)
  const colorsArray = Array.prototype.slice.call(colors, 0);

  const colorsOrdered = colorsArray.sort(function (a, b) {
    const nameA = a.querySelector(selectorStr).innerHTML;
    const nameB = b.querySelector(selectorStr).innerHTML;
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });

  // clean and add the ordered list
  divColorRef.innerHTML = null;
  colorsOrdered.forEach(function (item, index) {
    divColorRef.append(item.cloneNode(true));
  });
}


// Color sorting algo from : https://tomekdev.com/posts/sorting-colors-in-js
function sortWithClusters(selectorStr) {
  // reset cluster for each call
  const clusters = [
    { name: 'red', leadColor: [255, 0, 0], colors: [] },
    { name: 'orange', leadColor: [255, 128, 0], colors: [] },
    { name: 'yellow', leadColor: [255, 255, 0], colors: [] },
    { name: 'chartreuse', leadColor: [128, 255, 0], colors: [] },
    { name: 'green', leadColor: [0, 255, 0], colors: [] },
    { name: 'spring green', leadColor: [0, 255, 128], colors: [] },
    { name: 'cyan', leadColor: [0, 255, 255], colors: [] },
    { name: 'azure', leadColor: [0, 127, 255], colors: [] },
    { name: 'blue', leadColor: [0, 0, 255], colors: [] },
    { name: 'violet', leadColor: [127, 0, 255], colors: [] },
    { name: 'magenta', leadColor: [255, 0, 255], colors: [] },
    { name: 'rose', leadColor: [255, 0, 128], colors: [] },
    { name: 'grey', leadColor: [235, 235, 235], colors: [] }
  ];
  const colors = divColorRef.querySelectorAll("figure");
  const colorsArray = Array.prototype.slice.call(colors, 0);

  colorsArray.forEach((color) => {
    let minDistance;
    let minDistanceClusterIndex;
    const rgb = hexToRgb(color.querySelector(selectorStr).innerHTML);

    clusters.forEach((cluster, clusterIndex) => {
      const colorRgbArr = [rgb.r, rgb.g, rgb.b];
      const distance = colorDistance(colorRgbArr, cluster.leadColor);

      if (typeof minDistance === 'undefined' || minDistance > distance) {
        minDistance = distance;
        minDistanceClusterIndex = clusterIndex;
      }
    });
    clusters[minDistanceClusterIndex].colors.push(color);
  });

  clusters.forEach((cluster) => {
    const dim = ['white', 'grey', 'black'].includes(cluster.name) ? 'l' : 's';
    cluster.colors = oneDimensionSorting(cluster.colors, selectorStr, dim)
  });

  // clean and add the ordered list
  divColorRef.innerHTML = null;
  clusters.forEach(function (item, index) {
    item.colors.forEach(function (item, index) {
      divColorRef.append(item.cloneNode(true));
    });
  });
}
function colorDistance(color1, color2) {
  const x =
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2);
  return Math.sqrt(x);
}
function oneDimensionSorting(colors, selectorStr, dim) {
  return colors
    .sort((colorA, colorB) => {
      const rgbA = hexToRgb(colorA.querySelector(selectorStr).innerHTML);
      const rgbB = hexToRgb(colorB.querySelector(selectorStr).innerHTML);
      const hslA = RGBToHSL(rgbA.r, rgbA.g, rgbA.b);
      const hslB = RGBToHSL(rgbB.r, rgbB.g, rgbB.b);

      if (hslA[dim] < hslB[dim]) {
        return -1;
      } else if (hslA[dim] > hslB[dim]) {
        return 1;
      } else {
        return 0;
      }
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