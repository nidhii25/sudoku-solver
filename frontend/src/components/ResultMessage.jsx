export default function ResultMessage({ message, elapsedMs }) {
  if (!message) {
    return (
      <div className="result result-idle" role="status">
        Ready when you are.
      </div>
    );
  }

  const icons = { success: "✓", error: "!", info: "i" };

  return (
    <div className={`result result-${message.type}`} role="status">
      <span className="result-icon" aria-hidden="true">
        {icons[message.type] || "i"}
      </span>
      <span>
        {message.text}
        {elapsedMs != null && message.type === "success" && (
          <span className="result-time"> Solved in {elapsedMs.toFixed(2)} ms</span>
        )}
      </span>
    </div>
  );
}
