
var walls;

document.getElementById("fileInput").addEventListener("change", function(event) {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = function(e) {
			const xmlData = e.target.result;
			walls = parseXML(xmlData);
			drawSvg();
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

// Find root SVG element
const svg = document.getElementById('planSVG');
// Create an SVGPoint for future math
var pt = svg.createSVGPoint();

function getMousePos(event) {
    pt.x = event.clientX; 
    pt.y = event.clientY;
    var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    document.getElementById("coordinates")
        .innerHTML = "(x:" + Math.round(loc.x) + ",y:" + Math.round(loc.y) + ",s:"+ scale + ")";
}

function drawSvg() {
	for (let wall of walls) {
		// create the <line> SVG
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', wall.xStart);
		line.setAttribute('y1', wall.yStart);
		line.setAttribute('x2', wall.xEnd);
		line.setAttribute('y2', wall.yEnd);
		line.setAttribute('stroke', 'black');
		line.setAttribute('stroke-width', wall.thickness);
		svg.appendChild(line);
	}

    // SVG order can overlap, so we draw text AFTER the walls
    for (let wall of walls) {
        // add text in the middle of the wall
		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		var a = wall.xStart-wall.xEnd;
		var b = wall.yStart-wall.yEnd;
		var l = Math.sqrt( a*a + b*b );
		text.setAttribute('x', ((wall.xStart+wall.xEnd) / 2));
		text.setAttribute('y', ((wall.yStart+wall.yEnd) / 2));
        text.setAttribute('fill', 'red');
		text.textContent = Math.round(l);
		svg.appendChild(text);
    }
}

// ============================================================================
//  Mouse events
// ============================================================================

let scale = 1; // Facteur de zoom initial
let translateX = 0;
let translateY = 0;

function updateView() {
    svg.setAttribute("viewBox", `${translateX} ${translateY} ${100 / scale} ${100 / scale}`);
}

svg.addEventListener("wheel", (event) => {
    event.preventDefault(); // Empêche le défilement de la page
    const zoomFactor = 1.1; // Facteur de zoom pour chaque molette

    // Détermine la direction de la molette
    if (event.deltaY < 0) {
        scale *= zoomFactor; // Zoom avant
    } else {
        scale /= zoomFactor; // Zoom arrière
    }
    updateView();
});

let isPanning = false;
let isPanSvg = false;
let isPanElem = false;
let startX, startY;
let offset = { x1:0, y1:0, x2:0, y2:0 };
let currentElem = null;

svg.addEventListener("mousedown", (event) => {
    if (event.target === svg) { // Assurer que seul le SVG de fond est draggable
        isPanning = true;
        isPanSvg = true;
        isPanElem = false;
        startX = event.clientX;
        startY = event.clientY;
    }
    else if (event.target.tagName === 'line' ) {
        isPanning = true;
        isPanSvg = false;
        isPanElem = true;
        currentElem = event.target;
        offset.x1 = event.clientX - parseFloat(event.target.getAttribute("x1"));
        offset.y1 = event.clientY - parseFloat(event.target.getAttribute("y1"));
        offset.x2 = event.clientX - parseFloat(event.target.getAttribute("x2"));
        offset.y2 = event.clientY - parseFloat(event.target.getAttribute("y2"));
    }
});

svg.addEventListener("mousemove", (event) => {
    if (!isPanning) return;
    
    if (isPanSvg) {
        const dx = (event.clientX - startX);
        const dy = (event.clientY - startY);
        translateX -= dx/(scale*10);
        translateY -= dy/(scale*10);
        startX = event.clientX;
        startY = event.clientY;
        updateView();
    }
    else if (isPanElem) {
        var ns = 1/(scale*10);
        currentElem.setAttribute("x1", (event.clientX - offset.x1)*ns);
        currentElem.setAttribute("y1", (event.clientY - offset.y1)*ns);
        currentElem.setAttribute("x2", (event.clientX - offset.x2)*ns);
        currentElem.setAttribute("y2", (event.clientY - offset.y2)*ns);
    }
});

svg.addEventListener("mouseup", () => {
    isPanning = false;
    currentElem = null;
});

svg.addEventListener("mouseleave", () => {
    isPanning = false;
    currentElem = null;
});
