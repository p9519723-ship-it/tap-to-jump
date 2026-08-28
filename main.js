// Tap-to-jump básico (móvil + click)
// Copia este archivo como main.js en la misma carpeta que index.html

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let dpr = window.devicePixelRatio || 1;

function resize() {
  dpr = window.devicePixelRatio || 1;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // para dibujar en coordenadas CSS
}
addEventListener('resize', resize);
resize();

// Estado del juego
let state = 'menu'; // 'menu', 'playing', 'gameover'
let score = 0;

// Jugador
const player = {
  x: 80,
  y: canvas.height / (2 * dpr),
  r: 18,
  vy: 0
};

// Física
const GRAVITY = 900; // px/s^2
const JUMP_V = -350; // px/s

// Obstáculos (tubos)
const pipes = [];
const PIPE_GAP = 140;
const PIPE_W = 60;
const PIPE_SPEED = 200; // px/s
let spawnTimer = 0;
const SPAWN_INTERVAL = 1.5; // s

// Tiempo
let lastTime = performance.now();

function spawnPipe() {
  const minTop = 40;
  const maxTop = (canvas.height / dpr) - PIPE_GAP - 40;
  const top = Math.random() * (maxTop - minTop) + minTop;
  const x = (canvas.width / dpr) + 20;
  pipes.push({ x, top, passed: false });
}

function resetGame() {
  state = 'playing';
  score = 0;
  pipes.length = 0;
  player.y = canvas.height / (2 * dpr);
  player.vy = 0;
  spawnTimer = 0;
  lastTime = performance.now();
}

// Control: tap / click
function onTap() {
  if (state === 'menu') {
    resetGame();
  } else if (state === 'playing') {
    player.vy = JUMP_V;
  } else if (state === 'gameover') {
    resetGame();
  }
}
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onTap(); }, {passive:false});
canvas.addEventListener('mousedown', onTap);

// Colisiones: círculo vs rect
function circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return (dx * dx + dy * dy) < (r * r);
}

function update(dt) {
  if (state !== 'playing') return;

  // Jugador
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  // Limites suelo/techo
  const floorY = (canvas.height / dpr) - 10;
  if (player.y + player.r > floorY) {
    player.y = floorY - player.r;
    player.vy = 0;
    state = 'gameover';
  }
  if (player.y - player.r < 0) {
    player.y = player.r;
    player.vy = 0;
  }

  // Obstáculos
  spawnTimer += dt;
  if (spawnTimer > SPAWN_INTERVAL) {
    spawnTimer = 0;
    spawnPipe();
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= PIPE_SPEED * dt;

    // marcar pasado para puntaje
    if (!p.passed && p.x + PIPE_W < player.x) {
      p.passed = true;
      score += 1;
    }

    // colisión con el jugador (dos rects: superior e inferior)
    const topRect = { x: p.x, y: 0, w: PIPE_W, h: p.top };
    const bottomRect = { x: p.x, y: p.top + PIPE_GAP, w: PIPE_W, h: (canvas.height / dpr) - (p.top + PIPE_GAP) };

    if (circleRectCollision(player.x, player.y, player.r, topRect.x, topRect.y, topRect.w, topRect.h) ||
        circleRectCollision(player.x, player.y, player.r, bottomRect.x, bottomRect.y, bottomRect.w, bottomRect.h)) {
      state = 'gameover';
    }

    // eliminar pipes fuera de pantalla
    if (p.x + PIPE_W < -50) pipes.splice(i, 1);
  }
}

function draw() {
  // Fondo cielo
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  // Suelo
  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(0, (canvas.height / dpr) - 10, canvas.width / dpr, 10);

  // Pipes
  for (const p of pipes) {
    ctx.fillStyle = '#2E8B57';
    // superior
    ctx.fillRect(p.x, 0, PIPE_W, p.top);
    // inferior
    ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_W, (canvas.height / dpr) - (p.top + PIPE_GAP) - 10);
    // borde
    ctx.strokeStyle = '#1E5638';
    ctx.strokeRect(p.x, 0, PIPE_W, p.top);
    ctx.strokeRect(p.x, p.top + PIPE_GAP, PIPE_W, (canvas.height / dpr) - (p.top + PIPE_GAP) - 10);
  }

  // Jugador (círculo)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#B8860B';
  ctx.stroke();

  // Puntaje
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Puntos: ' + score, 14, 34);

  // Mensajes
  ctx.textAlign = 'center';
  if (state === 'menu') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect((canvas.width / dpr)/2 - 140, (canvas.height / dpr)/2 - 70, 280, 140);
    ctx.fillStyle = 'white';
    ctx.font = '22px sans-serif';
    ctx.fillText('Toca para jugar', (canvas.width / dpr)/2, (canvas.height / dpr)/2 - 10);
    ctx.font = '16px sans-serif';
    ctx.fillText('Toca la pantalla para saltar', (canvas.width / dpr)/2, (canvas.height / dpr)/2 + 20);
  } else if (state === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect((canvas.width / dpr)/2 - 160, (canvas.height / dpr)/2 - 80, 320, 160);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', (canvas.width / dpr)/2, (canvas.height / dpr)/2 - 10);
    ctx.font = '18px sans-serif';
    ctx.fillText('Puntos: ' + score, (canvas.width / dpr)/2, (canvas.height / dpr)/2 + 20);
    ctx.font = '16px sans-serif';
    ctx.fillText('Toca para jugar de nuevo', (canvas.width / dpr)/2, (canvas.height / dpr)/2 + 48);
  }
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Inicia en menú
state = 'menu';
requestAnimationFrame((t) => { lastTime = t; loop(t); });
