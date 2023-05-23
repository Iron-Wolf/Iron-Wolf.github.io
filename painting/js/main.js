var divColorRef = document.getElementById("colorRef");
var divColorGuide = document.getElementById("colorGuide");
var pathImg = "./resources/color-ref"
var pathGuide = "./resources/color-guide"
var imgSize = 100

// +-----------------+
// | Color Reference |
// +-----------------+
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
        const colors = document.createElement("div");
        colors.append(getColorByBrowser(img));
        colors.append(`\n` + getAverageRGB(img));
        colors.append(`\n` + getColorsFreq(img));
        fig.appendChild(colors);
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
        var fullPathImg = `${pathImg}/${paintName}.svg`
        divColorGuide.innerHTML += `<img src=${fullPathImg} title=${paintName} height=${imgSize}/>`
      })
      divColorGuide.innerHTML += "<br/>"
    });
  });