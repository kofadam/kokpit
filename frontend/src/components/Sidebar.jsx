import { useState } from "react";
import { deleteSession, updateSession } from "../api";

export default function Sidebar({ sessions, activeId, onSelect, onNew, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(e, session) {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  }

  async function commitEdit(id) {
    if (editValue.trim()) await onRename(id, editValue.trim());
    setEditingId(null);
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (confirm("Delete this session?")) onDelete(id);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">⬡ KOKPIT</span>
        <button className="btn-new" onClick={onNew}>+</button>
      </div>

      <div className="sidebar-label">// SESSIONS</div>

      <div className="session-list">
        {sessions.length === 0 && (
          <div className="session-empty">No sessions yet.<br />Hit + to start.</div>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`session-item ${s.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            {editingId === s.id ? (
              <input
                className="session-rename"
                value={editValue}
                autoFocus
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(s.id)}
                onKeyDown={(e) => e.key === "Enter" && commitEdit(s.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="session-title">{s.title}</span>
                <span className="session-model">{s.model.split(":")[0]}</span>
                <div className="session-actions">
                  <button onClick={(e) => startEdit(e, s)} title="Rename">✎</button>
                  <button onClick={(e) => handleDelete(e, s.id)} title="Delete">✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
