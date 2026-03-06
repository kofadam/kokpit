import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import SessionConfig from "./components/SessionConfig";
import {
  fetchModels, fetchSessions, createSession, updateSession,
  deleteSession, fetchMessages, clearMessages, sendMessage
} from "./api";
import "./App.css";

export default function App() {
  const [models, setModels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);

  // Load models + sessions on mount
  useEffect(() => {
    fetchModels().then((d) => setModels(d.models || []));
    loadSessions();
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (activeId) {
      const s = sessions.find((s) => s.id === activeId);
      setActiveSession(s || null);
      fetchMessages(activeId).then(setMessages);
    }
  }, [activeId, sessions]);

  async function loadSessions() {
    const data = await fetchSessions();
    setSessions(data);
    if (data.length > 0) {
      setActiveId(data[0].id);
    } else {
      // auto-create first session
      const model = (await fetchModels()).models?.[0] || "llama3.2";
      const s = await createSession({ title: "New Chat", model, system_prompt: "You are a helpful assistant." });
      setSessions([s]);
      setActiveId(s.id);
    }
  }

  async function handleNew() {
    const model = models[0] || "llama3.2";
    const s = await createSession({ title: "New Chat", model, system_prompt: "You are a helpful assistant." });
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setMessages([]);
  }

  async function handleDelete(id) {
    await deleteSession(id);
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeId === id) {
      setActiveId(updated[0]?.id || null);
      setMessages([]);
    }
  }

  async function handleRename(id, title) {
    const updated = await updateSession(id, { title });
    setSessions((prev) => prev.map((s) => s.id === id ? updated : s));
  }

  async function handleUpdate(data) {
    if (!activeId) return;
    const updated = await updateSession(activeId, data);
    setSessions((prev) => prev.map((s) => s.id === activeId ? updated : s));
    setActiveSession(updated);
  }

  async function handleClear() {
    if (!activeId) return;
    await clearMessages(activeId);
    setMessages([]);
  }

  async function handleSend(text) {
    if (!activeId || loading) return;
    setLoading(true);
    setStreaming("");

    // optimistically add user message
    const tempUserMsg = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const reader = await sendMessage(activeId, text);
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreaming(full);
      }

      // replace streaming with final saved messages
      const updated = await fetchMessages(activeId);
      setMessages(updated);
      setStreaming("");
    } catch (e) {
      console.error(e);
      setStreaming("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
        onDelete={handleDelete}
        onRename={handleRename}
      />
      <div className="main">
        <SessionConfig
          session={activeSession}
          models={models}
          onUpdate={handleUpdate}
          onClear={handleClear}
        />
        <ChatWindow messages={messages} streaming={streaming} />
        <MessageInput onSend={handleSend} disabled={loading || !activeId} />
      </div>
    </div>
  );
}
