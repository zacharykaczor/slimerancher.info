var treasurePods;
var researchDrones;

const creditsModal = document.querySelector("#credits-modal");
const footer = document.querySelector("footer");
const showCreditsButton = document.querySelector("#show-credits-button");
const hideCreditsButton = document.querySelector("#hide-credits-button");
const treasurePodsButton = document.querySelector("#treasure-pods-button");
const researchDronesButton = document.querySelector("#research-drones-button");

var showTreasurePods = true;
var showResearchDrones = true;

showCreditsButton.addEventListener("click", function() {
    creditsModal.classList.remove("hidden");
    footer.classList.add("hidden")
    hideModal();
});

hideCreditsButton.addEventListener("click", function() {
    creditsModal.classList.add("hidden");
    footer.classList.remove("hidden")
});

function updateTreasurePodsButton() {
    treasurePodsButton.children[0].textContent = showTreasurePods ? "Disable" : "Enable";
}

treasurePodsButton.addEventListener("click", function() {
    showTreasurePods = !showTreasurePods;
    updateTreasurePodsButton();
});

updateTreasurePodsButton();

function updateResearchDronesButton() {
    researchDronesButton.children[0].textContent = showResearchDrones ? "Disable" : "Enable";
}

researchDronesButton.addEventListener("click", function() {
    showResearchDrones = !showResearchDrones;
    updateResearchDronesButton();
});

updateResearchDronesButton();

const mapImage = new Image();
mapImage.src = "./textures/map.webp";

const podImage = new Image();
podImage.src = "./textures/pod.webp";

const droneImage = new Image();
droneImage.src = "./textures/drone.webp";

var mapTexture = null;
var podTexture = null;
var droneTexture = null;

function getVisibleMarkers() {
    let visibleMarkers = [];

    if (showTreasurePods) {
        for (let treasurePod of treasurePods) {
            treasurePod.icon = podTexture;
        }

        visibleMarkers.push(...treasurePods);
    }

    if (showResearchDrones) {
        for (let researchDrone of researchDrones) {
            researchDrone.icon = droneTexture;
        }

        visibleMarkers.push(...researchDrones);
    }

    return visibleMarkers;
}

const information = document.querySelector("#information");
const coordinates = document.querySelector("#coordinates");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
class Point {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distance(other) {
        var a = this.x - other.x;
        var b = this.y - other.y;

        return Math.sqrt(a ** 2 + b ** 2);
    }
}

class Camera {
    position = new Point(0, 0);

    firstRender = true;
    zoomFactor = 1.2;
    zoom = 1;

    zoomAt(at, amount) {
        this.position.x = at.x - (at.x - this.position.x) * amount;
        this.position.y = at.y - (at.y - this.position.y) * amount;
        this.zoom *= amount;
    }

    get maxZoom() {
        return 5;
    }

    zoomIn(at) {
        if (this.zoom * this.zoomFactor < this.maxZoom) {
            this.zoomAt(at, this.zoomFactor);
        }
    }

    get minZoom() {
        return Math.max(
            canvas.width / mapTexture.width, 
            canvas.height / mapTexture.height
        );
    }

    enactMinZoom() {
        if (this.zoom < this.minZoom) {
            this.zoom = this.minZoom;
        }
    }

    zoomOut(at) {
        if (this.zoom / this.zoomFactor > this.minZoom) {
            this.zoomAt(at, 1 / this.zoomFactor);
        } else {
            this.zoomAt(at, this.minZoom / this.zoom);
        }
    }
}

// TODO: Set origin to either centered around the conservatory or centered in general and zoomed out.
const camera = new Camera();

function clamp(min, value, max) {
    return Math.max(min, Math.min(value, max));
}

// Todo: Make these use Point.
function toWorld(x, y) {
    x = (x - camera.position.x) / camera.zoom;
    y = (y - camera.position.y) / camera.zoom;
    return new Point(x, y);
}

function toScreen(x, y) {
    x = x * camera.zoom + camera.position.x;
    y = y * camera.zoom + camera.position.y;
    return {x, y};
}

function render() {
    // Todo: Clean up this function.
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    camera.enactMinZoom();

    if (camera.firstRender) {
        camera.zoom = camera.minZoom;

        camera.position.x = 0;
        camera.position.y = 0;   

        camera.firstRender = false;
    }

    // This camera work should be moved to the class.
    let one = toScreen(mapTexture.width, mapTexture.height);

    let two = toWorld(
        one.x - canvas.width,
        one.y - canvas.height
    )

    let three = {
        x: -two.x * camera.zoom,
        y: -two.y * camera.zoom
    }

    camera.position.x = clamp(three.x, camera.position.x, 0);
    camera.position.y = clamp(three.y, camera.position.y, 0);

    ctx.setTransform(camera.zoom, 0, 0, camera.zoom, camera.position.x, camera.position.y);
    ctx.drawImage(mapTexture, 0, 0);

    for (let marker of getVisibleMarkers()) {
        let markerSize = 50 / camera.zoom;

        ctx.drawImage(
            marker.icon, 
            marker.x - (markerSize / 2), 
            marker.y - (markerSize / 2), 
            markerSize, 
            markerSize
        );

        if (camera.zoom > 2 * camera.minZoom) {
            ctx.font = `bold ${ 25 / camera.zoom }px monospace`;
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
            ctx.fillText(marker.name, marker.x + markerSize / 1.5, marker.y);
        }
    }
    
    requestAnimationFrame(render)
}

async function load() {
    // Todo: Add loading circle or something
    mapTexture = await createImageBitmap(mapImage);
    podTexture = await createImageBitmap(podImage);
    droneTexture = await createImageBitmap(droneImage);

    let treasurePodsRequest = await fetch("data/treasurePods.json");
    treasurePods = await treasurePodsRequest.json();

    let researchDronesRequest = await fetch("data/researchDrones.json");
    researchDrones = await researchDronesRequest.json();

    requestAnimationFrame(render);
}

window.addEventListener("load", load);

var panning = false;

const startPanning = () => panning = true;
const stopPanning = () => panning = false;
const hideModal = () => {
    information.innerHTML = null;
    information.classList.add("hidden");
}
canvas.addEventListener("mousedown", function() {
    hideModal();
    startPanning();
});

canvas.addEventListener("mouseleave", function() {
    coordinates.classList.add("hidden");
    stopPanning();
});

canvas.addEventListener("mouseup", stopPanning);

canvas.addEventListener("wheel", function(event) {
    hideModal();
    let at = {
        x: event.clientX,
        y: event.clientY
    }

    if (event.deltaY < 0) {
        camera.zoomIn(at);
    }

    if (event.deltaY > 0) {
        camera.zoomOut(at);
    }

    let worldMouse = toWorld(event.clientX, event.clientY)
    coordinates.classList.remove("hidden");
    coordinates.textContent = `X: ${Math.round(worldMouse.x)} Y: ${Math.round(worldMouse.y)}`
}, { passive: true });

function getMarkerAtCursor(mousePosition) {
    var clickDistance = 50 / 2 / camera.zoom;
    mousePosition = toWorld(mousePosition.x, mousePosition.y);

    for (let marker of getVisibleMarkers()) {
        let position = new Point(marker.x, marker.y);

        if (mousePosition.distance(position) < clickDistance) {
            return marker;
        }
    }
}

canvas.addEventListener("click", function(event) {
    let clickedMarker = getMarkerAtCursor(new Point(event.clientX, event.clientY));

    if (clickedMarker) {
        information.innerHTML = `
        <p>
            <b>${clickedMarker.name}</b>
        </p>

        <p>
            ${clickedMarker.notes}
            <br>
            <a href=${clickedMarker.screenshot}>Screenshot</a>
        </p>

        <p>
            <b>X:</b> ${clickedMarker.x}
            <br>
            <b>Y:</b> ${clickedMarker.y}
        </p>
        `;

        information.classList.remove("hidden");

        let markerOnScreen = toScreen(clickedMarker.x, clickedMarker.y);

        if (information.clientHeight - markerOnScreen.y + 50 < 0) {
            information.style.top = (markerOnScreen.y - information.clientHeight - 50) + "px";
        } else {
            information.style.top = markerOnScreen.y + 50 + "px";
        }

        information.style.left = (markerOnScreen.x - information.clientWidth / 2) + "px";
    }
});

canvas.addEventListener("mousemove", function(event) {
    if (panning) {
        camera.position.x += event.movementX;
        camera.position.y += event.movementY;
    }

    let worldMouse = toWorld(event.clientX, event.clientY)
    coordinates.classList.remove("hidden");
    coordinates.textContent = `X: ${Math.round(worldMouse.x)} Y: ${Math.round(worldMouse.y)}`
});