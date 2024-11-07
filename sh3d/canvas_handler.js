
var walls;

document.getElementById("fileInput").addEventListener("change", function(event) {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = function(e) {
			const xmlData = e.target.result;
			walls = parseXML(xmlData);
			drawWalls();
		};
		reader.readAsText(file);
	}
});

// Parse XML and extract walls data
function parseXML(xml) {
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xml, "application/xml");
	const walls = xmlDoc.getElementsByTagName("wall");

	const wallData = [];
	for (let wall of walls) {
		wallData.push({
			xStart: parseFloat(wall.getAttribute("xStart")),
			yStart: parseFloat(wall.getAttribute("yStart")),
			xEnd: parseFloat(wall.getAttribute("xEnd")),
			yEnd: parseFloat(wall.getAttribute("yEnd")),
			thickness: parseFloat(wall.getAttribute("thickness"))
		});
	}
	return wallData;
}


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// draw whatever we want
function drawWalls() {
	const scale = 0.5;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#000";
	
	for (let wall of walls) {
		ctx.beginPath();
		ctx.lineWidth = wall.thickness * scale;
		
		var startX = wall.xStart * scale;
		var startY = wall.yStart * scale;
		var endX = wall.xEnd * scale;
		var endY = wall.yEnd * scale;
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
		
		var a = startX-endX;
		var b = startY-endY;
		var l = Math.sqrt( a*a + b*b );
		ctx.fillText(Math.round(l), ((startX+endX) / 2)+10, ((startY+endY) / 2)+10);
	}
}

function getMousePos(evt) {
  var rect = canvas.getBoundingClientRect();
  var x = evt.clientX - rect.left;
  var y = evt.clientY - rect.top;
  document.getElementById("coordinates").innerHTML = "(" + Math.round(x) + "," + Math.round(y) + ")";
}
