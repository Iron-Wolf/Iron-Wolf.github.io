function alphaNumSort(colorsArray, selectorStr) {
  return colorsArray.sort(function (a, b) {
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
}


// Color sorting algo from : https://tomekdev.com/posts/sorting-colors-in-js
function sortWithClusters(colorsArray, selectorStr) {
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

  return clusters;
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
