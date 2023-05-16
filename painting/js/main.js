var divColorGuide = document.getElementById("colorGuide");

fetch("./resources/fig-guide/drg-grunt.json")
  .then(response => { return response.json(); })
  .then(data => {
    data.forEach(element => {
      divColorGuide.innerHTML += element.section
      divColorGuide.innerHTML += "<br/>"
    });
  });