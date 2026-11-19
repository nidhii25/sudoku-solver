const API_BASE = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "/api" : "")
).replace(/\/$/, "");

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function postJson(path, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(
      "Could not reach the solver service. Is the backend running?",
      0
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Ignore non-JSON error bodies.
  }

  if (!response.ok) {
    throw new ApiError(formatDetail(data), response.status);
  }
  return data;
}

function formatDetail(data) {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const where = first?.loc?.slice(1).join(".");
    return where ? `${where}: ${first.msg}` : first?.msg || "Invalid request";
  }
  return "Unable to solve the puzzle.";
}

export async function solvePuzzle(board) {
  return postJson("/solve", { board });
}

export { ApiError };
