"""FastAPI service for the Sudoku Solver web application."""

from __future__ import annotations

import time
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from solver import InvalidBoardError, is_solved, solve_board, validate_board

app = FastAPI(
    title="Sudoku Solver API",
    description="High-performance 9x9 Sudoku solver using bitmasks and MRV search.",
    version="1.0.0",
)

# Local development origins for the React (Vite) frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class SudokuRequest(BaseModel):
    board: List[List[int]] = Field(
        ...,
        description="9 rows of 9 integers. 0 represents an empty cell.",
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "Sudoku Solver API"}


@app.post("/solve")
def solve(request: SudokuRequest) -> dict:
    started = time.perf_counter()

    try:
        grid = validate_board(request.board)
    except InvalidBoardError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        solved = solve_board(grid)
    except InvalidBoardError as exc:
        # Conflicting clues in the starting grid.
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if solved is None:
        raise HTTPException(status_code=422, detail="The puzzle has no valid solution")
    if not is_solved(solved):
        raise HTTPException(
            status_code=500,
            detail="Solver produced an invalid board; please report this issue",
        )

    elapsed_ms = (time.perf_counter() - started) * 1000
    return {
        "solved": True,
        "board": solved,
        "elapsed_ms": round(elapsed_ms, 3),
    }


# When the React app has been built (frontend/dist), serve it from the same
# origin so the whole project runs with a single command. Otherwise expose a
# small root health response.
_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="frontend")
else:  # pragma: no cover - depends on whether the frontend was built
    @app.get("/")
    def root() -> dict:
        return {"status": "ok", "service": "Sudoku Solver API"}
