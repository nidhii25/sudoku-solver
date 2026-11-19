"""Fast Sudoku solver.

The solver keeps three bitmasks per row, column and 3x3 box. A bitmask makes
the "is this digit allowed here?" test a single bitwise operation, and choosing
the empty cell with the fewest candidates (minimum-remaining-values) keeps the
search tree small. This solves typical puzzles in well under a millisecond and
even the hardest known 9x9 puzzles in a few milliseconds.
"""

from __future__ import annotations

from typing import Optional

SIZE = 9
FULL_MASK = (1 << SIZE) - 1
ALL_DIGITS = tuple(range(1, SIZE + 1))


class InvalidBoardError(ValueError):
    """Raised when the submitted board is malformed or self-contradictory."""


def _box_index(row: int, col: int) -> int:
    return (row // 3) * 3 + col // 3


def validate_board(board: object) -> list[list[int]]:
    """Return a clean 9x9 integer grid or raise :class:`InvalidBoardError`."""

    if not isinstance(board, list) or len(board) != SIZE:
        raise InvalidBoardError("Board must contain exactly 9 rows")

    grid: list[list[int]] = []
    for row_index, row in enumerate(board):
        if not isinstance(row, list) or len(row) != SIZE:
            raise InvalidBoardError(
                f"Row {row_index + 1} must contain exactly 9 values"
            )
        clean_row: list[int] = []
        for col_index, value in enumerate(row):
            if isinstance(value, bool) or not isinstance(value, int):
                raise InvalidBoardError(
                    f"Cell R{row_index + 1}C{col_index + 1} must be an integer"
                )
            if value < 0 or value > 9:
                raise InvalidBoardError(
                    f"Cell R{row_index + 1}C{col_index + 1} must be between 0 and 9"
                )
            clean_row.append(value)
        grid.append(clean_row)
    return grid


def _build_masks(board: list[list[int]]) -> tuple[list[int], list[int], list[int]]:
    row_masks = [0] * SIZE
    col_masks = [0] * SIZE
    box_masks = [0] * SIZE

    for row in range(SIZE):
        for col in range(SIZE):
            value = board[row][col]
            if value == 0:
                continue
            bit = 1 << (value - 1)
            box = _box_index(row, col)
            if row_masks[row] & bit:
                raise InvalidBoardError(
                    f"Duplicate {value} in row {row + 1}"
                )
            if col_masks[col] & bit:
                raise InvalidBoardError(
                    f"Duplicate {value} in column {col + 1}"
                )
            if box_masks[box] & bit:
                raise InvalidBoardError(
                    f"Duplicate {value} in the 3x3 box at row {row // 3 * 3 + 1}, "
                    f"column {col // 3 * 3 + 1}"
                )
            row_masks[row] |= bit
            col_masks[col] |= bit
            box_masks[box] |= bit

    return row_masks, col_masks, box_masks


def _search(
    board: list[list[int]],
    row_masks: list[int],
    col_masks: list[int],
    box_masks: list[int],
) -> bool:
    """Depth-first search with MRV cell selection and bitmask candidates."""

    best_row = -1
    best_col = -1
    best_mask = 0
    best_count = 10

    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] != 0:
                continue
            box = _box_index(row, col)
            mask = FULL_MASK & ~(row_masks[row] | col_masks[col] | box_masks[box])
            count = mask.bit_count()
            if count == 0:
                return False
            if count < best_count:
                best_row, best_col, best_mask, best_count = row, col, mask, count
                if count == 1:
                    break
        else:
            continue
        break

    if best_row == -1:
        return True  # No empty cells left: solved.

    box = _box_index(best_row, best_col)
    while best_mask:
        bit = best_mask & -best_mask
        best_mask ^= bit
        digit = bit.bit_length()

        board[best_row][best_col] = digit
        row_masks[best_row] |= bit
        col_masks[best_col] |= bit
        box_masks[box] |= bit

        if _search(board, row_masks, col_masks, box_masks):
            return True

        board[best_row][best_col] = 0
        row_masks[best_row] &= ~bit
        col_masks[best_col] &= ~bit
        box_masks[box] &= ~bit

    return False


def solve_board(board: list[list[int]]) -> Optional[list[list[int]]]:
    """Solve a validated 9x9 board.

    Returns a new solved grid, or ``None`` when the puzzle has no solution.
    The input board is never modified.
    """

    grid = [row[:] for row in board]
    row_masks, col_masks, box_masks = _build_masks(grid)

    if _search(grid, row_masks, col_masks, box_masks):
        return grid
    return None


def is_solved(board: list[list[int]]) -> bool:
    """Check that a grid is complete and satisfies every Sudoku constraint."""

    try:
        row_masks, col_masks, box_masks = _build_masks(board)
    except InvalidBoardError:
        return False
    complete = FULL_MASK
    return (
        all(mask == complete for mask in row_masks)
        and all(mask == complete for mask in col_masks)
        and all(mask == complete for mask in box_masks)
    )
