const gridEl = document.getElementById("sudoku-grid");
const normalBtn = document.getElementById("normal-mode");
const noteBtn = document.getElementById("note-mode");
const numpadBtns = document.querySelectorAll(".num-key");
const eraseBtn = document.getElementById("erase");
const difficultyBtns = document.querySelectorAll(".difficulty button");

let selectedCell = null;
let candidateMode = false;

let grid = Array(9).fill().map(() => Array(9).fill(null));
let notes = Array(9).fill().map(() => Array(9).fill().map(() => []));
let fixed = Array(9).fill().map(() => Array(9).fill(false));

const mistakesEl = document.getElementById("mistakes");
const restartBtn = document.getElementById("restart");

let fullSolution = null;
let mistakes = 0;

const timerEl = document.getElementById("timer");
let incorrectCells = Array(9).fill().map(() => Array(9).fill(false));
let startTime = null;
let timerInterval = null;

const pauseBtn = document.getElementById("pause");
const pauseOverlay = document.getElementById("pause-overlay");
let isPaused = false;

const difficulties = ['easy', 'medium', 'hard'];
let currentDifficulty = 'easy';
let currentDate = getTodayString();
let archiveStartDate = '2025-05-25';

// Utility: Get YYYY-MM-DD string for today
function getTodayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}


// Utility: Seeded random number generator (simple LCG)
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Utility: Convert date+difficulty to a numeric seed
function getSeed(date, difficulty) {
  return (
    parseInt(date.replace(/-/g, ''), 10) +
    difficulties.indexOf(difficulty) * 100000
  );
}

// Generate a Sudoku puzzle deterministically for a given date and difficulty
function generateDailySudoku(date, difficulty) {
  const seed = getSeed(date, difficulty);
  // Use your existing sudoku generator, but make it deterministic using the seed
  // For demonstration, we'll just return a dummy grid
  // Replace this with your actual generator using the seed!
  return generateSudokuWithSeed(seed, difficulty);
}

function generateSudokuWithSeed(seed, difficulty) {
  // 1. Use seeded PRNG
  const rand = mulberry32(seed);

  // 2. Generate a full grid using seeded shuffle
  let grid = Array(9).fill().map(() => Array(9).fill(null));

  function fillGrid() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          let numbers = seededShuffle([1,2,3,4,5,6,7,8,9], rand);
          for (let num of numbers) {
            if (isSafe(grid, row, col, num)) {
              grid[row][col] = num;
              if (fillGrid()) return true;
              grid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  fillGrid();

  // 3. Remove cells based on difficulty
  let clues;
  switch (difficulty) {
    case 'easy': clues = 40; break;
    case 'medium': clues = 30; break;
    case 'hard': clues = 22; break;
    default: clues = 30;
  }
  let toRemove = 81 - clues;
  let positions = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r, c]);
  positions = seededShuffle(positions, rand);

  let puzzle = grid.map(row => row.slice());
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = null;
  }

  // Save the solution for checking
  fullSolution = grid.map(row => row.slice());

  return puzzle;
}

// Seeded PRNG (Mulberry32)
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Seeded shuffle
function seededShuffle(array, rand) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// archive list
function renderArchive() {
  const archiveList = document.getElementById('archive-list');
  archiveList.innerHTML = '';
  let date = new Date('2025-05-25');
  const today = new Date();
  while (date <= today) {
    const dateStr = date.toISOString().slice(0, 10);
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.textContent = dateStr;

    const btnGroup = document.createElement('div');
    ['easy', 'medium', 'hard'].forEach(diff => {
      const a = document.createElement('a');
      a.className = 'btn btn-sm btn-outline-primary ms-2';
      a.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
      a.href = `index.html?date=${dateStr}&difficulty=${diff}`;
      btnGroup.appendChild(a);
    });

    li.appendChild(btnGroup);
    archiveList.appendChild(li);
    date.setDate(date.getDate() + 1);
  }
}

// Place this in sudoku.js or a <script> tag after the DOM loads
document.addEventListener("DOMContentLoaded", function() {
  const dateEl = document.getElementById("current-date");
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = today.toLocaleDateString(undefined, options);
});

// Load and render the sudoku for a given date and difficulty
function loadSudokuForDateAndDifficulty(date, difficulty) {
  const puzzle = generateDailySudoku(date, difficulty);
  grid = puzzle.map(row => row.slice());
  fixed = grid.map(row => row.map(cell => cell !== null));
  notes = Array(9).fill().map(() => Array(9).fill().map(() => []));
  incorrectCells = Array(9).fill().map(() => Array(9).fill(false));
  mistakes = 0;
  updateMistakesDisplay();
  startTimer();
  renderGrid();
}

// Difficulty button event listeners
document.querySelectorAll('.difficultyBtn').forEach(btn => {
  btn.addEventListener('click', function() {
    currentDifficulty = this.dataset.difficulty;
    currentDate = getTodayString();
    loadSudokuForDateAndDifficulty(currentDate, currentDifficulty);
  });
});

// On page load
document.addEventListener('DOMContentLoaded', () => {
  renderArchive();
  loadSudokuForDateAndDifficulty(currentDate, currentDifficulty);
});

function isSafe(grid, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num || grid[x][col] === num ||
        grid[3 * Math.floor(row / 3) + Math.floor(x / 3)][3 * Math.floor(col / 3) + x % 3] === num) {
      return false;
    }
  }
  return true;
}

function solve(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solve(grid)) return true;
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function generateFullGrid() {
  const newGrid = Array(9).fill().map(() => Array(9).fill(null));
  solve(newGrid);
  return newGrid;
}

function createPuzzle(difficulty) {
  currentDifficulty = difficulty;
  fullSolution = generateFullGrid(); // Save full solution
  grid = fullSolution.map(row => row.slice());
  fixed = Array(9).fill().map(() => Array(9).fill(false));
  notes = Array(9).fill().map(() => Array(9).fill().map(() => []));
  incorrectCells = Array(9).fill().map(() => Array(9).fill(false));
  startTimer();

  mistakes = 0;
  updateMistakesDisplay();
  

  let clues;
  switch (difficulty) {
    case 'easy': clues = 40; break;
    case 'medium': clues = 30; break;
    case 'hard': clues = 22; break;
  }

  let toRemove = 81 - clues;
  while (toRemove > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (grid[row][col] !== null) {
      grid[row][col] = null;
      toRemove--;
    }
  }

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      fixed[r][c] = grid[r][c] !== null;
    }
  }

  renderGrid();
}

function renderGrid() {
  gridEl.innerHTML = '';

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const box = document.createElement('div');
      box.classList.add('sudoku-box');

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxRow * 3 + r;
          const col = boxCol * 3 + c;

          const cell = document.createElement('div');
          cell.classList.add('cell');
          cell.dataset.row = row;
          cell.dataset.col = col;

          const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;

          if (selectedCell) {
            const sameRow = selectedCell.row === row;
            const sameCol = selectedCell.col === col;
            const sameBox = Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
                            Math.floor(selectedCell.col / 3) === Math.floor(col / 3);
            if (sameRow || sameCol || sameBox) {
              cell.classList.add('highlight');
            }
          }

          if (isSelected) {
            cell.classList.add('selected');
          }

          if (fixed[row][col] && grid[row][col]) {
            cell.textContent = grid[row][col];
            cell.classList.add('prefilled');
          } else if (grid[row][col]) {
            cell.textContent = grid[row][col];
            if (incorrectCells[row][col]) {
              cell.classList.add('incorrect');
            }
          } else if (notes[row][col].length > 0) {
            const noteEl = document.createElement('div');
            noteEl.classList.add('candidates');
            noteEl.innerHTML = notes[row][col].sort().map(n => `<span>${n}</span>`).join('');
            cell.appendChild(noteEl);
          }

          if (!fixed[row][col]) {
            cell.addEventListener('click', () => selectCell(row, col));
          }

          box.appendChild(cell);
        }
      }

      gridEl.appendChild(box);
    }
  }
}

function selectCell(row, col) {
  selectedCell = { row, col };
  if (isPaused || !selectedCell) return;
  renderGrid();
}

function setNumber(num) {
  if (isPaused || !selectedCell) return;

  if (!selectedCell) return;
  const { row, col } = selectedCell;
  if (fixed[row][col]) return;

  if (candidateMode) {
    const idx = notes[row][col].indexOf(num);
    if (idx > -1) {
      notes[row][col].splice(idx, 1);
    } else {
      notes[row][col].push(num);
    }
  } else {
    if (fullSolution[row][col] !== num) {
      mistakes++;
      updateMistakesDisplay();
      incorrectCells[row][col] = true;
      grid[row][col] = num;

      if (mistakes >= 3) {
        alert("Game over! You've made 3 mistakes.");
        createPuzzle(currentDifficulty);
        return;
      }
    } else {
      grid[row][col] = num;
      incorrectCells[row][col] = false;
      notes[row][col] = [];
    }
  }

  renderGrid();
}

function updateMistakesDisplay() {
  mistakesEl.textContent = `Mistakes: ${mistakes} / 3`;
}
restartBtn.addEventListener('click', () => {
  createPuzzle(currentDifficulty);
});

function erase() {
  if (isPaused || !selectedCell) return;
  if (!selectedCell) return;
  const { row, col } = selectedCell;
  if (fixed[row][col]) return;

  grid[row][col] = null;
  notes[row][col] = [];
  incorrectCells[row][col] = false;
  renderGrid();
}

normalBtn.addEventListener('click', () => {
  candidateMode = false;
  normalBtn.classList.add('active');
  noteBtn.classList.remove('active');
});

noteBtn.addEventListener('click', () => {
  candidateMode = true;
  noteBtn.classList.add('active');
  normalBtn.classList.remove('active');
});

numpadBtns.forEach(btn => {
  btn.addEventListener('click', () => setNumber(parseInt(btn.dataset.num)));
});

eraseBtn.addEventListener('click', erase);

difficultyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    createPuzzle(btn.dataset.difficulty);
  });
});

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');
  timerEl.textContent = `${minutes}:${seconds}`;
}

// pausing game
function pauseGame() {
  clearInterval(timerInterval);
  pauseOverlay.style.display = "flex";
  isPaused = true;
}

function resumeGame() {
  startTimer();
  pauseOverlay.style.display = "none";
  isPaused = false;
}

pauseBtn.addEventListener("click", () => {
  if (isPaused) {
    resumeGame();
    pauseBtn.innerHTML = "&#10073;&#10073;"; // Pause symbol
  } else {
    pauseGame();
    pauseBtn.innerHTML = "&#9654;"; // Play symbol (▶)
  }
});

const darkToggle = document.getElementById("toggle-dark");

document.getElementById("resume-btn").addEventListener("click", () => {
  resumeGame();
  pauseBtn.innerHTML = "&#10073;&#10073;"; // Reset pause button to pause symbol
});

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const darkModeActive = document.body.classList.contains("dark-mode");
  darkToggle.textContent = darkModeActive ? "☀️ Light Mode" : "🌙 Dark Mode";
});

document.addEventListener('keydown', function(e) {
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.isContentEditable) return;

  // Number keys 1-9
  if (e.key >= '1' && e.key <= '9') {
    handleNumberInput(parseInt(e.key, 10));
  }
  // Erase with 0, Backspace, or Delete
  if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
    handleErase();
  }
  // Optional: Note mode toggle with N
  if (e.key.toLowerCase() === 'n') {
    toggleNoteMode();
  }
});

// Example handlers (replace with your actual logic)
function handleNumberInput(num) {
  // Insert number into selected cell
  // ...
}
function handleErase() {
  // Erase selected cell
  // ...
}
function toggleNoteMode() {
  // Toggle note mode
  // ...
}

document.getElementById('current-date').textContent = new Date().toLocaleDateString();

// loading default puzzle
createPuzzle('easy');
