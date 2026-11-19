import SudokuCell from "./SudokuCell.jsx";

function boxOf(row, col) {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

export function findConflicts(board) {
  const conflicts = new Set();
  const groups = [
    ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => [r, c])),
    ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => [r, c])),
    ...Array.from({ length: 9 }, (_, b) => {
      const br = Math.floor(b / 3) * 3;
      const bc = (b % 3) * 3;
      return Array.from({ length: 9 }, (_, i) => [
        br + Math.floor(i / 3),
        bc + (i % 3),
      ]);
    }),
  ];

  for (const group of groups) {
    const seen = new Map();
    for (const [r, c] of group) {
      const value = board[r][c];
      if (!value) continue;
      if (seen.has(value)) {
        const [pr, pc] = seen.get(value);
        conflicts.add(`${pr}-${pc}`);
        conflicts.add(`${r}-${c}`);
      } else {
        seen.set(value, [r, c]);
      }
    }
  }
  return conflicts;
}

export default function SudokuBoard({
  board,
  selected,
  solvedCells,
  conflicts,
  disabled,
  onChange,
  onFocus,
}) {
  const selectedValue = selected ? board[selected.row][selected.col] : 0;
  const selectedBox = selected ? boxOf(selected.row, selected.col) : -1;

  return (
    <div
      className="board"
      role="grid"
      aria-label="Sudoku board"
      onKeyDown={(event) => {
        if (event.key === "Backspace" || event.key === "Delete") {
          event.preventDefault();
          if (selected) onChange(selected.row, selected.col, 0);
        }
      }}
    >
      {board.map((row, r) =>
        row.map((value, c) => {
          const key = `${r}-${c}`;
          return (
            <SudokuCell
              key={key}
              row={r}
              col={c}
              value={value}
              disabled={disabled}
              conflict={conflicts.has(key)}
              isGiven={value !== 0 && !solvedCells.has(key)}
              isSolver={solvedCells.has(key)}
              isSelected={selected?.row === r && selected?.col === c}
              isPeer={
                selected != null &&
                !(selected.row === r && selected.col === c) &&
                (selected.row === r ||
                  selected.col === c ||
                  selectedBox === boxOf(r, c))
              }
              isSameValue={
                selectedValue !== 0 &&
                value === selectedValue &&
                !(selected?.row === r && selected?.col === c)
              }
              onChange={(next) => onChange(r, c, next)}
              onFocus={() => onFocus({ row: r, col: c })}
            />
          );
        })
      )}
    </div>
  );
}
