
/* ------------------------
   Canvas and DOM Elements
-------------------------*/
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const musicButton = document.getElementById('music-button');
const infoDisplay = document.getElementById('info');

/* ------------------------
   Game Settings
-------------------------*/
const tileSize = 24;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

/* ------------------------
   Game State Variables
-------------------------*/
let level = 1;
let score = 0;
let health = 10;
let gameRunning = false;
let player = { x: 1, y: 1, color: '#4ecdc4' };
let treasures = [];
let enemies = [];
let powerUps = [];

/* ------------------------
   Audio Elements
-------------------------*/
const bgMusic = document.getElementById('bgMusic');
bgMusic.volume = 0.2;
const treasureSound = document.getElementById('treasureSound');
const hitSound = document.getElementById('hitSound');

/* ------------------------
   Utility Functions
-------------------------*/
function randomPosition() {
    return { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isOccupied(x, y) {
    if (x === player.x && y === player.y) return true;
    return treasures.some(t => t.x === x && t.y === y) ||
           enemies.some(e => Math.floor(e.x) === x && Math.floor(e.y) === y) ||
           powerUps.some(p => p.x === x && p.y === y);
}

function tooClose(pos) {
    return distance(pos, player) < 3;
}

/* ------------------------
   Level Initialization
-------------------------*/
function initLevel() {
    treasures = [];
    enemies = [];
    powerUps = [];
    player.x = 1;
    player.y = 1;

    // Add treasures
    for (let i = 0; i < level + 3; i++) addUnique(treasures, '#ffd700');

    // Add enemies
    for (let i = 0; i < level + 2; i++) addUnique(enemies, Math.random() < 0.5 ? '#ff6b6b' : '#ffa726');

    // Add power-ups every 2 levels
    if (level % 2 === 0) addUnique(powerUps, '#00bcd4');
}

function addUnique(array, color) {
    let pos;
    do { pos = randomPosition(); } while (isOccupied(pos.x, pos.y) || tooClose(pos));
    array.push({ x: pos.x, y: pos.y, color: color, speed: Math.random() * 0.5 + 0.5 });
}

/* ------------------------
   Drawing Functions
-------------------------*/
function draw() {
    drawBackground();
    drawGrid();
    treasures.forEach(t => drawTile(t));
    powerUps.forEach(p => drawTile(p, true));
    enemies.forEach(e => drawTile(e));
    drawTile(player);

    infoDisplay.innerText = `Score: ${score} | Health: ${health} | Level: ${level}`;
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1c2833');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += tileSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= canvas.height; y += tileSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
}

function drawTile(obj, pulse = false) {
    ctx.fillStyle = obj.color;
    ctx.shadowBlur = pulse ? 15 + Math.sin(Date.now() / 200) * 2 : 10;
    ctx.shadowColor = obj.color;
    ctx.fillRect(obj.x * tileSize + 2, obj.y * tileSize + 2, tileSize - 4, tileSize - 4);
    ctx.shadowBlur = 0;
}

/* ------------------------
   Enemy Movement
-------------------------*/
function moveEnemies() {
    enemies.forEach(e => {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        e.x += dx !== 0 ? Math.sign(dx) * e.speed : 0;
        e.y += dy !== 0 ? Math.sign(dy) * e.speed : 0;
        e.x = Math.max(0, Math.min(cols - 1, e.x));
        e.y = Math.max(0, Math.min(rows - 1, e.y));
    });
}

/* ------------------------
   Collision Handling
-------------------------*/
function checkCollision() {
    treasures.forEach((t, i) => { if (Math.floor(t.x) === player.x && Math.floor(t.y) === player.y) { score += 10; treasures.splice(i, 1); treasureSound.play().catch(() => {}); } });
    powerUps.forEach((p, i) => { if (Math.floor(p.x) === player.x && Math.floor(p.y) === player.y) { score += 20; powerUps.splice(i, 1); treasureSound.play().catch(() => {}); } });
    enemies.forEach(e => { if (Math.floor(e.x) === player.x && Math.floor(e.y) === player.y) { health--; hitSound.play().catch(() => {}); player.x = 1; player.y = 1; if (health <= 0) gameOver(); } });

    if (treasures.length === 0 && powerUps.length === 0) { level++; initLevel(); }
}

/* ------------------------
   Game Control Functions
-------------------------*/
function startGame() { startScreen.classList.add('hidden'); gameRunning = true; bgMusic.play().catch(() => {}); }
function restartGame() { level = 1; score = 0; health = 3; player = { x: 1, y: 1, color: '#4ecdc4' }; initLevel(); startScreen.classList.add('hidden'); gameRunning = true; }
function toggleMusic() { if (bgMusic.paused) bgMusic.play().catch(() => {}); else bgMusic.pause(); }
function gameOver() { gameRunning = false; alert(`Game Over! Final Score: ${score}`); restartGame(); }

/* ------------------------
   Event Listeners
-------------------------*/
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
musicButton.addEventListener('click', toggleMusic);
document.addEventListener('keydown', e => {
    if (!gameRunning) return;
    if (e.key === 'ArrowUp' && player.y > 0) player.y--;
    if (e.key === 'ArrowDown' && player.y < rows - 1) player.y++;
    if (e.key === 'ArrowLeft' && player.x > 0) player.x--;
    if (e.key === 'ArrowRight' && player.x < cols - 1) player.x++;
});

/* ------------------------
   Game Loop
-------------------------*/
initLevel();
setInterval(() => { if (gameRunning) { draw(); moveEnemies(); checkCollision(); }}, 1000 / 12);
/* -------------------------
    event
   -------------------------*/