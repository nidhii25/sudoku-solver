import { memo } from "react";

function SudokuCell({
  row,
  col,
  value,
  disabled,
  conflict,
  isGiven,
  isSolver,
  isSelected,
  isPeer,
  isSameValue,
  onChange,
  onFocus,
}) {
  const classes = ["cell"];
  if (isPeer) classes.push("is-peer");
  if (isSameValue) classes.push("is-same");
  if (isSelected) classes.push("is-selected");
  if (isGiven) classes.push("is-given");
  if (isSolver) classes.push("is-solver");
  if (conflict) classes.push("is-conflict");

  function handleKeyDown(event) {
    const moves = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = moves[event.key];
    if (!move) return;

    event.preventDefault();
    const nextRow = (row + move[0] + 9) % 9;
    const nextCol = (col + move[1] + 9) % 9;
    document.getElementById(`cell-${nextRow}-${nextCol}`)?.focus();
  }

  return (
    <input
      id={`cell-${row}-${col}`}
      className={classes.join(" ")}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={`Row ${row + 1}, column ${col + 1}${value ? `, ${value}` : ", empty"}`}
      value={value === 0 ? "" : String(value)}
      disabled={disabled}
      onFocus={onFocus}
      onKeyDown={handleKeyDown}
      onChange={(event) => {
        const digits = event.target.value.replace(/[^1-9]/g, "");
        onChange(digits ? Number(digits.at(-1)) : 0);
      }}
    />
  );
}

export default memo(SudokuCell);
