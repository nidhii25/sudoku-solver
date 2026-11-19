export default function Controls({
  onSolve,
  onClear,
  onSample,
  onHard,
  loading,
  canSolve,
}) {
  return (
    <div className="controls">
      <button
        type="button"
        className="btn btn-primary"
        onClick={onSolve}
        disabled={loading || !canSolve}
      >
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" /> Solving…
          </>
        ) : (
          <>Solve puzzle</>
        )}
      </button>
      <div className="controls-row">
        <button type="button" className="btn btn-ghost" onClick={onSample} disabled={loading}>
          Sample
        </button>
        <button type="button" className="btn btn-ghost" onClick={onHard} disabled={loading}>
          Hard
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClear} disabled={loading}>
          Clear
        </button>
      </div>
      <p className="hint">
        Type 1–9 in a cell. Use arrow keys to move, Backspace to erase.
      </p>
    </div>
  );
}
