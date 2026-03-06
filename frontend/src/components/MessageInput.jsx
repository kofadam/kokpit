import { useState, useRef } from "react";

export default function MessageInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
  }

  return (
    <div className="input-bar">
      <span className="input-prompt">▶</span>
      <textarea
        ref={textareaRef}
        className="input-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Create a session first ( + )" : "Type a message… (Enter to send, Shift+Enter for newline)"}
        disabled={disabled}
        rows={1}
      />
      <button
        className={`input-send ${disabled ? "disabled" : ""}`}
        onClick={submit}
        disabled={disabled}
      >
        {disabled ? "●●●" : "SEND"}
      </button>
    </div>
  );
}
