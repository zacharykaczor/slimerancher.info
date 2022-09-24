const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const information = document.querySelector("#selected");

const mapTexture = new Image();
mapTexture.src = "map.png";

const podTexture = new Image();
podTexture.src = "pod.png";

import markers from "./markers.js";

var origin = {
    x: 0,
    y: 0
}

var mouse = {
    visible: false,
    x: 0,
    y: 0
}

var panning = false;
var scale = 1;

function render() {
    let one = toScreen(mapTexture.width, mapTexture.height);

    let two = toWorld(
        one.x - canvas.width,
        one.y - canvas.height
    )

    let three = {
        x: -two.x * scale,
        y: -two.y * scale
    }

    origin.x = clamp(three.x, origin.x, 0);
    origin.y = clamp(three.y, origin.y, 0);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, origin.x, origin.y);
    ctx.drawImage(mapTexture, 0, 0);

    for (let marker of markers) {
        let markerSize = 50 / scale;

        ctx.drawImage(
            podTexture, 
            marker.x - (markerSize / 2), 
            marker.y - (markerSize / 2), 
            markerSize, 
            markerSize
        );

        ctx.font = `bold ${ 25 / scale }px monospace`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(marker.reward, marker.x + markerSize / 1.5, marker.y);
    }

    if (mouse.visible) {
        let mouseInWorld = toWorld(mouse.x, mouse.y);

        mouseInWorld.x = Math.round(mouseInWorld.x);
        mouseInWorld.y = Math.round(mouseInWorld.y);
    
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(mouseInWorld.x + " " + mouseInWorld.y, mouseInWorld.x - 10, mouseInWorld.y)
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

window.addEventListener("load", resize);
window.addEventListener("resize", resize);
function scaleAt(x, y, scaleBy) {
    origin.x = x - (x - origin.x) * scaleBy;
    origin.y = y - (y - origin.y) * scaleBy;
    scale *= scaleBy;
}

window.addEventListener("wheel", function(event) {
    var scaleBy = 1.2;

    if (event.deltaY < 0 && scale < 4) {
        scaleAt(event.clientX, event.clientY, scaleBy);
    }

    if (event.deltaY > 0) {
        let minimumScale = canvas.width / mapTexture.width;
        scaleBy = 1 / scaleBy;

        if (scale * scaleBy < minimumScale) {
            scale = minimumScale;
        } else {
            scaleAt(event.clientX, event.clientY, scaleBy)
        }
    }

    render();
});

function clamp(min, value, max) {
    return Math.max(min, Math.min(value, max));
}

function toWorld(x, y) {
    x = (x - origin.x) / scale;
    y = (y - origin.y) / scale;
    return {x, y};
}

function toScreen(x, y) {
    x = x * scale + origin.x;
    y = y * scale + origin.y;
    return {x, y};
}

function distance(p1, p2) {
    var a = p1.x - p2.x;
    var b = p1.y - p2.y;
    
    return Math.sqrt(a * a + b * b);
}

canvas.addEventListener("mousedown", function(event) {
    panning = true;
    
    var worldPosition = toWorld(event.clientX, event.clientY);

    for (let marker of markers) {
        if (distance(worldPosition, marker) < 50 / 2 / scale) {
            information.innerHTML = `
                <b>${marker.reward}</b>
                <br>
                <p>${marker.notes}</p>
                <br>
                <p>
                    X: ${marker.x}
                    <br>
                    Y: ${marker.y}
                </p>
            `;
            break;
        }
    }
})

canvas.addEventListener("mousemove", function(event) {
    if (panning) {
        origin.x += event.movementX;
        origin.y += event.movementY;
    }

    mouse.x = event.clientX;
    mouse.y = event.clientY;

    render();
})

canvas.addEventListener("mouseup", function(event) {
    panning = false;
});

canvas.addEventListener("mouseenter", function(event) {
    mouse.visible = true;
    render();
});

canvas.addEventListener("mouseleave", function(event) {
    panning = false;
    mouse.visible = false;
    render();
});;