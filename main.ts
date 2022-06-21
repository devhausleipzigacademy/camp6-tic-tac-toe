/////////////////
// Tic-Tac-Toe //
/////////////////

// # preparation

// ## types & enums

type Player = {
	name: string;
	mark: string;
};

type CellState = {
	mark: string | null;
};

type GameState = Record<string, CellState>;

type Coordinate = [number, number];

type AdjFunc = (coord: Coordinate) => Array<Coordinate>;

// ## utility functions

function addMark(element: Element, mark: string): void {
	element.innerHTML = mark;
}

function removeChildren(element: Element) {
	while (element.lastElementChild) {
		element.removeChild(element.lastElementChild);
	}
}

function coordToId(coord: Coordinate): string {
	const [column, row] = coord;
	return `${column}-${row}`;
}

function idToCoord(id: string): Coordinate {
	return id.split("-").map(Number) as Coordinate;
}

// # setup game board

// ## initialize game state

const players: Array<Player> = [
	{
		name: "Player 1",
		mark: "X",
	},
	{
		name: "Player 2",
		mark: "O",
	},
];

let playerTurn: number = 0;
let finished: boolean = false;
let gameState: GameState = {};

// ## loop over game grid and add cells

function generateGridCells(gameGrid: Element) {
	for (let column = 1; column <= 3; column++) {
		for (let row = 1; row <= 3; row++) {
			const elementId = coordToId([column, row]);

			gameState[elementId] = {
				mark: null,
			};

			const gridElement = document.createElement("div");

			gridElement.id = elementId;
			gridElement.classList.add("grid-element", "h-center");

			gameGrid.appendChild(gridElement);
		}
	}
}

const gameGrid = document.querySelector("#game-grid") as Element;
generateGridCells(gameGrid);

const horizAdj: AdjFunc = function (coord) {
	const [column, row] = coord;
	const left: Coordinate = [column - 1, row];
	const right: Coordinate = [column + 1, row];

	return [left, right];
};

const vertAdj: AdjFunc = function (coord) {
	const [column, row] = coord;
	const top: Coordinate = [column, row + 1];
	const bottom: Coordinate = [column, row - 1];

	return [top, bottom];
};

const backDiaAdj: AdjFunc = function (coord) {
	const [column, row] = coord;
	const topleft: Coordinate = [column - 1, row + 1];
	const bottomright: Coordinate = [column + 1, row - 1];

	return [topleft, bottomright];
};

const forDiaAdj: AdjFunc = function (coord) {
	const [column, row] = coord;
	const bottomleft: Coordinate = [column - 1, row - 1];
	const topright: Coordinate = [column + 1, row + 1];

	return [topright, bottomleft];
};

const adjacencyFunctions = [horizAdj, vertAdj, forDiaAdj, backDiaAdj];

type SeenMemo = Record<string, boolean>;

type Predicate<T> = (element: T) => boolean;

function filterInvalid<T>(array: Array<T>, predicate: Predicate<T>): Array<T> {
	return array.filter((element) => {
		return predicate(element);
	});
}

const threeByThree: Predicate<Coordinate> = function (coord) {
	const [column, row] = coord;
	return !(row < 1 || row > 3 || column < 1 || column > 3);
};

const neverSeen = function (memo: SeenMemo): Predicate<Coordinate> {
	return (coord) => {
		const id = coordToId(coord);
		memo = memo as SeenMemo;
		const haveSeen = memo[id];
		return haveSeen != true;
	};
};

function recursiveCheck(
	coord: Coordinate,
	adjFunc: AdjFunc,
	mark: string,
	currentLength = 1,
	memo: SeenMemo | null = null
): boolean {
	console.log("coord: ", coord);
	console.log("current length: ", currentLength);
	console.log("memo: ", memo);

	if (currentLength == 3) {
		return true;
	}

	if (memo == null) {
		memo = {};
	}

	let winFlag = false;
	const id = coordToId(coord);
	memo[id] = true;

	const neighbors = adjFunc(coord);
	const newNeighbors = filterInvalid<Coordinate>(neighbors, neverSeen(memo));
	const newValidNeighbors = filterInvalid<Coordinate>(
		newNeighbors,
		threeByThree
	);

	console.log("newValidNeighbors: ", newValidNeighbors);
	for (const neighbor of newValidNeighbors) {
		if (winFlag) {
			return winFlag; // shortcircuit looping through neighbors if win already found
		}

		const newId = coordToId(neighbor);
		const state = gameState[newId];

		console.log("recovered state ", newId, " :", state);

		if (state.mark == mark) {
			memo[newId] = true;

			winFlag =
				winFlag ||
				recursiveCheck(
					neighbor,
					adjFunc,
					mark,
					currentLength + 1,
					memo
				);
		}
	}

	return winFlag;
}

function checkWin(coord: Coordinate, player: Player): boolean {
	let winFlag = false;

	for (const adjFunc of adjacencyFunctions) {
		if (winFlag == true) {
			break;
		}

		winFlag = winFlag || recursiveCheck(coord, adjFunc, player.mark);
	}

	return winFlag;
}

function updateGame(gridSquare: Element) {
	console.log("UPDATING GAME");
	const cellState = gameState[gridSquare.id];

	if (cellState.mark == null) {
		// grabs the correct player object based on the turn
		const player = players[playerTurn];
		addMark(gridSquare, player.mark);
		cellState.mark = player.mark;

		const coord = idToCoord(gridSquare.id);
		const win = checkWin(coord, player);

		// flip flops between 0 and 1
		playerTurn = (playerTurn + 1) % 2;

		if (win) {
			alert("WINNER WINNER, CHICKEN DINNER!");
			gameState = {};
			removeChildren(gameGrid);
			generateGridCells(gameGrid);
		}
	}
}

// ## add event listener to check for player clicks

gameGrid.addEventListener("click", (event) => {
	const target = event.target as Element;
	if (target.matches(".grid-element")) {
		updateGame(target);
	}
});
