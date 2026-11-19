import { useMemo, useState } from "react";
import SudokuBoard, { findConflicts } from "./components/SudokuBoard.jsx";
import Controls from "./components/Controls.jsx";
import ResultMessage from "./components/ResultMessage.jsx";
import { solvePuzzle } from "./services/sudokuApi.js";

const SAMPLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const HARD = [
  [1, 0, 0, 0, 0, 7, 0, 9, 0],
  [0, 3, 0, 0, 2, 0, 0, 0, 8],
  [0, 0, 9, 6, 0, 0, 5, 0, 0],
  [0, 0, 5, 3, 0, 0, 9, 0, 0],
  [0, 1, 0, 0, 8, 0, 0, 0, 2],
  [6, 0, 0, 0, 0, 4, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 4, 0, 0, 0, 0, 0, 0, 7],
  [0, 0, 7, 0, 0, 0, 3, 0, 0],
];

const emptyBoard = () => Array.from({ length: 9 }, () => Array(9).fill(0));
const cloneBoard = (board) => board.map((row) => [...row]);

export default function App() {
  const [board, setBoard] = useState(emptyBoard);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(null);
  const [solvedCells, setSolvedCells] = useState(() => new Set());

  const conflicts = useMemo(() => findConflicts(board), [board]);
  const filled = board.flat().filter(Boolean).length;

  function handleCellChange(row, col, value) {
    setBoard((current) => {
      if (current[row][col] === value) return current;
      const next = cloneBoard(current);
      next[row][col] = value;
      return next;
    });
    setSolvedCells((current) => {
      if (!current.has(`${row}-${col}`)) return current;
      const next = new Set(current);
      next.delete(`${row}-${col}`);
      return next;
    });
    setElapsedMs(null);
    setMessage(null);
  }

  function loadPuzzle(puzzle, label) {
    setBoard(cloneBoard(puzzle));
    setSolvedCells(new Set());
    setElapsedMs(null);
    setSelected(null);
    setMessage({ type: "info", text: `${label} loaded. Press “Solve puzzle” to continue.` });
  }

  function handleClear() {
    setBoard(emptyBoard());
    setSolvedCells(new Set());
    setElapsedMs(null);
    setSelected(null);
    setMessage(null);
  }

  async function handleSolve() {
    if (loading) return;
    if (conflicts.size > 0) {
      setMessage({
        type: "error",
        text: "The current grid contains conflicting clues. Fix the highlighted cells first.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    setElapsedMs(null);

    try {
      const payload = cloneBoard(board);
      const data = await solvePuzzle(payload);
      const filledCells = new Set();
      payload.forEach((row, r) =>
        row.forEach((value, c) => {
          if (value === 0) filledCells.add(`${r}-${c}`);
        })
      );

      setBoard(data.board);
      setSolvedCells(filledCells);
      setElapsedMs(data.elapsed_ms ?? null);
      setMessage({ type: "success", text: "Puzzle solved." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unable to solve the puzzle.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">React · FastAPI</p>
          <h1>Sudoku Solver</h1>
          <p className="subtitle">
            A fast 9×9 solver using bitmask constraints and minimum-remaining-values search.
          </p>
        </div>
        <span className="badge">Bitmask + MRV</span>
      </header>

      <main className="layout">
        <section className="board-card" aria-label="Puzzle">
          <SudokuBoard
            board={board}
            selected={selected}
            solvedCells={solvedCells}
            conflicts={conflicts}
            disabled={loading}
            onChange={handleCellChange}
            onFocus={setSelected}
          />
        </section>

        <aside className="panel">
          <ResultMessage message={message} elapsedMs={elapsedMs} />
          <Controls
            onSolve={handleSolve}
            onClear={handleClear}
            onSample={() => loadPuzzle(SAMPLE, "Sample puzzle")}
            onHard={() => loadPuzzle(HARD, "Hard puzzle")}
            loading={loading}
            canSolve={filled > 0}
          />

          <dl className="stats">
            <div>
              <dt>Filled cells</dt>
              <dd>{filled} / 81</dd>
            </div>
            <div>
              <dt>Empty cells</dt>
              <dd>{81 - filled}</dd>
            </div>
            <div>
              <dt>Conflicts</dt>
              <dd className={conflicts.size ? "stat-bad" : "stat-good"}>
                {conflicts.size ? `${conflicts.size} cells` : "None"}
              </dd>
            </div>
          </dl>

          <div className="legend">
            <span><i className="swatch swatch-given" /> Clue / entry</span>
            <span><i className="swatch swatch-solved" /> Solver output</span>
            <span><i className="swatch swatch-conflict" /> Conflict</span>
          </div>
        </aside>
      </main>

      <footer className="footer">
        <span>POST /solve</span>
        <span aria-hidden="true">·</span>
        <span>Zero represents an empty cell</span>
        <span aria-hidden="true">·</span>
        <span>Board is validated on the backend</span>
      </footer>
    </div>
  );
}
