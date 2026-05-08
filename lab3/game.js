

// DOM Elements
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const gameHeader = document.getElementById('game-header');
const gameContainer = document.getElementById('game-container');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const timeLeftEl = document.getElementById('time-left');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const backLink = document.getElementById('back-link');
const nextGameLink = document.getElementById('next-game-link');

// Game State
let score = 0;
let timeLeft = 30;
let gameInterval;
let spawnInterval;
let isPlaying = false;

// Initialize
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    // Reset state
    score = 0;
    timeLeft = 30;
    isPlaying = true;
    updateScore();
    timeLeftEl.textContent = timeLeft;
    
    // Clear container
    gameContainer.innerHTML = '';
    
    // UI Transitions
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    gameHeader.classList.remove('hidden');
    backLink.classList.add('hidden'); // 隱藏返回按鈕避免遊戲中誤觸
    nextGameLink.classList.add('hidden'); // 隱藏下一關按鈕
    
    // Start timers
    gameInterval = setInterval(updateTime, 1000);
    spawnInterval = setInterval(spawnBubble, 400); // 每 0.4 秒產生一個泡泡
}

function updateTime() {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        endGame();
    }
}

function spawnBubble() {
    if (!isPlaying) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    // Randomize size (40px to 140px)
    const size = Math.random() * 100 + 40;
    
    // Randomize position (5vw to 95vw to stay within screen)
    const left = Math.random() * 90 + 5;
    
    // Duration: smaller bubbles fly faster.
    // 40px -> fast (3s), 140px -> slow (8s)
    const normalizedSize = (size - 40) / 100; // 0 to 1
    const duration = 3 + (normalizedSize * 5); // 3s to 8s
    
    // Calculate points based on size (smaller = more points)
    // 40px -> 50 pts, 140px -> 10 pts
    const points = Math.floor(50 - (normalizedSize * 40));
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}vw`;
    bubble.style.animationDuration = `${duration}s`;
    
    bubble.addEventListener('click', function(e) {
        if (!isPlaying || this.classList.contains('popped')) return;
        
        // Mark as popped
        this.classList.add('popped');
        
        // Add score
        score += points;
        updateScore();
        
        // Show floating score
        showFloatingScore(e.clientX, e.clientY, points);
        
        // Remove after animation
        setTimeout(() => {
            this.remove();
        }, 300);
    });
    
    // Auto cleanup after animation ends to prevent memory leak
    setTimeout(() => {
        if (document.body.contains(bubble) && !bubble.classList.contains('popped')) {
            bubble.remove();
        }
    }, duration * 1000 + 1000);
    
    gameContainer.appendChild(bubble);
}

function updateScore() {
    scoreEl.textContent = score;
}

function showFloatingScore(x, y, points) {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-score';
    floatEl.textContent = `+${points}`;
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    
    document.body.appendChild(floatEl);
    
    setTimeout(() => {
        floatEl.remove();
    }, 800);
}

function endGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    
    // Animate final score
    animateValue(finalScoreEl, 0, score, 1500);
    
    // UI Transitions
    gameHeader.classList.add('hidden');
    endScreen.classList.remove('hidden');
    backLink.classList.remove('hidden');
    nextGameLink.classList.remove('hidden');
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        obj.innerHTML = Math.floor(easeOutQuart * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}
