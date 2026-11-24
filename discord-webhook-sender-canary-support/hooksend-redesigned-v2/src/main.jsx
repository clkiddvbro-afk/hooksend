import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, Eye, EyeOff, Hash, Image as ImageIcon, Link2, LoaderCircle, MessageSquare, Send, Settings2, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import "./style.css";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isWebhookUrl(value) {
  try {
    const url = new URL(value.trim());
    const allowedHosts = ["discord.com", "discordapp.com", "canary.discord.com"];
    return allowedHosts.includes(url.hostname) && /^\/api\/webhooks\/\d+\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

function App() {
  const [webhook, setWebhook] = useState("");
  const [reveal, setReveal] = useState(false);
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [delay, setDelay] = useState("5");
  const [repeatActive, setRepeatActive] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState(null);
  const [showOptions, setShowOptions] = useState(true);
  const [preview, setPreview] = useState(true);
  const stopRef = useRef(false);
  const activeRef = useRef(false);

  useEffect(() => () => { stopRef.current = true; }, []);

  const validWebhook = isWebhookUrl(webhook);
  const canSend = validWebhook && content.trim().length > 0;

  async function postMessage() {
    const endpoint = webhook.trim() + (webhook.includes("?") ? "&" : "?") + "wait=true";
    const payload = {
      content: content.trim(),
      allowed_mentions: { parse: [] }
    };
    if (username.trim()) payload.username = username.trim();
    if (avatar.trim()) payload.avatar_url = avatar.trim();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let reason = `Discord returned ${response.status}.`;
      try {
        const data = await response.json();
        if (data.message) reason = data.message;
      } catch {}
      throw new Error(reason);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    setStatus(null);
    if (!validWebhook) return setStatus({ kind: "error", text: "That doesn't look like a Discord webhook URL." });
    if (!content.trim()) return setStatus({ kind: "error", text: "Write a message first." });
    try {
      setStatus({ kind: "working", text: "Sending message…" });
      await postMessage();
      setStatus({ kind: "success", text: "Message sent." });
    } catch (error) {
      setStatus({ kind: "error", text: error.message || "Couldn't send the message." });
    }
  }

  async function startRepeat() {
    setStatus(null);
    const seconds = Number(delay);
    if (!validWebhook) return setStatus({ kind: "error", text: "Add a valid webhook URL first." });
    if (!content.trim()) return setStatus({ kind: "error", text: "Write a message first." });
    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 60) {
      return setStatus({ kind: "error", text: "Choose a delay from 5 to 60 seconds." });
    }

    stopRef.current = false;
    activeRef.current = true;
    setRepeatActive(true);
    setRemaining(5);
    let sent = 0;
    let failure = null;

    for (let index = 0; index < 5; index += 1) {
      if (stopRef.current) break;
      try {
        await postMessage();
        sent += 1;
        setRemaining(5 - sent);
      } catch (error) {
        failure = error.message || "Sending failed.";
        break;
      }
      if (index < 4) {
        // Wait in short increments so Stop responds promptly.
        const until = Date.now() + seconds * 1000;
        while (Date.now() < until && !stopRef.current) {
          await sleep(Math.min(200, until - Date.now()));
        }
      }
    }

    activeRef.current = false;
    setRepeatActive(false);
    setRemaining(0);
    if (failure) setStatus({ kind: "error", text: `Stopped after ${sent} message(s): ${failure}` });
    else if (stopRef.current) setStatus({ kind: "success", text: `Stopped. Sent ${sent} of 5 test messages.` });
    else setStatus({ kind: "success", text: "Test run complete. Sent 5 messages." });
  }

  function stopRepeat() {
    stopRef.current = true;
  }

  function clearWebhook() {
    if (activeRef.current) stopRepeat();
    setWebhook("");
    setReveal(false);
    setStatus({ kind: "neutral", text: "Webhook URL cleared from this page." });
  }

  function clearMessage() {
    setContent("");
    setStatus(null);
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="#" aria-label="Hooksend home"><span className="mark">h</span><span>hooksend</span></a>
        <div className="mast-meta"><span className="status-led" /> DISCORD WEBHOOK WORKBENCH <span className="edition">PERSONAL TOOL</span></div>
      </header>

      <main>
        <section className="intro">
          <div className="intro-copy">
            <p className="kicker">A SMALL TOOL FOR A SPECIFIC JOB</p>
            <h1>Send it where<br/><em>it needs to go.</em></h1>
            <p className="intro-text">Put together a webhook message, check how it reads, then send it. No account, no extra noise.</p>
          </div>
          <div className="intro-note"><span className="note-number">01</span><p>Works with Discord webhook URLs, including <b>Canary</b> endpoints.</p></div>
        </section>

        <div className="section-rule"><span>MESSAGE COMPOSER</span><span className="rule-line" /><span className="mono">01 — 02</span></div>

        <div className="layout">
          <form className="editor" onSubmit={handleSend}>
            <section className="form-section">
              <div className="section-heading"><div><span className="overline">DESTINATION</span><h2>Where are we sending?</h2></div><Link2 size={18}/></div>
              <label className="label" htmlFor="webhook">WEBHOOK URL <span className="label-side">PRIVATE</span></label>
              <div className="url-row">
                <div className="url-field"><input id="webhook" type={reveal ? "text" : "password"} value={webhook} onChange={e => { setWebhook(e.target.value); setStatus(null); }} placeholder="Paste your Discord webhook URL" autoComplete="off" spellCheck="false"/><button type="button" className="reveal" onClick={() => setReveal(v => !v)} aria-label={reveal ? "Hide URL" : "Show URL"}>{reveal ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
                <button type="button" className="remove-url" onClick={clearWebhook} disabled={!webhook}><Trash2 size={15}/><span>Clear</span></button>
              </div>
              <p className="field-help"><ShieldCheck size={14}/> Treat this URL like a password. Clearing it here does not delete the Discord webhook.</p>
            </section>

            <section className="form-section">
              <div className="section-heading"><div><span className="overline">MESSAGE</span><h2>What should it say?</h2></div><MessageSquare size={18}/></div>
              <div className="identity-grid">
                <div><label className="label" htmlFor="username">DISPLAY NAME <span className="label-side">OPTIONAL</span></label><input id="username" value={username} onChange={e => setUsername(e.target.value)} maxLength={80} placeholder="Webhook name"/></div>
                <div><label className="label" htmlFor="avatar">AVATAR URL <span className="label-side">OPTIONAL</span></label><input id="avatar" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…"/></div>
              </div>
              <div className="message-label-row"><label className="label" htmlFor="message">MESSAGE CONTENT</label><span className="count">{content.length}<i> / 2000</i></span></div>
              <textarea id="message" value={content} onChange={e => setContent(e.target.value)} maxLength={2000} rows={7} placeholder="Write something worth sending…"/>
              <div className="under-text"><span>Plain text message · up to 2,000 characters</span><button type="button" className="text-action" onClick={clearMessage}>Clear text</button></div>
            </section>

            <section className="send-area">
              {status && <div className={`notice ${status.kind}`} role="status">{status.kind === "success" ? <Check size={15}/> : status.kind === "working" ? <LoaderCircle className="spin" size={15}/> : <CircleHelp size={15}/>}<span>{status.text}</span></div>}
              <button className="primary-send" type="submit" disabled={!canSend}><Send size={16}/> Send message <ArrowUpRight size={16}/></button>
              <p className="send-foot">Only send messages to webhooks you own or have permission to use.</p>
            </section>

            <section className="repeat-panel">
              <div className="repeat-head"><div><span className="overline">CONTROLLED TEST</span><h3>Repeat a test message</h3></div><span className="cap">UP TO 5 SENDS</span></div>
              <p className="repeat-description">Useful for checking a notification or testing a channel. This run is capped to five sends.</p>
              <div className="repeat-controls"><label className="delay-field"><span>WAIT BETWEEN SENDS</span><div><input type="number" min="5" max="60" step="1" value={delay} onChange={e => setDelay(e.target.value)} disabled={repeatActive}/><b>seconds</b></div></label>
                {!repeatActive ? <button className="repeat-start" type="button" onClick={startRepeat} disabled={!canSend}><Clock3 size={15}/> Start test</button> : <button className="repeat-stop" type="button" onClick={stopRepeat}><span/> Stop test</button>}
              </div>
              {repeatActive && <div className="progress-line"><span style={{width: `${((5 - remaining) / 5) * 100}%`}}/></div>}
              <p className="repeat-foot">{repeatActive ? `${remaining} message(s) left · Stop is available at any time.` : "Delay must be between 5 and 60 seconds. Mentions are disabled."}</p>
            </section>
          </form>

          <aside className="side-column">
            <div className="preview-heading"><div><span className="overline">ON THE OTHER SIDE</span><h2>Message preview</h2></div><button type="button" className="preview-toggle" onClick={() => setPreview(v => !v)}>{preview ? "Hide" : "Show"}</button></div>
            {preview && <div className="discord-preview">
              <div className="discord-top"><span className="discord-dot"/> DISCORD <span className="channel-name">/ webhook</span></div>
              <div className="discord-body"><div className="avatar">{avatar ? <img src={avatar} alt="" onError={e => {e.currentTarget.style.display="none";}}/> : <span>{(username.trim()[0] || "H").toUpperCase()}</span>}</div><div className="discord-copy"><div className="discord-author">{username.trim() || "Webhook"} <span className="app-tag">APP</span><time>Today at 12:00</time></div><p>{content || <span className="muted">Your message will show up here.</span>}</p></div></div>
              <div className="discord-bottom"><span>PREVIEW ONLY</span><span>{content.length} characters</span></div>
            </div>}
            <div className="side-note"><div className="note-icon"><ShieldCheck size={17}/></div><div><b>Keep the URL to yourself</b><p>Anyone with a webhook URL can post through it. If it leaks, delete or regenerate it in Discord.</p></div></div>
            <div className="guide">
              <span className="overline">NEED A WEBHOOK?</span>
              <h3>Find it in Discord</h3>
              <ol><li>Open your server settings.</li><li>Choose <b>Integrations</b>, then <b>Webhooks</b>.</li><li>Create one or copy an existing URL.</li></ol>
            </div>
            <div className="small-print"><Settings2 size={14}/><span>Messages are sent directly from your browser. Hooksend doesn't store your webhook URL on a server.</span></div>
          </aside>
        </div>
      </main>

      <footer className="footer"><a className="wordmark small" href="#"><span className="mark">h</span><span>hooksend</span></a><span>Just a handy little webhook tool.</span><span className="mono">V 2.0</span></footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);