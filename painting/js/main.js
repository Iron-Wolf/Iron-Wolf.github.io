var divColorGuide = document.getElementById("colorGuide");
var resourcesPath = "resources/paint-img/"
var imgSize = "100px"

fetch("./resources/fig-guide/drg-grunt.json")
  .then(response => { return response.json(); })
  .then(data => {
    // loop on each JSON objects
    data.forEach(element => {
      divColorGuide.innerHTML += element.section
      // loop on paint IDs (to retrieve the images)
      element.paints.forEach(paint => {
        var fullPathImg = `${resourcesPath}${paint}.png`
        divColorGuide.innerHTML += `<img src=${fullPathImg} title=${paint} width=${imgSize} height=${imgSize}/>`
      })
      divColorGuide.innerHTML += "<br/>"
    });
  });