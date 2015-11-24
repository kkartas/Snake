var canvas, ctx;

// Trick to create arrays filled with zero values
var x = Array.apply(null, Array(20)).map(Number.prototype.valueOf, 0);
var y = Array.apply(null, Array(20)).map(Number.prototype.valueOf, 0);
var len = Array.apply(null, Array(20)).map(Number.prototype.valueOf, 10);

var mousePos;
var drawnMousePos = { x: 0, y: 0 };

var INSTRUCT = "instruct";
var PLAY = "play";
var mode = INSTRUCT;

// Static snake settings 
var segLength = 10;
var segWidth = 12;
var segMinWidth = 8;
var headWidth = 10;
var headLength = 15;
var tailLength = 30;
var tailWidth = 10;
var headColor = "red";

// Static mouse settings
var mouseLength = 20;
var mouseWidth = 15;
var mouseColor = "brown";

// Settings that control the movement of the snake
var stretchFactor = 0.75;  // how far will a segment stretch to take up empty space 
var currentTime = 0;  // Milliseconds since start.  Used for movement that varies over time.
var speedFrequency = 2000; // Frequency of speed change in milliseconds
var minSnakeSpeed = 1.05; // minimum speed (1 + number of segLengths per frame)
var maxSnakeSpeed = 1.20; // maximum speed (1 + number of segLengths per frame)
var accelerationPerSecond = 0.005;
var angleFrequency = 4000;  // Frequency of angle change in milliseconds
var maxAngleDeviation = Math.PI / 4; // Max deviation from correct angle

// Game variables
var startTime = 0;
var mouseLeftPlayingArea = false;

function init() {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');


    canvas.addEventListener('mousemove', function (evt) {
        if (!mouseLeftPlayingArea)  // Mouse can only move if they stayed in the area.
            mousePos = getMousePos(canvas, evt);
    }, false);

    canvas.addEventListener('click', function (evt) {
        if (mode === INSTRUCT) {
            mode = PLAY;
            startTime = getCurrentTime();
            mouseLeftPlayingArea = false;
            requestAnimationFrame(animate);
        }
    }, false);

    canvas.addEventListener('mouseleave', function (evt) {
        mouseLeftPlayingArea = true;
    });

    drawInstructions();
}

function getMousePos(canvas, evt) {
    // necessary to take into account CSS boundaries
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function getCurrentTime() {
    var now = new Date();
    return now.getTime();
}

function drawInstructions() {
    var line = 1;
    var lineHeight = 20;
    var margin = 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 15px Georgia";
    ctx.fillText('Welcome to "Save the Mouse"', margin, margin + line++ * lineHeight);
    ctx.font = "15px Georgia";
    ctx.fillText('Move your pointer to keep the mouse from the snake.', margin, margin + line++ * lineHeight);
    ctx.fillText('You must keep your pointer inside the square.', margin, margin + line++ * lineHeight);
    ctx.fillText('The snake gets faster as he gets more hungry!', margin, margin + line++ * lineHeight);
    ctx.fillText('Known bugs: If you hit outside the grey box, the mouse stucks.', margin, margin + line++ * lineHeight);
    ctx.fillText('Click anywhere in the box to start.', margin, margin + line++ * lineHeight);
}

function drawResults() {

}

function animate(timestamp) {
    currentTime = getCurrentTime();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#BDBDBD";

    // draw the snake, only when the mouse entered at
    // least once the canvas surface
    if (mousePos !== undefined) {
        drawMouse(mousePos.x, mousePos.y);
        var newPos = closePredatorPreyGap();
        drawSnake(newPos.x, newPos.y);
    }

    // Stop if the mouse has been caught.
    if (mode === PLAY)
        requestAnimationFrame(animate);
    else
        drawResults();
}

function closePredatorPreyGap() {

    var newX, newY, newSpeed;

    var ppX = drawnMousePos.x - x[0];
    var ppY = drawnMousePos.y - y[0];
    var ppAngle = Math.atan2(ppY, ppX);

    var ppDist = Math.sqrt(Math.pow(ppX, 2) + Math.pow(ppY, 2));

    if (ppDist <= segLength) {
        // The mouse is caught!
        mode = INSTRUCT;
        newX = drawnMousePos.x;
        newY = drawnMousePos.y;
    } else {
        newSpeed = oscillateValue(speedFrequency, 0, minSnakeSpeed, maxSnakeSpeed);
        newSpeed += (currentTime - startTime) / 1000 * accelerationPerSecond;      // Increase speed over time.
        ppAngle = oscillateValue(angleFrequency, 0, ppAngle - maxAngleDeviation, ppAngle + maxAngleDeviation);
        newX = x[0] + Math.cos(ppAngle) * (segLength * newSpeed);
        newY = y[0] + Math.sin(ppAngle) * (segLength * newSpeed);
    }

    return { x: newX, y: newY };
}

function drawMouse(posX, posY) {
    var dx = posX - drawnMousePos.x;
    var dy = posY - drawnMousePos.y;
    var angle = Math.atan2(dy, dx) + Math.PI;
    drawnMousePos.x = posX + Math.cos(angle) * mouseLength;
    drawnMousePos.y = posY + Math.sin(angle) * mouseLength;

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(angle);
    ctx.translate(0, -mouseWidth / 2);

    //ctx.strokeRect(0,0,mouseLength,mouseWidth); 

    // Draw the mouse body
    var bodyRadius = mouseWidth / 2;
    var noseRadius = mouseWidth / 6;
    ctx.fillStyle = mouseColor;

    // Top half
    ctx.beginPath();
    ctx.moveTo(mouseLength, bodyRadius);
    ctx.arcTo(mouseLength, 0, mouseLength - bodyRadius, 0, bodyRadius);
    ctx.arcTo(0, bodyRadius - noseRadius + 1, 0, bodyRadius, noseRadius);
    ctx.closePath();
    ctx.fill();

    // Bottom half
    ctx.beginPath();
    ctx.moveTo(mouseLength, bodyRadius);
    ctx.arcTo(mouseLength, mouseWidth, mouseLength - bodyRadius, mouseWidth, bodyRadius);
    ctx.arcTo(0, bodyRadius + noseRadius - 1, 0, bodyRadius, noseRadius);
    ctx.closePath();
    ctx.fill();

    // Draw the whiskers
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(noseRadius * 2, mouseWidth);
    //ctx.moveTo(noseRadius,0);
    //ctx.lineTo(noseRadius,mouseWidth);
    ctx.moveTo(noseRadius * 2, 0);
    ctx.lineTo(0, mouseWidth);
    ctx.stroke();

    // Draw the tail
    ctx.beginPath();
    ctx.strokeStyle = mouseColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.moveTo(mouseLength, bodyRadius);
    ctx.quadraticCurveTo(mouseLength + mouseLength / 6, mouseWidth, mouseLength + mouseLength / 2, bodyRadius);
    ctx.stroke();

    ctx.restore();
}

function drawSnake(posX, posY) {
    dragSegment(0, posX, posY);

    for (var i = 0; i < x.length - 1; i++) {
        dragSegment(i + 1, x[i], y[i]);
    }
}

function dragSegment(i, xin, yin) {
    dx = xin - x[i];
    dy = yin - y[i];

    angle = Math.atan2(dy, dx);

    if (i > 0) {
        dl = Math.sqrt(dx * dx + dy * dy);
        if (dl > segLength)
            len[i] = segLength + stretchFactor * (dl - segLength);
    }

    x[i] = xin - Math.cos(angle) * len[i];
    y[i] = yin - Math.sin(angle) * len[i];

    ctx.save();

    // We draw the tail from the end of the snake, not to the end
    if (i === x.length - 1) {
        ctx.translate(x[i - 1], y[i - 1]);
        ctx.rotate(angle + Math.PI);
    } else {
        ctx.translate(x[i], y[i]);
        ctx.rotate(angle);
    }


    var segColor;

    // Generate colors 
    if (i % 3 == 1)
        segColor = "rgba(0, 0, 0, 255)";
    else if (i % 3 == 2)
        segColor = "rgba(255, 255, 0, 255)";
    else
        segColor = "rgba(255, 0, 0, 255)";

    if (i === 0)
        drawHead(0, 0, headLength, 0, headColor, headWidth);
    else if (i === x.length - 1)
        drawTail(0, 0, tailLength, 0, segColor, tailWidth);
    else
        drawLine(0, 0, len[i], 0, segColor, Math.max(segMinWidth, segWidth * segLength / len[i]));

    ctx.restore();
}

function drawLine(x1, y1, x2, y2, color, width) {
    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.restore();
}

function drawTail(x1, y1, x2, y2, color, width) {
    var left = x1;
    var right = x2;
    var top = y1 - width / 2;
    var bottom = y2 + width / 2;
    var radius = 3;

    ctx.save();

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.arcTo(right, y2, left, bottom, radius);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawHead(x1, y1, x2, y2, color, width) {
    var radius = width / 2;
    var left = x1;
    var right = x2;
    var top = y1 - radius;
    var bottom = y2 + radius;
    ctx.save();

    // draw the head
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right - radius, top);
    ctx.arcTo(right, top, right, y2, radius);
    ctx.arcTo(right, bottom, right - radius, bottom, radius);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.fill();

    // draw the eyes
    ctx.fillStyle = "black";

    ctx.beginPath();
    ctx.arc((right - radius) / 2, top + radius / 2, radius / 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((right - radius) / 2, bottom - radius / 2, radius / 3, 0, 2 * Math.PI);
    ctx.fill();

    // flick a tongue out every so often
    var currentPos = Math.round(currentTime) % 3000;

    if (currentPos < 100 ||
        (currentPos > 200 && currentPos < 300)) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = width / 10;
        ctx.beginPath();
        ctx.moveTo(right, y2);
        ctx.lineTo(right + (right - left) / 2, y2);
        ctx.stroke();
    }

    ctx.restore();
}

function oscillateValue(frequency, offset, minValue, maxValue) {
    var currentPos = (Math.round(currentTime) + offset) % frequency;
    var oscilationFactor = (1 + Math.sin(currentPos / frequency * 2 * Math.PI)) / 2;
    return minValue + (oscilationFactor * (maxValue - minValue));
}
