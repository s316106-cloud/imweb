// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const mazeContainer = document.getElementById('maze-container');
const bumpCountEl = document.getElementById('bump-count');

// Game State
let isPlaying = false;
let bumpCount = 0;
let playerPos = { r: 0, c: 0 };
let mazeDOM = [];

// Maze Layout (10x10)
// 0: path, 1: wall, 2: start, 3: exit
const layout = [
    [2, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 1],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 0, 1, 1],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    [1, 1, 1, 0, 0, 0, 1, 0, 0, 3]
];

const ROWS = layout.length;
const COLS = layout[0].length;

// Initialize
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Listen to keyboard
document.addEventListener('keydown', handleKeyPress);

function startGame() {
    bumpCount = 0;
    isPlaying = true;
    playerPos = { r: 0, c: 0 };
    
    // UI Transitions
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    renderMaze();
}

function renderMaze() {
    mazeContainer.innerHTML = '';
    mazeDOM = [];
    
    for (let r = 0; r < ROWS; r++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'maze-row';
        const rowDOM = [];
        
        for (let c = 0; c < COLS; c++) {
            const cellVal = layout[r][c];
            const cellEl = document.createElement('div');
            cellEl.className = 'maze-cell';
            
            if (cellVal === 1) {
                cellEl.classList.add('cell-wall');
            } else if (cellVal === 3) {
                cellEl.classList.add('cell-exit');
            }
            
            // Set initial player position
            if (r === playerPos.r && c === playerPos.c) {
                cellEl.classList.add('cell-player');
            }
            
            rowEl.appendChild(cellEl);
            rowDOM.push(cellEl);
        }
        
        mazeContainer.appendChild(rowEl);
        mazeDOM.push(rowDOM);
    }
}

function handleKeyPress(e) {
    if (!isPlaying) return;
    
    // Prevent default scrolling for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }
    
    let nextR = playerPos.r;
    let nextC = playerPos.c;
    
    switch (e.key) {
        case 'ArrowUp':    nextR--; break;
        case 'ArrowDown':  nextR++; break;
        case 'ArrowLeft':  nextC--; break;
        case 'ArrowRight': nextC++; break;
        default: return; // ignore other keys
    }
    
    // Check boundaries
    if (nextR < 0 || nextR >= ROWS || nextC < 0 || nextC >= COLS) {
        return; // hit boundary, ignore
    }
    
    const targetCell = layout[nextR][nextC];
    
    if (targetCell === 1) {
        // Hit a wall!
        bumpCount++;
        triggerWallGlow(nextR, nextC);
    } else {
        // Move player
        movePlayer(nextR, nextC);
        
        // Check win condition
        if (targetCell === 3) {
            endGame();
        }
    }
}

function movePlayer(newR, newC) {
    // Remove old player class
    mazeDOM[playerPos.r][playerPos.c].classList.remove('cell-player');
    
    // Update state
    playerPos.r = newR;
    playerPos.c = newC;
    
    // Add new player class
    mazeDOM[playerPos.r][playerPos.c].classList.add('cell-player');
}

function triggerWallGlow(r, c) {
    const wallEl = mazeDOM[r][c];
    
    // Reset animation if already playing
    wallEl.classList.remove('bumped');
    // Trigger reflow
    void wallEl.offsetWidth; 
    
    wallEl.classList.add('bumped');
}

function endGame() {
    isPlaying = false;
    
    // Update stats
    bumpCountEl.textContent = bumpCount;
    
    // Small delay to let the user see they reached the exit
    setTimeout(() => {
        gameScreen.classList.add('hidden');
        endScreen.classList.remove('hidden');
    }, 500);
}
