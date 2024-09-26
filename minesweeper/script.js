import {
  TILE_STATUSES,
  createBoard,
  markTile,
  revealTile,
  checkWin,
  checkLose,
  positionMatch,
  markedTilesCount,
} from "./minesweeper.js";

const boardSizes = {
  Easy: { size: 8, mines: 10 },
  Medium: { size: 16, mines: 40 },
  Hard: { size: 24, mines: 99 },
};

let board;
let timerInterval;
let timeElapsed = 0;
let isFirstClick = true;
let isGameOver = false;

const boardElement = document.querySelector(".board");
const minesLeftText = document.querySelector("[data-mine-count]");
const messageText = document.querySelector(".subtext");
const timerText = document.querySelector("[data-timer]");
const resetButton = document.querySelector("[data-reset]");
const difficultySelect = document.querySelector("[data-difficulty]");
const hintButton = document.querySelector("[data-hint]");
const leaderboardElement = document.querySelector("[data-leaderboard]");

difficultySelect.addEventListener("change", startGame);
resetButton.addEventListener("click", resetGame);
hintButton.addEventListener("click", giveHint);

function startGame() {
  const difficulty = difficultySelect.value;
  const { size, mines } = boardSizes[difficulty];
  board = createBoard(size, getMinePositions(size, mines));
  timeElapsed = 0;
  isFirstClick = true;
  isGameOver = false;
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  boardElement.style.setProperty("--size", size);
  render();
  displayLeaderboard(difficulty);
}

function resetGame() {
  clearInterval(timerInterval);
  timeElapsed = 0;
  timerText.textContent = "Time: 0s";
  startGame();
}

function render() {
  boardElement.innerHTML = "";
  checkGameEnd();

  getTileElements().forEach((element) => {
    boardElement.append(element);
  });

  listMinesLeft();
}

function getTileElements() {
  return board.flatMap((row) => {
    return row.map(tileToElement);
  });
}

function tileToElement(tile) {
  const element = document.createElement("div");
  element.dataset.status = tile.status;
  element.dataset.x = tile.x;
  element.dataset.y = tile.y;
  element.textContent = tile.adjacentMinesCount || "";
  if (tile.status === TILE_STATUSES.NUMBER) {
    element.dataset.adjacent = tile.adjacentMinesCount;
  }
  return element;
}

boardElement.addEventListener("click", handleTileClick);
boardElement.addEventListener("contextmenu", handleTileRightClick);

function handleTileClick(e) {
  if (isGameOver || !e.target.matches("[data-status]")) return;

  const tile = {
    x: parseInt(e.target.dataset.x),
    y: parseInt(e.target.dataset.y),
  };

  if (isFirstClick) {
    ensureSafeFirstClick(tile);
    isFirstClick = false;
  }

  board = revealTile(board, tile);
  render();
}

function handleTileRightClick(e) {
  if (isGameOver || !e.target.matches("[data-status]")) return;

  e.preventDefault();
  board = markTile(board, {
    x: parseInt(e.target.dataset.x),
    y: parseInt(e.target.dataset.y),
  });
  render();
}

function ensureSafeFirstClick(clickedTile) {
  if (board[clickedTile.x][clickedTile.y].mine) {
    // Find a non-mine tile to swap with
    const safeTile = board.flat().find((tile) => !tile.mine);
    // Swap the mine
    board[clickedTile.x][clickedTile.y].mine = false;
    board[safeTile.x][safeTile.y].mine = true;
    // Recalculate adjacent mine counts
    board = board.map((row, x) =>
      row.map((tile, y) => ({
        ...tile,
        adjacentMinesCount: getAdjacentMinesCount(board, { x, y }),
      })),
    );
  }
}

function getAdjacentMinesCount(board, { x, y }) {
  return board
    .slice(Math.max(0, x - 1), x + 2)
    .flatMap((row) => row.slice(Math.max(0, y - 1), y + 2))
    .filter((tile) => tile.mine).length;
}

function listMinesLeft() {
  minesLeftText.textContent =
    boardSizes[difficultySelect.value].mines - markedTilesCount(board);
}

function checkGameEnd() {
  const win = checkWin(board);
  const lose = checkLose(board);

  if (win || lose) {
    isGameOver = true;
    clearInterval(timerInterval);

    if (win) {
      messageText.textContent = "You Win";
      updateLeaderboard(difficultySelect.value, timeElapsed);
      displayLeaderboard(difficultySelect.value);
    }
    if (lose) {
      messageText.textContent = "You Lose";
      board.forEach((row) => {
        row.forEach((tile) => {
          if (tile.status === TILE_STATUSES.MARKED)
            board = markTile(board, tile);
          if (tile.mine) board = revealTile(board, tile);
        });
      });
    }
  }
}

function getMinePositions(boardSize, numberOfMines) {
  const positions = [];

  while (positions.length < numberOfMines) {
    const position = {
      x: randomNumber(boardSize),
      y: randomNumber(boardSize),
    };

    if (!positions.some(positionMatch.bind(null, position))) {
      positions.push(position);
    }
  }

  return positions;
}

function randomNumber(size) {
  return Math.floor(Math.random() * size);
}

function updateTimer() {
  timeElapsed++;
  timerText.textContent = `Time: ${timeElapsed}s`;
}

function giveHint() {
  if (isGameOver) return;

  const hiddenSafeTiles = board
    .flat()
    .filter((tile) => !tile.mine && tile.status === TILE_STATUSES.HIDDEN);

  if (hiddenSafeTiles.length > 0) {
    const randomSafeTile =
      hiddenSafeTiles[Math.floor(Math.random() * hiddenSafeTiles.length)];
    board = revealTile(board, randomSafeTile);
    render();
  }
}

function updateLeaderboard(difficulty, time) {
  const leaderboard = JSON.parse(
    localStorage.getItem(`leaderboard_${difficulty}`) || "[]",
  );
  const playerName = prompt(
    "You've made it to the leaderboard! Enter your name:",
  );
  if (playerName) {
    leaderboard.push({ name: playerName, time });
    leaderboard.sort((a, b) => a.time - b.time);
    leaderboard.splice(10); // Keep only top 10
    localStorage.setItem(
      `leaderboard_${difficulty}`,
      JSON.stringify(leaderboard),
    );
  }
}

function displayLeaderboard(difficulty) {
  const leaderboard = JSON.parse(
    localStorage.getItem(`leaderboard_${difficulty}`) || "[]",
  );
  leaderboardElement.innerHTML = leaderboard
    .map(
      (entry, index) => `<li>${index + 1}. ${entry.name}: ${entry.time}s</li>`,
    )
    .join("");
}

startGame();
