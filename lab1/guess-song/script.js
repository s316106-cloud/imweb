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
const visualizer = document.querySelector('.audio-visualizer');
const timeProgress = document.getElementById('time-progress');
const feedback = document.getElementById('feedback');
const finalScoreEl = document.getElementById('final-score');
const evaluationMsg = document.getElementById('evaluation-message');

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
let audioDuration = 30; // iTunes previews are usually 30s
let roundStartTime = 0;

const TOTAL_ROUNDS = 10;
const SEARCH_TERMS = ['周杰倫', '林俊傑', '五月天', '鄧紫棋', '陳奕迅', '蔡依林', '張惠妹', '田馥甄', '流行', '熱門'];

// Initialize
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', () => {
    endScreen.classList.add('hidden');
    endScreen.classList.remove('active');
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
        // Pick a random search term to keep it fresh
        const randomTerm = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm)}&limit=100&media=music&country=tw`);
        const data = await response.json();
        
        // Filter songs that have a preview URL
        const validSongs = data.results.filter(track => track.previewUrl && track.trackName && track.artistName);
        
        if (validSongs.length < 10) {
            // Fallback if not enough songs
            return fetchSongsFallback();
        }
        return validSongs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return fetchSongsFallback(); // Fallback to a safe term
    }
}

async function fetchSongsFallback() {
    const response = await fetch(`https://itunes.apple.com/search?term=pop&limit=50&media=music`);
    const data = await response.json();
    return data.results.filter(track => track.previewUrl && track.trackName && track.artistName);
}

async function initGame() {
    startBtn.classList.add('hidden');
    loadingText.classList.remove('hidden');
    
    allSongs = await fetchSongs();
    
    // Reset stats
    currentRound = 1;
    score = 0;
    
    // Switch screens
    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active', 'fade-in');
    
    startRound();
}

function startRound() {
    roundActive = true;
    feedback.textContent = '';
    feedback.className = 'feedback';
    visualizer.classList.remove('playing');
    
    updateUI();
    
    // Select 4 random unique songs
    currentOptions = getRandomSongs(4);
    // Pick 1 as correct
    correctSong = currentOptions[Math.floor(Math.random() * currentOptions.length)];
    
    renderOptions();
    
    // Setup audio and buttons
    audioPlayer.src = correctSong.previewUrl;
    btnPlayStart.disabled = false;
    btnPlayMore.disabled = true;
    btnReplay.disabled = true;
    timeProgress.style.transform = `scaleX(1)`;
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
    currentOptions.forEach((song, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn fade-in';
        btn.style.animationDelay = `${index * 0.1}s`;
        
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
    visualizer.classList.add('playing');
    
    clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        if (!roundActive) {
            clearInterval(progressInterval);
            return;
        }
        
        if (audioPlayer.currentTime >= end || audioPlayer.ended) {
            audioPlayer.pause();
            visualizer.classList.remove('playing');
            clearInterval(progressInterval);
        }
        
        // Update progress bar relative to the total 30s length
        const current = audioPlayer.currentTime;
        const remaining = Math.max(0, 1 - (current / 30));
        timeProgress.style.transform = `scaleX(${remaining})`;
        
    }, 50);
}

function handleGuess(selectedSong, clickedBtn) {
    if (!roundActive) return;
    roundActive = false;
    
    clearInterval(progressInterval);
    visualizer.classList.remove('playing');
    audioPlayer.pause();
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);
    
    const timeTaken = (Date.now() - roundStartTime) / 1000;
    
    if (selectedSong.trackId === correctSong.trackId) {
        // Correct
        clickedBtn.classList.add('correct');
        const points = calculateScore(timeTaken);
        score += points;
        scoreInfo.textContent = score;
        
        feedback.textContent = `答對了！ +${points} 分`;
        feedback.classList.add('show', 'success');
    } else {
        // Wrong
        score -= 5;
        scoreInfo.textContent = score;
        
        clickedBtn.classList.add('wrong');
        feedback.textContent = '答錯了！ -5 分';
        feedback.classList.add('show', 'error');
        
        // Highlight correct answer
        allBtns.forEach(btn => {
            if (btn.querySelector('.song-name').textContent === correctSong.trackName) {
                btn.classList.add('correct');
            }
        });
    }
    
    setTimeout(nextRound, 2000);
}

function handleTimeUp() {
    roundActive = false;
    visualizer.classList.remove('playing');
    audioPlayer.pause();
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);
    
    score -= 5;
    scoreInfo.textContent = score;
    
    feedback.textContent = '時間到！ -5 分';
    feedback.classList.add('show', 'error');
    
    // Highlight correct answer
    allBtns.forEach(btn => {
        if (btn.querySelector('.song-name').textContent === correctSong.trackName) {
            btn.classList.add('correct');
        }
    });
    
    setTimeout(nextRound, 2000);
}

function calculateScore(timeTaken) {
    // 10 points per correct answer
    return 10;
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
    gameScreen.classList.add('hidden');
    gameScreen.classList.remove('active');
    
    endScreen.classList.remove('hidden');
    endScreen.classList.add('active');
    
    // Animate score counter
    animateValue(finalScoreEl, 0, score, 1500);
    
    // Set evaluation message
    if (score >= 80) {
        evaluationMsg.innerHTML = "太神啦！你是真正的華語音樂達人！👑";
    } else if (score >= 50) {
        evaluationMsg.innerHTML = "很不錯喔！你的音樂品味很好！🎵";
    } else if (score >= 20) {
        evaluationMsg.innerHTML = "還差一點，多聽聽歌再來挑戰吧！🎧";
    } else {
        evaluationMsg.innerHTML = "看來你比較少聽這類型的歌呢！😅";
    }
    
    // Reset start button for next time
    startBtn.classList.remove('hidden');
    loadingText.classList.add('hidden');
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Easing function for smooth stop
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
