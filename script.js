let board = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
];
let currentPlayer = "X";
let gameActive = true;

const statusDisplay = document.getElementById("status");
const cells = document.querySelectorAll(".cell");
const resetButton = document.getElementById("reset");
const themeToggle = document.getElementById("theme-toggle");
const xColorPicker = document.getElementById("x-color");
const oColorPicker = document.getElementById("o-color");
const winLine = document.getElementById("win-line");
const moveSound = document.getElementById("move-sound");
const winSound = document.getElementById("win-sound");
const drawSound = document.getElementById("draw-sound");
const startSound = document.getElementById("start-sound");

// Preload audio
[moveSound, winSound, drawSound, startSound].forEach(audio => {
    if (audio) audio.load();
});

// Sync custom player colors with CSS custom properties
function updateColors() {
    document.documentElement.style.setProperty("--x-color", xColorPicker.value);
    document.documentElement.style.setProperty("--o-color", oColorPicker.value);
}
xColorPicker.addEventListener("input", updateColors);
oColorPicker.addEventListener("input", updateColors);
updateColors();

// Theme toggle with localStorage persistence
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light Mode";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Cell interaction (click and keyboard)
cells.forEach(cell => {
    cell.addEventListener("click", handleCellClick);
    cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCellClick(e);
        }
    });
});

resetButton.addEventListener("click", resetGame);

// Unlock audio on first user interaction
document.addEventListener("click", () => {
    [moveSound, winSound, drawSound, startSound].forEach(audio => {
        if (audio) audio.muted = false;
    });
}, { once: true });

function handleCellClick(e) {
    const cell = e.currentTarget;
    const index = parseInt(cell.getAttribute("data-index"), 10);
    const row = Math.floor(index / 3);
    const col = index % 3;

    if (board[row][col] !== "" || !gameActive) return;

    board[row][col] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    cell.setAttribute("aria-label", `Cell ${index + 1}, Player ${currentPlayer}`);
    if (moveSound) moveSound.play().catch(() => {});

    const winCells = checkWin();
    if (winCells) {
        statusDisplay.textContent = `Player ${currentPlayer} Wins!`;
        statusDisplay.classList.add("win");
        gameActive = false;
        drawWinLine(winCells);
        createParticles();
        if (winSound) winSound.play().catch(() => {});
        return;
    }

    if (checkDraw()) {
        statusDisplay.textContent = "It's a Draw!";
        gameActive = false;
        if (drawSound) drawSound.play().catch(() => {});
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
}

function checkWin() {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === currentPlayer && board[i][1] === currentPlayer && board[i][2] === currentPlayer) {
            return [i * 3, i * 3 + 1, i * 3 + 2];
        }
    }

    for (let i = 0; i < 3; i++) {
        if (board[0][i] === currentPlayer && board[1][i] === currentPlayer && board[2][i] === currentPlayer) {
            return [i, i + 3, i + 6];
        }
    }

    if (board[0][0] === currentPlayer && board[1][1] === currentPlayer && board[2][2] === currentPlayer) {
        return [0, 4, 8];
    }
    if (board[0][2] === currentPlayer && board[1][1] === currentPlayer && board[2][0] === currentPlayer) {
        return [2, 4, 6];
    }

    return null;
}

function checkDraw() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === "") return false;
        }
    }
    return true;
}

function drawWinLine(cells) {
    const first = cells[0];
    const last = cells[cells.length - 1];
    const boardEl = document.querySelector("#board");
    const boardComputed = getComputedStyle(boardEl);
    const boardSize = parseFloat(boardComputed.width);
    const gap = parseFloat(boardComputed.rowGap) || 8;
    const padding = parseFloat(boardComputed.paddingLeft) || 8;
    const cellSize = (boardSize - 2 * padding - 2 * gap) / 3;

    const firstRow = Math.floor(first / 3);
    const firstCol = first % 3;
    const lastRow = Math.floor(last / 3);
    const lastCol = last % 3;

    const x1 = padding + firstCol * (cellSize + gap) + cellSize / 2;
    const y1 = padding + firstRow * (cellSize + gap) + cellSize / 2;
    const x2 = padding + lastCol * (cellSize + gap) + cellSize / 2;
    const y2 = padding + lastRow * (cellSize + gap) + cellSize / 2;

    let width, height, rotate, startX, startY;

    if (first % 3 === last % 3) {
        // Vertical column win
        width = boardSize - 2 * padding;
        height = 8;
        startX = x1;
        startY = padding;
        rotate = 90;
    } else if (Math.floor(first / 3) === Math.floor(last / 3)) {
        // Horizontal row win
        width = boardSize - 2 * padding;
        height = 8;
        startX = padding;
        startY = y1;
        rotate = 0;
    } else {
        // Diagonal win
        width = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        height = 8;
        startX = x1;
        startY = y1;
        rotate = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    }

    winLine.style.width = "0";
    winLine.style.height = `${height}px`;
    winLine.style.left = `${startX}px`;
    winLine.style.top = `${startY}px`;
    winLine.style.transform = `rotate(${rotate}deg)`;
    winLine.classList.remove("x", "o");
    winLine.classList.add(currentPlayer.toLowerCase());

    requestAnimationFrame(() => {
        winLine.style.width = `${width}px`;
    });
}

function createParticles() {
    const container = document.querySelector(".container");
    const particleContainer = document.createElement("div");
    particleContainer.className = "particles";
    container.appendChild(particleContainer);

    const particleCount = 24;
    const color = currentPlayer === "X" ? xColorPicker.value : oColorPicker.value;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.background = color;
        const angle = Math.random() * 360;
        const distance = Math.random() * 90 + 40;
        particle.style.setProperty("--x", `${Math.cos(angle * Math.PI / 180) * distance}px`);
        particle.style.setProperty("--y", `${Math.sin(angle * Math.PI / 180) * distance}px`);
        particle.style.animationDelay = `${Math.random() * 0.3}s`;
        particleContainer.appendChild(particle);
    }

    setTimeout(() => {
        particleContainer.remove();
    }, 1200);
}

function resetGame() {
    board = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ];
    currentPlayer = "X";
    gameActive = true;
    statusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
    statusDisplay.classList.remove("win");
    cells.forEach((cell, idx) => {
        cell.textContent = "";
        cell.classList.remove("x", "o");
        cell.setAttribute("aria-label", `Cell ${idx + 1}, Empty`);
    });
    winLine.style.width = "0";
    winLine.classList.remove("x", "o");
    const existingParticles = document.querySelector(".particles");
    if (existingParticles) existingParticles.remove();
    if (startSound) startSound.play().catch(() => {});
}
