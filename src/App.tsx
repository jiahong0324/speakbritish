import { useState, useEffect, useCallback } from "react";

const PHRASES = [
  { label: "🤝 Greet", text: "Good afternoon, how do you do?" },
  { label: "🙏 Thank", text: "I'd be rather grateful if you could help me." },
  { label: "🗺️ Directions", text: "Could you tell me where the nearest underground station is?" },
  { label: "😬 Apology", text: "I'm terribly sorry to bother you." },
  { label: "☁️ Weather", text: "It's a bit chilly today, isn't it?" },
  { label: "🏙️ Cities", text: "Worcester, Leicester, Gloucester, Edinburgh and Thames." },
  { label: "🔤 Vowels", text: "The bath, the grass, the dance, the path, the class." },
  { label: "📜 Formal", text: "I shan't be able to attend, I'm afraid. Do send my regards." },
];

const THEMES = [
  { name: "Sand",     bg: "#f0ece4", surface: "#ffffff", border: "#e2dbd0", muted: "#78716c" },
  { name: "Slate",    bg: "#e8edf2", surface: "#ffffff", border: "#d0d9e2", muted: "#5a7080" },
  { name: "Sage",     bg: "#e8ede8", surface: "#ffffff", border: "#cddacd", muted: "#527052" },
  { name: "Rose",     bg: "#f2e8e8", surface: "#ffffff", border: "#e2cece", muted: "#906060" },
  { name: "Lavender", bg: "#ede8f2", surface: "#ffffff", border: "#d8cee2", muted: "#706080" },
  { name: "Peach",    bg: "#f2ece6", surface: "#ffffff", border: "#e2d4c8", muted: "#806050" },
  { name: "Night",    bg: "#1a1a2e", surface: "#16213e", border: "#0f3460", muted: "#8892b0" },
  { name: "Forest",   bg: "#1a2420", surface: "#1e2e28", border: "#2a4038", muted: "#7aab90" },
];

const FONTS = [
  {
    name: "Classic",
    label: "Aa",
    description: "DM Serif + DM Sans",
    display: "'DM Serif Display', serif",
    body: "'DM Sans', sans-serif",
    google: "DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600",
  },
  {
    name: "Editorial",
    label: "Aa",
    description: "Playfair + Lato",
    display: "'Playfair Display', serif",
    body: "'Lato', sans-serif",
    google: "Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700",
  },
  {
    name: "Modern",
    label: "Aa",
    description: "Syne + Inter",
    display: "'Syne', sans-serif",
    body: "'Inter', sans-serif",
    google: "Syne:wght@600;700;800&family=Inter:wght@300;400;500;600",
  },
  {
    name: "Typewriter",
    label: "Aa",
    description: "Courier Prime",
    display: "'Courier Prime', monospace",
    body: "'Courier Prime', monospace",
    google: "Courier+Prime:ital,wght@0,400;0,700;1,400",
  },
  {
    name: "Elegant",
    label: "Aa",
    description: "Cormorant + Jost",
    display: "'Cormorant Garamond', serif",
    body: "'Jost', sans-serif",
    google: "Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500;600",
  },
  {
    name: "Friendly",
    label: "Aa",
    description: "Nunito + Quicksand",
    display: "'Nunito', sans-serif",
    body: "'Quicksand', sans-serif",
    google: "Nunito:wght@400;600;700;800&family=Quicksand:wght@400;500;600",
  },
];

type State = "idle" | "speaking" | "paused";

export default function App() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1.0);
  const [speechState, setSpeechState] = useState<State>("idle");
  const [words, setWords] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [fontIdx, setFontIdx] = useState(0);

  const theme = THEMES[themeIdx];
  const font = FONTS[fontIdx];
  const isDark = themeIdx >= 6;

  // Load Google Fonts dynamically
  useEffect(() => {
    const id = "gfont-dynamic";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  }, [fontIdx]);

  // Apply theme CSS vars
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--bg", theme.bg);
    r.setProperty("--surface", theme.surface);
    r.setProperty("--border", theme.border);
    r.setProperty("--muted", theme.muted);
    r.setProperty("--text", isDark ? "#e2e8f0" : "#1c1917");
    r.setProperty("--dim", isDark ? "#8892b0" : "#a8a29e");
    r.setProperty("--pill-bg", isDark ? theme.surface : "#ede8df");
    r.setProperty("--pill-border", theme.border);
    r.setProperty("--font-display", font.display);
    r.setProperty("--font-body", font.body);
  }, [themeIdx, fontIdx]);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const uk = all.filter(v => v.lang.startsWith("en-GB"));
      const other = all.filter(v => v.lang.startsWith("en") && !v.lang.startsWith("en-GB"));
      const list = [...uk, ...other];
      setVoices(list);
      if (list.length && !selectedVoice) setSelectedVoice(list[0].name);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeechState("idle");
    setWordIdx(-1);
  }, []);

  const speak = useCallback(() => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const wordList = text.trim().split(/\s+/);
    setWords(wordList);
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find(v => v.name === selectedVoice);
    if (v) u.voice = v;
    u.lang = "en-GB";
    u.rate = rate;
    u.pitch = pitch;
    let idx = 0;
    u.onboundary = e => { if (e.name === "word") { setWordIdx(idx); idx++; } };
    u.onstart = () => setSpeechState("speaking");
    u.onend = () => { setSpeechState("idle"); setWordIdx(-1); };
    u.onerror = () => { setSpeechState("idle"); setWordIdx(-1); };
    window.speechSynthesis.speak(u);
    setSpeechState("speaking");
  }, [text, voices, selectedVoice, rate, pitch]);

  const togglePause = useCallback(() => {
    if (speechState === "speaking") { window.speechSynthesis.pause(); setSpeechState("paused"); }
    else if (speechState === "paused") { window.speechSynthesis.resume(); setSpeechState("speaking"); }
  }, [speechState]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isActive = speechState !== "idle";

  return (
    <div className="page">
      <header className="header">
        <div className="header-left">
          <span className="flag">🇬🇧</span>
          <div>
            <div className="app-name">SpeakBritish</div>
            <div className="app-sub">UK English Reader</div>
          </div>
        </div>
        <button className={`settings-toggle ${showSettings ? "settings-toggle--on" : ""}`}
          onClick={() => setShowSettings(s => !s)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
        </button>
      </header>

      {showSettings && (
        <div className="settings-panel">
          {/* Voice */}
          <div className="setting-row">
            <label className="setting-label">Voice</label>
            <select className="setting-select" value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}>
              {voices.filter(v => v.lang.startsWith("en-GB")).length > 0 && (
                <optgroup label="🇬🇧 UK English">
                  {voices.filter(v => v.lang.startsWith("en-GB")).map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </optgroup>
              )}
              {voices.filter(v => !v.lang.startsWith("en-GB")).length > 0 && (
                <optgroup label="🌐 Other English">
                  {voices.filter(v => !v.lang.startsWith("en-GB")).map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Speed */}
          <div className="setting-row">
            <label className="setting-label">Speed <span>{rate.toFixed(2)}×</span></label>
            <input type="range" min="0.5" max="1.5" step="0.05" value={rate}
              onChange={e => setRate(+e.target.value)} className="range" />
          </div>

          {/* Pitch */}
          <div className="setting-row">
            <label className="setting-label">Pitch <span>{pitch.toFixed(1)}</span></label>
            <input type="range" min="0.5" max="1.5" step="0.1" value={pitch}
              onChange={e => setPitch(+e.target.value)} className="range" />
          </div>

          <div className="divider" />

          {/* Background */}
          <div className="theme-row">
            <label className="setting-label">Background</label>
            <div className="theme-swatches">
              {THEMES.map((t, i) => (
                <button key={t.name}
                  className={`swatch ${i === themeIdx ? "swatch--on" : ""}`}
                  style={{ background: t.bg, borderColor: i === themeIdx ? (isDark ? "#fff" : "#1c1917") : t.border }}
                  onClick={() => setThemeIdx(i)}
                  title={t.name}
                />
              ))}
            </div>
          </div>
          <div className="sub-label">{THEMES[themeIdx].name}</div>

          <div className="divider" />

          {/* Font */}
          <div className="font-section">
            <label className="setting-label" style={{ marginBottom: "0.6rem", display: "block" }}>Font Style</label>
            <div className="font-grid">
              {FONTS.map((f, i) => (
                <button key={f.name}
                  className={`font-card ${i === fontIdx ? "font-card--on" : ""}`}
                  onClick={() => setFontIdx(i)}
                  style={{ fontFamily: f.display }}
                >
                  <span className="font-card-sample">Aa</span>
                  <span className="font-card-name">{f.name}</span>
                  <span className="font-card-desc">{f.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick phrases */}
      <div className="phrases-row">
        {PHRASES.map(p => (
          <button key={p.label}
            className={`phrase-pill ${text === p.text ? "phrase-pill--on" : ""}`}
            onClick={() => { stop(); setText(p.text); }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Main card */}
      <div className="card">
        {isActive ? (
          <div className="live-display">
            {words.map((w, i) => (
              <span key={i} className={`lw ${i === wordIdx ? "lw--on" : i < wordIdx ? "lw--done" : ""}`}>
                {w}{" "}
              </span>
            ))}
          </div>
        ) : (
          <textarea
            className="editor"
            value={text}
            onChange={e => { setText(e.target.value); stop(); }}
            placeholder="Type a word, sentence or paste an essay…"
            rows={6}
          />
        )}

        <div className="card-footer">
          <span className="word-count">{wordCount > 0 ? `${wordCount} words` : ""}</span>
          <div className="footer-actions">
            {!isActive && text && (
              <button className="btn-clear" onClick={() => { setText(""); stop(); }}>Clear</button>
            )}
            {speechState === "idle" && (
              <button className="btn-play" onClick={speak} disabled={!text.trim() || !voices.length}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Read Aloud
              </button>
            )}
            {speechState === "speaking" && (
              <>
                <button className="btn-pause" onClick={togglePause}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  Pause
                </button>
                <button className="btn-stop" onClick={stop}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                </button>
              </>
            )}
            {speechState === "paused" && (
              <>
                <button className="btn-play" onClick={togglePause}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Resume
                </button>
                <button className="btn-stop" onClick={stop}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="status-bar">
          <span className={`status-dot ${speechState === "speaking" ? "status-dot--live" : "status-dot--paused"}`}/>
          <span>{speechState === "speaking" ? "Speaking…" : "Paused"}</span>
          <span className="status-voice">{selectedVoice}</span>
        </div>
      )}

      <div className="tips">
        <div className="tips-title">Pronunciation tips</div>
        <div className="tips-grid">
          {[
            ["Non-rhotic", "'car' → 'cah' — R after vowels is silent"],
            ["Long A", "bath, grass, dance → long 'ah' sound"],
            ["Crisp T", "'butter' stays 'butter', not 'budder'"],
            ["Cities", "Leicester = Lester · Worcester = Wooster"],
          ].map(([t, d]) => (
            <div key={t} className="tip">
              <div className="tip-t">{t}</div>
              <div className="tip-d">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
