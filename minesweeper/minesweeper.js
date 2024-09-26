import { times, range } from "lodash/fp";

export const TILE_STATUSES = {
  HIDDEN: "hidden",
  MINE: "mine",
  NUMBER: "number",
  MARKED: "marked",
};

export function createBoard(boardSize, minePositions) {
  return times((x) => {
    return times((y) => {
      return {
        x,
        y,
        mine: minePositions.some(positionMatch.bind(null, { x, y })),
        status: TILE_STATUSES.HIDDEN,
        adjacentMinesCount: 0, // Initialize adjacent mines count
      };
    }, boardSize);
  }, boardSize);
}

export function markedTilesCount(board) {
  return board.reduce((count, row) => {
    return (
      count + row.filter((tile) => tile.status === TILE_STATUSES.MARKED).length
    );
  }, 0);
}

export function markTile(board, { x, y }) {
  const tile = board[x][y];
  if (
    tile.status !== TILE_STATUSES.HIDDEN &&
    tile.status !== TILE_STATUSES.MARKED
  ) {
    return board;
  }

  const newStatus =
    tile.status === TILE_STATUSES.MARKED
      ? TILE_STATUSES.HIDDEN
      : TILE_STATUSES.MARKED;
  return replaceTile(board, { x, y }, { ...tile, status: newStatus });
}

function replaceTile(board, position, newTile) {
  return board.map((row, x) => {
    return row.map((tile, y) => {
      return positionMatch(position, { x, y }) ? newTile : tile;
    });
  });
}

export function revealTile(board, { x, y }, isFirstClick = false) {
  const tile = board[x][y];
  if (tile.status !== TILE_STATUSES.HIDDEN) {
    return board;
  }

  if (isFirstClick && tile.mine) {
    // Move the mine to the first available non-mine tile
    const newMinePosition = board
      .flat()
      .find((t) => !t.mine && (t.x !== x || t.y !== y));
    if (newMinePosition) {
      newMinePosition.mine = true;
      tile.mine = false;
    }
  }

  let newBoard = replaceTile(
    board,
    { x, y },
    { ...tile, status: tile.mine ? TILE_STATUSES.MINE : TILE_STATUSES.NUMBER },
  );

  if (tile.mine) {
    return newBoard; // If it's a mine, just return the board with the mine revealed
  }

  const adjacentTiles = nearbyTiles(board, tile);
  const mines = adjacentTiles.filter((t) => t.mine);
  const updatedTile = {
    ...tile,
    status: TILE_STATUSES.NUMBER,
    adjacentMinesCount: mines.length,
  };

  const boardWithCount = replaceTile(newBoard, { x, y }, updatedTile);

  if (mines.length === 0) {
    return adjacentTiles.reduce((b, t) => {
      return revealTile(b, t);
    }, boardWithCount);
  }

  return boardWithCount;
}

export function checkWin(board) {
  return board.every((row) => {
    return row.every((tile) => {
      return (
        tile.status === TILE_STATUSES.NUMBER ||
        (tile.mine &&
          (tile.status === TILE_STATUSES.HIDDEN ||
            tile.status === TILE_STATUSES.MARKED))
      );
    });
  });
}

export function checkLose(board) {
  return board.some((row) => {
    return row.some((tile) => {
      return (
        tile.status === TILE_STATUSES.MINE &&
        tile.status !== TILE_STATUSES.MARKED
      );
    });
  });
}

export function positionMatch(a, b) {
  return a.x === b.x && a.y === b.y;
}

function nearbyTiles(board, { x, y }) {
  const offsets = range(-1, 2);
  return offsets
    .flatMap((xOffset) => {
      return offsets.map((yOffset) => {
        return board[x + xOffset]?.[y + yOffset];
      });
    })
    .filter((tile) => tile != null);
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
