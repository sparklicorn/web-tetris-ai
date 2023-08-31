import Coord from './Coord';
import Move from './Move';
import Piece from './Piece';
import Position from './Position';
import { SHAPES, Shape } from './Shape';
import ShapeQueue from './ShapeQueue';

export default class TetrisState {
  static readonly DEFAULT_NUM_ROWS = 20;
	static readonly DEFAULT_NUM_COLS = 10;
	static readonly DEFAULT_ENTRY_COLUMN = TetrisState.calcEntryColumn(TetrisState.DEFAULT_NUM_COLS);
  static readonly DEFAULT_ENTRY_COORD = new Coord(1, TetrisState.DEFAULT_ENTRY_COLUMN);
  static readonly DEFAULT_LINES_PER_LEVEL = 10;

  // TODO default points per line cleared

  /**
	 * Calculates the column where pieces appear, which is the center column,
	 * or just left of center if there are an even number of columns.
	 *
	 * @param cols Number of columns on the board.
	 */
	static calcEntryColumn(cols : number) {
		return (cols / 2) - ((cols % 2 == 0) ? 1 : 0);
	}

  readonly rows: number;
  readonly cols: number;
  readonly entryCoord: Coord;

  private _board: number[];
  private _isGameOver: boolean;
  private _isPaused: boolean;
  private _isClearingLines: boolean;
  private _hasStarted: boolean;
  private _level: number;
  private _score: number;
  private _linesCleared: number;
  private _numPiecesDropped: number;
  private _linesPerLevel: number | ((level: number) => number);
  private _linesUntilNextLevel: number;
  private _dist: number[];
  private _nextShapes: ShapeQueue;
  private _piece: Piece;

  // TODO private pointsPerLineClear: number[] | ((linesCleared: number, level: number) => number);
  // TODO create function to calculate points per line cleared based property

	/**
	 * Creates a new TetrisState with the given number of rows and columns.
	 */
	constructor(
    rows: number = TetrisState.DEFAULT_NUM_ROWS,
    cols: number = TetrisState.DEFAULT_NUM_COLS,
    entryCoord: Coord = TetrisState.DEFAULT_ENTRY_COORD,
    linesPerLevel: number | ((level: number) => number) = TetrisState.DEFAULT_LINES_PER_LEVEL
  ) {
		// Tetris.ROWS_VALIDATOR.validate(rows);
		// Tetris.COLS_VALIDATOR.validate(cols);
    // TODO validate inputs

		this.rows = rows;
		this.cols = cols;
		this.entryCoord = entryCoord;

		this._board = Array(rows * cols).fill(0);
		this._isGameOver = false;
		this._isPaused = false;
		this._isClearingLines = false;
		this._hasStarted = false;
		this._level = 0;
		this._score = 0;
		this._linesCleared = 0;
		this._numPiecesDropped = 0;
    this._linesPerLevel = linesPerLevel;
		this._linesUntilNextLevel = 0;
		this._dist = Array(SHAPES.length).fill(0);
		this._nextShapes = new ShapeQueue();
		this._piece = new Piece(this.entryCoord, this._nextShapes.poll());
	}

	/**
	 * Creates a new TetrisState with the same values as the given TetrisState.
	 */
	static copy(other: TetrisState): TetrisState {
    const copy = new TetrisState(
      other.rows,
      other.cols,
      other.entryCoord,
      other._linesPerLevel
    );

		copy._board = other._board.slice();
		copy._isGameOver = other.isGameOver;
		copy._isPaused = other.isPaused;
		copy._isClearingLines = other.isClearingLines;
		copy._hasStarted = other.hasStarted;
		copy._level = other.level;
		copy._score = other.score;
		copy._linesCleared = other.linesCleared;
		copy._numPiecesDropped = other.numPiecesDropped;
		copy._linesUntilNextLevel = other.linesUntilNextLevel;
		copy._dist = other._dist.slice();
		copy._nextShapes = ShapeQueue.copy(other._nextShapes);
		copy._piece = Piece.copy(other._piece);

    return copy;
	}

  /**
   * Returns a copy of the board.
   */
  get board(): number[] { return this._board.slice(); }
  get isGameOver(): boolean { return this._isGameOver; }
  get isPaused(): boolean { return this._isPaused; }
  get isClearingLines(): boolean { return this._isClearingLines; }
  get hasStarted(): boolean { return this._hasStarted; }
  get level(): number { return this._level; }
  get score(): number { return this._score; }
  get linesCleared(): number { return this._linesCleared; }
  get numPiecesDropped(): number { return this._numPiecesDropped; }
  get linesUntilNextLevel(): number { return this._linesUntilNextLevel; }
  get dist(): number[] { return this._dist.slice(); }
  get nextShapes(): ShapeQueue { return ShapeQueue.copy(this._nextShapes); }

  /**
   * Returns the current piece.
   */
  get piece(): Piece { return this._piece; }

  set linesCleared(linesCleared: number) { this._linesCleared = linesCleared; }
  set score(score: number) { this._score = score; }
  set isClearingLines(isClearingLines: boolean) { this._isClearingLines = isClearingLines; }
  set linesUntilNextLevel(linesUntilNextLevel: number) { this._linesUntilNextLevel = linesUntilNextLevel; }
  set level(level: number) { this._level = level; }
  set hasStarted(hasStarted: boolean) { this._hasStarted = hasStarted; }
  set isGameOver(isGameOver: boolean) { this._isGameOver = isGameOver; }
  set isPaused(isPaused: boolean) { this._isPaused = isPaused; }

  linesPerLevel(): number {
    return (typeof this._linesPerLevel === 'function') ?
      this._linesPerLevel(this.level) :
      this._linesPerLevel;
  }

	/**
	 * Peeks the given number of shapes in the queue.
	 *
	 * @param numShapes Number of shapes to peek.
	 * @return An array of the next shapes in the queue.
	 */
	getNextShapes(numShapes: number): Shape[] {
		return this._nextShapes.peekNext(numShapes);
	}

	/**
	 * Sets the value of the cell at the given location.
	 *
	 * @param location The location of the cell to set.
	 * @param value The value to set the cell to.
	 */
	setCell(location: {row: number, col: number}, value: number): void {
    this._board[location.row * this.cols + location.col] = value;
	}

	/**
	 * Gets the value of the cell at the given location.
	 *
	 * @param location The location of the cell to get.
	 * @return The value of the cell at the given location.
	 */
	getCell(location: { row: number, col: number }): number {
    return this._board[location.row * this.cols + location.col];
	}

	/**
	 * Checks whether the specified cell is empty.
	 */
	isCellEmpty(location: { row: number, col: number }): boolean {
		return this.getCell(location) === 0;
	}

	/**
	 * Checks whether the given coordinates are within the bounds of the board.
	 *
	 * @param row The row to check.
	 * @param col The column to check.
	 * @return True if the coordinates are valid; false otherwise.
	 */
	validateCoord(location: { row: number, col: number }): boolean {
		return (
			location.row >= 0 &&
			location.row < this.rows &&
			location.col >= 0 &&
			location.col < this.cols
		);
	}

	/**
	 * Checks whether the current piece is within the bounds of the board.
	 *
	 * @return True if the piece is in bounds; false otherwise.
	 */
	pieceInBounds() {
    return this._piece.blockCoords.every(this.validateCoord);
	}

	/**
	 * Checks whether the given position for the current shape is valid,
	 * i.e. the piece blocks are all within the bounds of the board, there
	 * are no blocks in the way, and the piece is not wrapping around the board.
	 *
	 * @param pos The position to check.
	 * @return True if the position is valid; false otherwise.
	 */
	isPositionValid(position: Position): boolean {
		const newBlockCoords = this.getShapeCoordsAtPosition(position);
		let minCol = newBlockCoords[0].col;
		let maxCol = newBlockCoords[0].col;

		for (let c of newBlockCoords) {
			minCol = Math.min(minCol, c.col);
			maxCol = Math.max(maxCol, c.col);

			if (
				!this.validateCoord(c) ||
				!this.isCellEmpty(c) ||

				// A large gap between cell columns means the piece wrapped around the board.
				(maxCol - minCol) > 4
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * ! it's more like validation of the resulting location and does not imply that a path exists to it unless the
	 * ! magnitude of the move is (exclusively) one unit of rotation or of offset.
	 * ! however you wanna fit that into a name... is great
	 * Checks that the given move is in bounds of the board, that there are no blocks occupying
	 * the spaces, and that the resulting position does not end up higher on the board.
	 *
	 * @param move
	 * @return True if the active piece can move to the specified position; otherwise false.
	 */
	canPieceMove(move: Move): boolean {
		return (
			!this.isGameOver &&
			this.piece.isActive &&
			!this.isPaused &&
			move.row >= 0 &&
			this.isPositionValid(this.piece.position.add(move))
		);
	}

	/**
	 * Checks whether the current piece can move with the given rotation.
	 * If the piece cannot be rotated in place, it will check whether it can be shifted first.
	 *
	 * If shifting doesn't allow rotation, then this returns an adjusted move of STAND, indicating
	 * the rotation is not possible.
	 *
	 * @param move CLOCKWISE or COUNTERCLOCKWISE
	 * @return A Move representing the rotation, it may be adjusted to include a left
	 * or right shift that is required to accomodate the rotation.
	 * If the rotation is not possible, returns Move.STAND.
	 */
	validateRotation(move: Move): Move {
		if (!(move.equals(Move.CLOCKWISE) || move.equals(Move.COUNTERCLOCKWISE))) {
			return Move.copy(Move.STAND);
		}

		if (this.canPieceMove(move)) {
			return Move.copy(move);
		}

		// Attempt to "kick off" an edge or block if rotating too close.
		const kickLeft = Move.copy(move);
		const kickRight = Move.copy(move);
		for (let colOffset = 1; colOffset < 3; colOffset++) {
			if (this.canPieceMove(kickLeft.add(Move.LEFT))) {
				return kickLeft;
			}

			if (this.canPieceMove(kickRight.add(Move.RIGHT))) {
				return kickRight;
			}
		}

		return Move.copy(Move.STAND);
	}

	/**
	 * Calculates the block coordinates for the active shape at the given position.
	 *
	 * @param pos Position of the shape to calculate the block coordinates for.
	 * @return An array of coordinates for the blocks of the shape at the given position.
	 */
	getShapeCoordsAtPosition(position: Position): Coord[] {
		return new Piece(position.location, this.piece.shape).blockCoords;
	}

	/**
	 * Determines whether the given row is full.
	 *
	 * @param row Index of the row to check.
	 * @return True if the row is full; false otherwise.
	 */
	protected isRowFull(row: number): boolean {
		for (let col = 0; col < this.cols; col++) {
			if (this.isCellEmpty({ row, col })) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets a list of indices for rows that are full, in ascending order.
	 */
	getFullRows(): number[] {
		const lines: number[] = [];

		for (let row = 0; row < this.rows; row++) {
			if (this.isRowFull(row)) {
				lines.push(row);
			}
		}

		return lines;
	}

	/**
	 * Determines if the piece is sharing the same cell as any other block.
	 *
	 * @return True if the piece is overlapping with other blocks; otherwise false.
	 */
	pieceOverlapsBlocks(): boolean {
		return this.piece.isActive && this.piece.intersects(this);
	}

	/**
	 * Places the piece on the board at its current position.
	 */
	placePiece(): void {
		if (this.piece.isActive) {
      this.piece.blockCoords.forEach((coord: Coord) => this.setCell(coord, this.piece.shape.value));
			this.piece.disable();
			this._numPiecesDropped++;
		}
	}

	/**
	 * Resets the piece to the top of the board with the next shape from the queue.
	 */
	resetPiece(): void {
		this.piece.reset(this.entryCoord, this._nextShapes.poll());
	}

	/**
	 * Fast-forwards the shape queue so that the given shape is next in the queue.
	 *
	 * @param shape The Shape that will be next in the queue.
	 */
	setNextShape(shape: Shape): void {
		// Fast-forward so that the given shape is next in the queue.
		while (this._nextShapes.peek().value != shape.value) {
			this._nextShapes.poll();
		}
	}

	/**
	 * Returns whether the game has started and is in progress.
	 */
	isRunning(): boolean {
		return this.hasStarted && !this.isGameOver;
	}
}