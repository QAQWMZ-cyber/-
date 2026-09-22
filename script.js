const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

const gridSize = 21;
const cellSize = canvas.width / gridSize;
const initialSnake = [
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];

let snake;
let direction;
let nextDirection;
let food;
let score;
let bestScore;
let animationFrameId;
let lastTime = 0;
let accumulator = 0;
let tickDelay = 140;
let state = 'idle';

const bestScoreKey = 'snake-best-score';

function loadBestScore() {
  const value = Number(localStorage.getItem(bestScoreKey) || 0);
  bestScore = Number.isFinite(value) ? value : 0;
  bestScoreEl.textContent = String(bestScore);
}

function saveBestScore() {
  localStorage.setItem(bestScoreKey, String(bestScore));
  bestScoreEl.textContent = String(bestScore);
}

function setOverlay(title, text, buttonText = '开始游戏') {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = buttonText;
  overlay.classList.add('visible');
}

function hideOverlay() {
  overlay.classList.remove('visible');
}

function resetGame() {
  snake = initialSnake.map((segment) => ({ ...segment }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = '0';
  spawnFood();
  state = 'ready';
  pauseBtn.textContent = '暂停';
  setOverlay('准备开始', '按空格键开始游戏，方向键或 WASD 控制。');
  render();
}

function spawnFood() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (snake.some((segment) => segment.x === position.x && segment.y === position.y));

  food = position;
}

function startGame() {
  if (state === 'running') {
    return;
  }

  if (state === 'idle' || state === 'ready' || state === 'over') {
    state = 'running';
    hideOverlay();
  }
}

function pauseGame() {
  if (state === 'running') {
    state = 'paused';
    pauseBtn.textContent = '继续';
    setOverlay('暂停中', '按空格键继续，或者点击继续按钮。', '继续游戏');
  } else if (state === 'paused') {
    state = 'running';
    pauseBtn.textContent = '暂停';
    hideOverlay();
  }
}

function endGame() {
  state = 'over';
  pauseBtn.textContent = '暂停';
  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }
  setOverlay('游戏结束', `本局得分：${score}，再来一局挑战更高纪录吧！`, '再来一局');
}

function moveSnake() {
  direction = { ...nextDirection };
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (
    head.x < 0 ||
    head.x >= gridSize ||
    head.y < 0 ||
    head.y >= gridSize ||
    snake.some((segment) => segment.x === head.x && segment.y === head.y)
  ) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = String(score);
    if (score > bestScore) {
      bestScore = score;
      saveBestScore();
    }
    spawnFood();
  } else {
    snake.pop();
  }
}

function setDirection(newDirection) {
  const isOpposite =
    newDirection.x === -direction.x && newDirection.y === -direction.y;

  if (!isOpposite) {
    nextDirection = newDirection;
  }
}

function drawGrid() {
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= gridSize; i += 1) {
    const position = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawFood() {
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(
    food.x * cellSize + cellSize / 2,
    food.y * cellSize + cellSize / 2,
    cellSize * 0.35,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * cellSize + 1;
    const y = segment.y * cellSize + 1;
    const size = cellSize - 2;

    ctx.fillStyle = index === 0 ? '#34d399' : '#10b981';
    ctx.fillRect(x, y, size, size);

    if (index === 0) {
      ctx.fillStyle = '#0f172a';
      const eyeOffset = cellSize * 0.25;
      const eyeSize = 2.5;
      ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
      ctx.fillRect(x + cellSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
    }
  });
}

function render() {
  drawGrid();
  if (food) {
    drawFood();
  }
  if (snake) {
    drawSnake();
  }
}

function gameLoop(timestamp) {
  if (state === 'running') {
    accumulator += timestamp - lastTime;
    lastTime = timestamp;

    while (accumulator >= tickDelay) {
      moveSnake();
      if (state !== 'running') {
        break;
      }
      accumulator -= tickDelay;
    }
  } else {
    lastTime = timestamp;
  }

  render();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const map = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  if (key === ' ') {
    event.preventDefault();
    if (state === 'running') {
      pauseGame();
    } else if (state === 'ready' || state === 'paused' || state === 'over') {
      if (state === 'over') {
        resetGame();
      }
      startGame();
    }
    return;
  }

  const target = map[key];
  if (target) {
    event.preventDefault();
    if (state === 'idle' || state === 'ready') {
      startGame();
    }
    setDirection(target);
  }
}

startBtn.addEventListener('click', () => {
  if (state === 'over') {
    resetGame();
  }
  startGame();
});

pauseBtn.addEventListener('click', () => {
  if (state === 'running' || state === 'paused') {
    pauseGame();
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
  startGame();
});

document.addEventListener('keydown', handleKeydown);

loadBestScore();
resetGame();
requestAnimationFrame(gameLoop);
