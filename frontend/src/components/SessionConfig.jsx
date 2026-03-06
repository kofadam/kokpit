import { useState } from "react";

export default function SessionConfig({ session, models, onUpdate, onClear }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [prompt, setPrompt] = useState(session?.system_prompt || "");

  function handleModelChange(e) {
    onUpdate({ model: e.target.value });
  }

  function savePrompt() {
    onUpdate({ system_prompt: prompt });
    setShowPrompt(false);
  }

  if (!session) return null;

  return (
    <div className="session-config">
      <div className="config-row">
        <span className="config-label">MODEL</span>
        <select
          className="model-select"
          value={session.model}
          onChange={handleModelChange}
        >
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <button
          className="config-btn"
          onClick={() => { setPrompt(session.system_prompt); setShowPrompt(!showPrompt); }}
        >
          {showPrompt ? "✕ close" : "⚙ system prompt"}
        </button>

        <button className="config-btn config-btn-danger" onClick={onClear}>
          ⌫ clear history
        </button>
      </div>

      {showPrompt && (
        <div className="prompt-editor">
          <textarea
            className="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="You are a helpful assistant."
          />
          <button className="btn-save-prompt" onClick={savePrompt}>save</button>
        </div>
      )}
    </div>
  );
}
