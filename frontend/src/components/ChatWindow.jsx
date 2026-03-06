import { useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";

// Configure marked with highlight.js
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
});

function copyCode(btn) {
  const code = btn.parentElement.querySelector("code").innerText;
  navigator.clipboard.writeText(code);
  btn.textContent = "✓ copied";
  setTimeout(() => (btn.textContent = "copy"), 1500);
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const html = isUser ? null : marked.parse(msg.content);

  useEffect(() => {
    if (!isUser) {
      document.querySelectorAll("pre code").forEach((block) => {
        if (!block.dataset.highlighted) {
          hljs.highlightElement(block);
          block.dataset.highlighted = "yes";
        }
      });
      // inject copy buttons
      document.querySelectorAll("pre").forEach((pre) => {
        if (!pre.querySelector(".copy-btn")) {
          const btn = document.createElement("button");
          btn.className = "copy-btn";
          btn.textContent = "copy";
          btn.onclick = () => copyCode(btn);
          pre.appendChild(btn);
        }
      });
    }
  });

  return (
    <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      <div className="message-role">{isUser ? "YOU" : "AI"}</div>
      {isUser ? (
        <div className="message-content message-plain">{msg.content}</div>
      ) : (
        <div
          className="message-content message-md"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

export default function ChatWindow({ messages, streaming }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  if (messages.length === 0 && !streaming) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-icon">⬡</div>
        <p>Send a message to begin.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {messages.map((m) => (
        <MessageBubble key={m.id} msg={m} />
      ))}
      {streaming && (
        <div className="message message-assistant">
          <div className="message-role">AI</div>
          <div
            className="message-content message-md"
            dangerouslySetInnerHTML={{ __html: marked.parse(streaming) }}
          />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
