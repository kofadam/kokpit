const BASE = "http://localhost:8000/api";

export async function fetchModels() {
  const r = await fetch(`${BASE}/models`);
  return r.json();
}

export async function fetchSessions() {
  const r = await fetch(`${BASE}/sessions`);
  return r.json();
}

export async function createSession(data = {}) {
  const r = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateSession(id, data) {
  const r = await fetch(`${BASE}/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function deleteSession(id) {
  await fetch(`${BASE}/sessions/${id}`, { method: "DELETE" });
}

export async function fetchMessages(sessionId) {
  const r = await fetch(`${BASE}/sessions/${sessionId}/messages`);
  return r.json();
}

export async function clearMessages(sessionId) {
  await fetch(`${BASE}/sessions/${sessionId}/messages`, { method: "DELETE" });
}

// Returns a ReadableStream for streaming chat responses
export async function sendMessage(sessionId, message) {
  const r = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  return r.body.getReader();
}
