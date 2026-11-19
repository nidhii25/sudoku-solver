"""Tests for the Sudoku solver and API. Run with: pytest -q"""

from __future__ import annotations

import copy

import pytest
from fastapi.testclient import TestClient

from main import app
from solver import InvalidBoardError, is_solved, solve_board, validate_board

SAMPLE = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
]

EXPECTED = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
]

# "AI Escargot" - a famously difficult puzzle.
HARD = [
    [1, 0, 0, 0, 0, 7, 0, 9, 0],
    [0, 3, 0, 0, 2, 0, 0, 0, 8],
    [0, 0, 9, 6, 0, 0, 5, 0, 0],
    [0, 0, 5, 3, 0, 0, 9, 0, 0],
    [0, 1, 0, 0, 8, 0, 0, 0, 2],
    [6, 0, 0, 0, 0, 4, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 4, 0, 0, 0, 0, 0, 0, 7],
    [0, 0, 7, 0, 0, 0, 3, 0, 0],
]

# Conflicting-clue-free board that still has no completion (the 5 in the
# top-left corner of SAMPLE is replaced by a 1).
UNSOLVABLE = [
    [1, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
]

client = TestClient(app)


def test_solves_sample_puzzle():
    solved = solve_board(SAMPLE)
    assert solved == EXPECTED


def test_does_not_mutate_input():
    original = copy.deepcopy(SAMPLE)
    solve_board(SAMPLE)
    assert SAMPLE == original


def test_solves_hard_puzzle():
    solved = solve_board(HARD)
    assert solved is not None
    assert is_solved(solved)


def test_reports_unsolvable_puzzle():
    assert solve_board(UNSOLVABLE) is None


def test_rejects_bad_dimensions():
    with pytest.raises(InvalidBoardError):
        validate_board([[0] * 9 for _ in range(8)])
    with pytest.raises(InvalidBoardError):
        validate_board([[0] * 8 for _ in range(9)])


@pytest.mark.parametrize("value", [-1, 10, "5", 3.5, True])
def test_rejects_bad_cell_values(value):
    board = copy.deepcopy(SAMPLE)
    board[0][2] = value
    with pytest.raises(InvalidBoardError):
        validate_board(board)


def test_rejects_conflicting_clues():
    board = copy.deepcopy(SAMPLE)
    board[0][0] = 5
    board[0][1] = 5
    with pytest.raises(InvalidBoardError, match="row 1"):
        solve_board(board)


def test_api_solve_success():
    response = client.post("/solve", json={"board": SAMPLE})
    assert response.status_code == 200
    body = response.json()
    assert body["solved"] is True
    assert body["board"] == EXPECTED
    assert body["elapsed_ms"] >= 0


def test_api_rejects_bad_shape():
    response = client.post("/solve", json={"board": [[0] * 9] * 8})
    assert response.status_code == 400


def test_api_rejects_conflicting_clues():
    board = copy.deepcopy(SAMPLE)
    board[0][1] = 5
    response = client.post("/solve", json={"board": board})
    assert response.status_code == 422


def test_api_rejects_unsolvable():
    response = client.post("/solve", json={"board": UNSOLVABLE})
    assert response.status_code == 422
    assert "no valid solution" in response.json()["detail"].lower()


def test_api_rejects_missing_board():
    response = client.post("/solve", json={})
    assert response.status_code == 422
