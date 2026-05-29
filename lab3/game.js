

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
    
    // 監聽 pointerdown 實現最即時、零延遲的觸覺與音效反饋
    bubble.addEventListener('pointerdown', function(e) {
        if (!isPlaying || this.classList.contains('popped')) return;
        
        // 標記為已破裂
        this.classList.add('popped');
        
        // 1. 播放擬真泡泡音效
        playPopSound();
        
        // 2. 觸覺震動 (手機/平板)
        if (navigator.vibrate) {
            navigator.vibrate(12);
        }
        
        // 3. 產生彩虹爆破粒子與衝擊波環
        const x = e.clientX || (this.getBoundingClientRect().left + size / 2);
        const y = e.clientY || (this.getBoundingClientRect().top + size / 2);
        createPoppedParticles(x, y, size);
        createPopRing(x, y, size);
        
        // 增加分數
        score += points;
        updateScore();
        
        // 顯示得分浮水印
        showFloatingScore(x, y, points);
        
        // 快速移除
        setTimeout(() => {
            this.remove();
        }, 250);
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

// 擬真 Web Audio API 泡泡破裂音效
function playPopSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // 1. 低頻爆裂波 (Pop sound core)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        
        // 2. 高頻點擊脆響 (Click snap)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1500, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.03);
    } catch (e) {
        console.error(e);
    }
}

// 產生飛散粒子（如煙花般放射並受重力下墜的水花）
function createPoppedParticles(x, y, size) {
    const particleCount = 18; // 18 顆水花滴，形成煙花爆裂的華麗感
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'pop-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // 隨機大小（大小不一形成景深與層次感）
        const pSize = Math.random() * 8 + 3; // 3px to 11px
        particle.style.width = `${pSize}px`;
        particle.style.height = `${pSize}px`;
        
        // 煙花般放射狀飛行軌跡
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 80 + 40; // 40px to 120px 放射半徑
        const targetX = Math.cos(angle) * distance;
        const targetY = Math.sin(angle) * distance;
        const gravity = Math.random() * 50 + 35; // 35px to 85px 的重力下墜高度
        const delay = Math.random() * 0.04; // 微小隨機延遲，營造爆破擴散感
        
        particle.style.setProperty('--tx', `${targetX}px`);
        particle.style.setProperty('--ty', `${targetY}px`);
        particle.style.setProperty('--gravity', `${gravity}px`);
        particle.style.setProperty('--angle', `${angle}rad`);
        particle.style.animationDelay = `${delay}s`;
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
    }
}

// 產生膨脹衝擊環
function createPopRing(x, y, size) {
    const ring = document.createElement('div');
    ring.className = 'pop-ring';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.width = `${size}px`;
    ring.style.height = `${size}px`;
    
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 400);
}
