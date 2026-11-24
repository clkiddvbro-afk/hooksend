import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, Check, ChevronDown, CircleAlert, Eraser, Eye, EyeOff, Hash, Link2, LoaderCircle, MessageSquare, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import "./style.css";

function App() {
  const [webhook, setWebhook] = useState("");
  const [showWebhook, setShowWebhook] = useState(false);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("Hooksend");
  const [avatar, setAvatar] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(true);

  const validWebhook = useMemo(() => {
    try {
      const u = new URL(webhook.trim());
      return ["discord.com", "discordapp.com"].includes(u.hostname) &&
        /^\/api\/webhooks\/\d+\/[^/]+\/?$/.test(u.pathname);
    } catch { return false; }
  }, [webhook]);

  async function sendMessage(e) {
    e.preventDefault();
    setStatus(null);
    if (!validWebhook) {
      setStatus({ type: "error", text: "Enter a valid Discord webhook URL." });
      return;
    }
    if (!message.trim()) {
      setStatus({ type: "error", text: "Write a message before sending." });
      return;
    }
    if (message.length > 2000) {
      setStatus({ type: "error", text: "Discord messages can contain up to 2,000 characters." });
      return;
    }
    if (avatar.trim()) {
      try { new URL(avatar.trim()); }
      catch { setStatus({ type: "error", text: "The avatar URL doesn't look valid." }); return; }
    }

    setBusy(true);
    try {
      const response = await fetch(webhook.trim() + (webhook.includes("?") ? "&" : "?") + "wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
          username: username.trim() || undefined,
          avatar_url: avatar.trim() || undefined,
          allowed_mentions: { parse: [] }
        })
      });
      if (!response.ok) {
        let detail = "";
        try {
          const data = await response.json();
          detail = data.message || "";
        } catch {}
        throw new Error(detail || `Discord returned HTTP ${response.status}.`);
      }
      setStatus({ type: "success", text: "Message sent successfully." });
    } catch (err) {
      const isNetwork = err instanceof TypeError;
      setStatus({
        type: "error",
        text: isNetwork
          ? "Couldn't reach Discord. Check the webhook URL and try again."
          : err.message
      });
    } finally {
      setBusy(false);
    }
  }

  function clearForm() {
    setMessage("");
    setStatus(null);
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <a className="brand" href="#"><span className="brand-icon"><Send size={17} /></span> hooksend<span className="brand-dot">.</span></a>
        <div className="top-right"><span className="online-dot" /> WEBHOOK TOOL <span className="version">v1.0</span></div>
      </nav>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={13} /> SIMPLE. FAST. DIRECT.</div>
        <h1>Send a message.<br /><span>Make it heard.</span></h1>
        <p className="subtitle">A clean, no-fuss Discord webhook sender. Compose your message, preview it, and send it straight to your channel.</p>
      </section>

      <section className="workspace">
        <form className="panel composer" onSubmit={sendMessage}>
          <div className="panel-heading">
            <div><div className="step">01 / CONFIGURE</div><h2>Message setup</h2></div>
            <div className="heading-icon"><MessageSquare size={18} /></div>
          </div>

          <label className="field-label" htmlFor="webhook"><span className="label-icon"><Link2 size={14} /></span> WEBHOOK URL <span className="required">REQUIRED</span></label>
          <div className="input-wrap">
            <input id="webhook" type={showWebhook ? "text" : "password"} placeholder="https://discord.com/api/webhooks/..." value={webhook} onChange={e => {setWebhook(e.target.value); setStatus(null);}} autoComplete="off" spellCheck="false" />
            <button className="icon-button" type="button" onClick={() => setShowWebhook(v => !v)} aria-label={showWebhook ? "Hide webhook" : "Show webhook"}>{showWebhook ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
          </div>
          <p className="hint"><ShieldCheck size={13}/> Your webhook URL stays in this browser session. Don't share it.</p>

          <div className="two-fields">
            <div>
              <label className="field-label" htmlFor="username"><span className="label-icon"><UserRound size={14}/></span> BOT DISPLAY NAME</label>
              <input id="username" value={username} onChange={e => setUsername(e.target.value)} maxLength={80} placeholder="Hooksend" />
            </div>
            <div>
              <label className="field-label" htmlFor="avatar">AVATAR IMAGE URL <span className="optional">OPTIONAL</span></label>
              <input id="avatar" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="message-head">
            <label className="field-label" htmlFor="message"><span className="label-icon"><Hash size={14}/></span> YOUR MESSAGE</label>
            <span className={message.length > 1900 ? "counter near" : "counter"}>{message.length}<span> / 2000</span></span>
          </div>
          <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder={"What's happening? Write your message here..."} rows={7} maxLength={2000} />
          <div className="composer-footer">
            <span className="hint">Mentions are disabled by default for safety.</span>
            <button className="clear-button" type="button" onClick={clearForm}><Eraser size={14}/> Clear message</button>
          </div>

          {status && <div className={`status ${status.type}`} role="status">{status.type === "success" ? <Check size={16}/> : <CircleAlert size={16}/>} {status.text}</div>}
          <button className="send-button" type="submit" disabled={busy}>
            {busy ? <><LoaderCircle className="spin" size={17}/> Sending...</> : <><Send size={16}/> Send to Discord <ArrowUpRight size={16}/></>}
          </button>
          <p className="disclaimer">Only send to webhooks you own or have permission to use. Avoid spam or unwanted messages.</p>
        </form>

        <aside className="preview-column">
          <div className="preview-top"><div><div className="step">02 / PREVIEW</div><h2>Live preview</h2></div><button className="preview-toggle" type="button" onClick={() => setPreview(v => !v)}>{preview ? <Eye size={14}/> : <EyeOff size={14}/>} {preview ? "Visible" : "Hidden"}</button></div>
          {preview && <div className="discord-card">
            <div className="discord-label"><span className="discord-mark">◈</span> DISCORD MESSAGE</div>
            <div className="discord-message">
              <div className="avatar">{avatar ? <img src={avatar} alt="" onError={e => e.currentTarget.style.display="none"}/> : <span>{(username.trim()[0] || "H").toUpperCase()}</span>}</div>
              <div className="message-content">
                <div className="author">{username.trim() || "Hooksend"} <span className="bot-tag">APP</span> <time>Just now</time></div>
                <div className="message-text">{message || <span className="placeholder">Your message will appear here...</span>}</div>
              </div>
            </div>
            <div className="preview-foot"><span><span className="tiny-dot"/> Live preview</span><span>{message.length} characters</span></div>
          </div>}
          <div className="tip-card">
            <div className="tip-icon"><ShieldCheck size={17}/></div>
            <div><strong>Quick safety note</strong><p>A webhook URL acts like a password for posting in its channel. Keep it private and regenerate it in Discord if it leaks.</p></div>
          </div>
          <div className="steps-card">
            <div className="step">HOW TO GET A WEBHOOK</div>
            <ol><li>Open your Discord server settings.</li><li>Go to <b>Integrations → Webhooks</b>.</li><li>Create or copy a webhook URL.</li><li>Paste it above and send your message.</li></ol>
          </div>
        </aside>
      </section>
      <footer><span>HOOKSEND <span className="brand-dot">.</span></span><span>Made for your Discord workflow</span></footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);