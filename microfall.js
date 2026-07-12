const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = 600;
const HEIGHT = 400;

// Colors
const buttonColor = "#4682B4";
const hoverColor = "#64A0D2";
const textColor = "#FFFFFF";
const bgColor = "#1E1E1E";

// Falling square colors
const squareColors = ["red", "lime", "yellow", "blue"];
const squareSize = 40;

// Game state
let gameStarted = false;
let gameRunning = false;
let gameOver = false;
let gameWon = false;
let startTime = null;

let cameraY = 0;

// Load images
const poopImg = new Image();
poopImg.src = "poop.png";

const flyImg = new Image();
flyImg.src = "fly_pink.png";

// Falling squares (start page)
class FallingSquare {
    constructor(color) {
        this.color = color;
        this.reset();
    }

    reset() {
        this.x = Math.random() * (WIDTH - squareSize);
        this.y = Math.random() * -HEIGHT;
        this.speed = 18 + Math.random() * 6;
    }

    update() {
        this.y += this.speed;
        if (this.y > HEIGHT) this.reset();
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, squareSize, squareSize);
    }
}

const squares = squareColors.map(c => new FallingSquare(c));

// Player
let player = { x: WIDTH / 2, y: HEIGHT - 150, w: 50, h: 50 };
let playerVelY = 0;
const gravity = 0.5;
const jumpStrength = -12;

// Platforms
class Platform {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    update() {
        if (gameRunning) {
            this.y += 3;
            if (this.y > HEIGHT + 60) this.reset();
        }
    }

    reset() {
        this.x = Math.random() * (WIDTH - 60);
        this.y = Math.random() * -HEIGHT;
        this.color = squareColors[Math.floor(Math.random() * squareColors.length)];
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - cameraY, 60, 60);
    }
}

let platforms = [];
let startY = HEIGHT - 120;

for (let i = 0; i < 10; i++) {
    let x = Math.random() * (WIDTH - 60);
    let y = startY - i * 60;
    platforms.push(new Platform(x, y, squareColors[Math.floor(Math.random() * squareColors.length)]));
}

// Game Over poop animation
let poopX = -50;

// Draw Start Button
function drawButton() {
    ctx.fillStyle = buttonColor;
    ctx.fillRect(WIDTH / 2 - 100, HEIGHT / 2 - 40, 200, 80);

    ctx.fillStyle = textColor;
    ctx.font = "40px Arial";
    ctx.fillText("Start Here", WIDTH / 2 - 60, HEIGHT / 2 + 10);
}

// Draw Game Over Screen
function drawGameOver() {
    poopX += 5;
    if (poopX > WIDTH) poopX = -50;

    ctx.drawImage(poopImg, poopX, HEIGHT / 2 - 100, 50, 50);

    ctx.fillStyle = "#C83232";
    ctx.fillRect(WIDTH / 2 - 100, HEIGHT / 2 - 40, 200, 80);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", WIDTH / 2 - 90, HEIGHT / 2 + 10);
}

// Draw Game
function drawGame() {
    playerVelY += gravity;
    player.y += playerVelY;

    if (gameRunning) {
        cameraY = player.y - HEIGHT / 2;
    } else {
        cameraY = 0;
    }

    let landed = false;

    platforms.forEach(plat => {
        plat.update();

        // Collision
        if (
            player.x < plat.x + 60 &&
            player.x + player.w > plat.x &&
            player.y < plat.y + 60 &&
            player.y + player.h > plat.y
        ) {
            if (playerVelY > 0) {
                playerVelY = jumpStrength;
                landed = true;
            }
        }

        plat.draw();
    });

    ctx.drawImage(poopImg, player.x, player.y - cameraY, 50, 50);

    if (gameRunning) {
        if (playerVelY > 12 && !landed) {
            let belowAll = platforms.every(plat => player.y > plat.y);
            if (belowAll) gameOver = true;
        }

        if (player.y - cameraY > HEIGHT) gameOver = true;

        let elapsed = Math.floor(Date.now() / 1000 - startTime);
        ctx.fillStyle = textColor;
        ctx.font = "30px Arial";
        ctx.fillText(`Time: ${elapsed}s`, 10, 30);

        if (elapsed >= 30) gameWon = true;
    }

    if (!gameRunning) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "30px Arial";
        ctx.fillText("Press UP or SPACE to Start", WIDTH / 2 - 150, HEIGHT / 2);
    }
}

// Main Loop
function loop() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (!gameStarted) {
        squares.forEach(sq => {
            sq.update();
            sq.draw();
        });
        drawButton();
    } else {
        if (gameOver) {
            drawGameOver();
        } else {
            drawGame();
        }
    }

    requestAnimationFrame(loop);
}

loop();

// Mouse Clicks
canvas.addEventListener("mousedown", (e) => {
    let mx = e.offsetX;
    let my = e.offsetY;

    if (!gameStarted) {
        if (mx > WIDTH / 2 - 100 && mx < WIDTH / 2 + 100 &&
            my > HEIGHT / 2 - 40 && my < HEIGHT / 2 + 40) {

            gameStarted = true;
            gameRunning = false;
            gameOver = false;
            gameWon = false;

            let firstPlat = platforms[0];
            player.x = firstPlat.x;
            player.y = firstPlat.y - 50;
            playerVelY = 0;

            startTime = Math.floor(Date.now() / 1000);
        }
    } else if (gameOver) {
        if (mx > WIDTH / 2 - 100 && mx < WIDTH / 2 + 100 &&
            my > HEIGHT / 2 - 40 && my < HEIGHT / 2 + 40) {

            gameStarted = false;
            gameRunning = false;
            gameOver = false;
            poopX = -50;
        }
    }
});

// Keyboard Controls
document.addEventListener("keydown", (e) => {
    if (!gameStarted || gameOver || gameWon) return;

    if (!gameRunning) {
        if (e.key === " " || e.key === "ArrowUp") {
            gameRunning = true;
        }
    } else {
        if (e.key === " " || e.key === "ArrowUp") {
            playerVelY = jumpStrength;
        }
        if (e.key === "ArrowLeft") {
            player.x -= 20;
        }
        if (e.key === "ArrowRight") {
            player.x += 20;
        }
    }
});
