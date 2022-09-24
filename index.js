const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const information = document.querySelector("#selected");

const mapTexture = new Image();
mapTexture.src = "map.png";

const markerTexture = new Image();
markerTexture.src = "marker.png";

import markers from "./markers.js";

var origin = {
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
        ctx.font = `bold ${ 25 / scale }px serif`;
        ctx.fillText(marker.reward, marker.x + 10 / scale, marker.y - 10 / scale);

        ctx.beginPath();
        
        ctx.arc(marker.x, marker.y, 10 / scale, 0, 2 * Math.PI);

        ctx.fill();
    }

}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

window.addEventListener("load", resize);
window.addEventListener("resize", resize);
window.addEventListener("wheel", function(event) {
    var scaleBy = 1.2;

    if (event.deltaY > 0) {
        scaleBy = 1 / scaleBy;
    }

    if (scale * scaleBy > canvas.width / mapTexture.width) {
        origin.x = event.clientX - (event.clientX - origin.x) * scaleBy;
        origin.y = event.clientY - (event.clientY - origin.y) * scaleBy;
        scale *= scaleBy;
    } else {
        scale = canvas.width / mapTexture.width;
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
        if (distance(worldPosition, marker) < 10 / scale) {
            information.innerHTML = `<b>${marker.reward}</b><br><p>${marker.notes}</p>`;
            break;
        }
    }
})

canvas.addEventListener("mousemove", function(event) {
    if (panning) {
        origin.x += event.movementX;
        origin.y += event.movementY;
    }

    render();
})

canvas.addEventListener("mouseup", function(event) {
    panning = false;
});

canvas.addEventListener("mouseleave", function(event) {
    panning = false;
});