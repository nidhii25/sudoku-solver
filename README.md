# Sudoku Solver Web Application

A fast full-stack Sudoku solver built for the industrial-training project described in
`it.docx`: a **React** frontend, a **Python FastAPI** backend, and a solver that uses
**bitmask constraints + minimum-remaining-values (MRV)** search instead of the naive
backtracking loop.

## Why it is fast

| Technique | Effect |
| --- | --- |
| Row / column / box bitmasks | A candidate test is one bitwise `OR` + `AND`, no scanning of 27 cells. |
| Minimum-remaining-values (MRV) | Always branch on the empty cell with the fewest candidates, keeping the search tree tiny. |
| Zero-candidate pruning | Immediately backtracks when a cell cannot take any digit. |
| Duplicate-clue detection up front | Invalid puzzles are rejected before any search starts. |
| In-memory CPU-only work | Typical puzzles solve in well under 1 ms; AI Escargot averages ~0.8 ms. |

## Features

- Editable 9×9 grid with keyboard navigation (arrow keys, Backspace/Delete).
- Peer / same-value highlighting and live conflict detection.
- Sample and hard puzzle loaders, clear button, loading state.
- Solved cells are visually distinguished from the original clues.
- Backend validation: shape, integer range, duplicate clues, unsolvable puzzles.
- API reports server-side solve time (`elapsed_ms`).
- Optional single-server production mode (FastAPI serves the built React app).

## Project structure

```
sudoku/
├── backend/
│   ├── main.py           # FastAPI app, validation, /solve endpoint
│   ├── solver.py         # bitmask + MRV solver
│   ├── test_solver.py    # pytest suite (16 tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # SudokuBoard, SudokuCell, Controls, ResultMessage
│   │   ├── services/     # sudokuApi.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── vite.config.js    # /api proxy to localhost:8000
└── README.md
```

## Run locally

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is available at `http://localhost:8000`. Interactive docs:
`http://localhost:8000/docs`.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the FastAPI server, so no CORS
configuration is needed during development.

### 3. Single-server production mode (optional)

```powershell
cd frontend
npm run build
cd ../backend
uvicorn main:app
```

Open `http://localhost:8000` — FastAPI serves the built React app from `frontend/dist`.

To point the frontend at a different API host instead of the `/api` proxy, set
`VITE_API_URL` before building:

```powershell
$env:VITE_API_URL = "https://api.example.com"
npm run build
```

## API

### `POST /solve`

Request:

```json
{
  "board": [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ]
}
```

Success (`200`):

```json
{
  "solved": true,
  "board": [[5, 3, 4, 6, 7, 8, 9, 1, 2], "..."],
  "elapsed_ms": 0.42
}
```

Errors:

| Status | Meaning |
| --- | --- |
| `400` | Wrong number of rows or columns, non-integer or out-of-range cell. |
| `422` | Duplicate clues, or a valid-looking puzzle with no solution. |
| `500` | Solver sanity check failed (should never happen). |

## Tests

```powershell
cd backend
python -m pytest -q
```

The suite covers the sample puzzle, the hard AI Escargot puzzle, input immutability,
malformed dimensions, invalid cell values, conflicting clues, unsolvable puzzles, and
API responses.

## Performance notes

The reported `elapsed_ms` includes validation, solving, and the final correctness
check. On the development machine, the sample puzzle solves in a fraction of a
millisecond and the hard AI Escargot puzzle averages roughly 0.8 ms over 100 runs.
