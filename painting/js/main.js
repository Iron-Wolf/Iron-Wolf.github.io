var divColorRef = document.getElementById("colorRef");
var divColorGuide = document.getElementById("colorGuide");
var pathImg = "./resources/color-ref"
var pathGuide = "./resources/color-guide"
var imgSize = "100px"

fetch(`${pathImg}/all-ref.json`)
  .then(response => { return response.json(); })
  .then(data => {
    // loop on each string
    data.forEach(paintName => {
      var fullPathImg = `${pathImg}/${paintName}.png`
      divColorGuide.innerHTML += `<img src=${fullPathImg} title=${paintName} width=${imgSize} height=${imgSize}/>`
    });
  });

fetch(`${pathGuide}/drg-grunt.json`)
  .then(response => { return response.json(); })
  .then(data => {
    // loop on each JSON objects
    data.forEach(element => {
      divColorGuide.innerHTML += element.section
      // loop on paint IDs (to retrieve the images)
      element.paints.forEach(paintName => {
        var fullPathImg = `${pathImg}/${paintName}.png`
        divColorGuide.innerHTML += `<img src=${fullPathImg} title=${paintName} width=${imgSize} height=${imgSize}/>`
      })
      divColorGuide.innerHTML += "<br/>"
    });
  });