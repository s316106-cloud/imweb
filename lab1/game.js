const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const loadingText = document.getElementById('loading');

const roundInfo = document.getElementById('round-info');
const scoreInfo = document.getElementById('score-info');
const optionsGrid = document.getElementById('options');
const audioPlayer = document.getElementById('audio-player');
const feedback = document.getElementById('feedback');
const finalScoreEl = document.getElementById('final-score');

const btnPlayStart = document.getElementById('btn-play-start');
const btnPlayMore = document.getElementById('btn-play-more');
const btnReplay = document.getElementById('btn-replay');

let allSongs = [];
let currentRound = 1;
let score = 0;
let correctSong = null;
let currentOptions = [];
let roundActive = false;
let progressInterval = null;
let audioDuration = 30;
let roundStartTime = 0;

const TOTAL_ROUNDS = 10;
const SEARCH_TERMS = ['周杰倫', '林俊傑', '五月天', '鄧紫棋', '陳奕迅', '蔡依林', '張惠妹', '田馥甄', '流行', '熱門'];

// Initialize
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', () => {
    endScreen.style.display = 'none';
    initGame();
});

btnPlayStart.addEventListener('click', () => {
    btnPlayStart.disabled = true;
    btnPlayMore.disabled = false;
    btnReplay.disabled = false;
    roundStartTime = Date.now();
    playAudioSegment(0, 15);
});

btnPlayMore.addEventListener('click', () => {
    btnPlayMore.disabled = true;
    playAudioSegment(15, 30);
});

btnReplay.addEventListener('click', () => {
    const end = btnPlayMore.disabled ? 30 : 15;
    playAudioSegment(0, end);
});

async function fetchSongs() {
    try {
        const randomTerm = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm)}&limit=100&media=music&country=tw`);
        const data = await response.json();
        
        const validSongs = data.results.filter(track => track.previewUrl && track.trackName && track.artistName);
        
        if (validSongs.length < 10) return fetchSongsFallback();
        return validSongs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return fetchSongsFallback();
    }
}

async function fetchSongsFallback() {
    const response = await fetch(`https://itunes.apple.com/search?term=pop&limit=50&media=music`);
    const data = await response.json();
    return data.results.filter(track => track.previewUrl && track.trackName && track.artistName);
}

async function initGame() {
    startBtn.style.display = 'none';
    loadingText.style.display = 'block';
    
    allSongs = await fetchSongs();
    
    currentRound = 1;
    score = 0;
    
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    
    startRound();
}

function startRound() {
    roundActive = true;
    feedback.textContent = '';
    feedback.className = '';
    
    updateUI();
    
    currentOptions = getRandomSongs(4);
    correctSong = currentOptions[Math.floor(Math.random() * currentOptions.length)];
    
    renderOptions();
    
    audioPlayer.src = correctSong.previewUrl;
    btnPlayStart.disabled = false;
    btnPlayMore.disabled = true;
    btnReplay.disabled = true;
}

function getRandomSongs(count) {
    const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function updateUI() {
    roundInfo.textContent = `回合 ${currentRound}/${TOTAL_ROUNDS}`;
    scoreInfo.textContent = score;
}

function renderOptions() {
    optionsGrid.innerHTML = '';
    currentOptions.forEach((song) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        btn.innerHTML = `
            <span class="song-name">${song.trackName}</span>
            <span class="artist-name">${song.artistName}</span>
        `;
        
        btn.addEventListener('click', () => handleGuess(song, btn));
        optionsGrid.appendChild(btn);
    });
}

function playAudioSegment(start, end) {
    if (!roundActive) return;
    
    audioPlayer.currentTime = start;
    audioPlayer.volume = 0.5;
    audioPlayer.play().catch(e => console.log("Audio play failed:", e));
    
    clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        if (!roundActive) {
            clearInterval(progressInterval);
            return;
        }
        
        if (audioPlayer.currentTime >= end || audioPlayer.ended) {
            audioPlayer.pause();
            clearInterval(progressInterval);
        }
    }, 50);
}

function handleGuess(selectedSong, clickedBtn) {
    if (!roundActive) return;
    roundActive = false;
    
    clearInterval(progressInterval);
    audioPlayer.pause();
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);
    
    const timeTaken = (Date.now() - roundStartTime) / 1000;
    
    if (selectedSong.trackId === correctSong.trackId) {
        clickedBtn.classList.add('correct');
        const points = calculateScore(timeTaken);
        score += points;
        scoreInfo.textContent = score;
        
        feedback.textContent = `答對了！ +${points} 分`;
        feedback.style.color = '#2e7d32'; // Green
    } else {
        clickedBtn.classList.add('wrong');
        feedback.textContent = '答錯了！';
        feedback.style.color = '#c62828'; // Red
        
        allBtns.forEach(btn => {
            if (btn.querySelector('.song-name').textContent === correctSong.trackName) {
                btn.classList.add('correct');
            }
        });
    }
    
    setTimeout(nextRound, 2000);
}

function calculateScore(timeTaken) {
    const maxScore = 1000;
    const minScore = 100;
    const maxTime = audioDuration;
    
    if (timeTaken >= maxTime) return minScore;
    
    const score = maxScore - ((maxScore - minScore) * (timeTaken / maxTime));
    return Math.floor(score);
}

function nextRound() {
    currentRound++;
    if (currentRound > TOTAL_ROUNDS) {
        endGame();
    } else {
        startRound();
    }
}

function endGame() {
    gameScreen.style.display = 'none';
    endScreen.style.display = 'block';
    
    animateValue(finalScoreEl, 0, score, 1500);
    
    startBtn.style.display = 'inline-block';
    loadingText.style.display = 'none';
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
