import { useState, useEffect, useCallback, useRef } from "react";

const QUICK_PHRASES = [
  { label: "Greeting", text: "Good afternoon, how do you do?" },
  { label: "Gratitude", text: "I'd be rather grateful if you could help me." },
  { label: "Directions", text: "Could you please tell me where the nearest underground station is?" },
  { label: "Apology", text: "I'm terribly sorry to bother you." },
  { label: "Weather", text: "It's a bit chilly today, isn't it?" },
  { label: "Tricky Cities", text: "Worcester, Leicester, Gloucester, Edinburgh and Thames." },
  { label: "Vowel Drill", text: "The bath, the grass, the dance, the path, the class, the past." },
  { label: "Formal", text: "I shan't be able to attend, I'm afraid. Do send my regards." },
];

const TIPS = [
  { icon: "◈", label: "Non-rhotic", text: "'Car' sounds like 'cah' — the R after vowels is silent." },
  { icon: "◉", label: "Long A vowel", text: "Bath, grass, dance → use a long 'ah', not the American short 'a'." },
  { icon: "◆", label: "T sounds", text: "UK keeps the crisp 'T' — 'butter' is not 'budder'." },
  { icon: "◇", label: "Tricky cities", text: "Leicester = 'Lester', Worcester = 'Wooster', Edinburgh = 'Edinbruh'." },
];

type State = "idle" | "speaking" | "paused";

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className={`waveform ${active ? "waveform--active" : ""}`}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="wave-bar" style={{ animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
      ))}
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(0.85);
  const [pitch, setPitch] = useState(1.0);
  const [state, setState] = useState<State>("idle");
  const [words, setWords] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(-1);
  const [activePhrase, setActivePhrase] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const uk = all.filter(v => v.lang.startsWith("en-GB"));
      const list = uk.length ? uk : all.filter(v => v.lang.startsWith("en"));
      setVoices(list);
      if (list.length && !selectedVoice) setSelectedVoice(list[0].name);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
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
    u.onstart = () => setState("speaking");
    u.onend = () => { setState("idle"); setWordIdx(-1); };
    u.onerror = () => { setState("idle"); setWordIdx(-1); };
    window.speechSynthesis.speak(u);
    setState("speaking");
  }, [text, voices, selectedVoice, rate, pitch]);

  const togglePause = useCallback(() => {
    if (state === "speaking") { window.speechSynthesis.pause(); setState("paused"); }
    else if (state === "paused") { window.speechSynthesis.resume(); setState("speaking"); }
  }, [state]);

  const pickPhrase = (p: typeof QUICK_PHRASES[0]) => {
    stop();
    setText(p.text);
    setActivePhrase(p.label);
  };

  const isPlaying = state !== "idle";
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="root">
      {/* LEFT PANEL */}
      <aside className="left-panel">
        <div className="left-top">
          <div className="brand">
            <span className="brand-flag">🇬🇧</span>
            <div>
              <div className="brand-name">SpeakBritish</div>
              <div className="brand-sub">UK English · Pronunciation</div>
            </div>
          </div>
        </div>

        {/* Stage — shows highlighted words when speaking, idle message when not */}
        <div className="stage">
          {!isPlaying ? (
            <div className="stage-idle">
              <div className="stage-idle-icon">◉</div>
              <p className="stage-idle-text">Enter your text and press<br />Read Aloud to begin.</p>
            </div>
          ) : (
            <div className="stage-words">
              {words.map((w, i) => (
                <span
                  key={i}
                  className={`stage-word ${i === wordIdx ? "stage-word--current" : i < wordIdx ? "stage-word--done" : "stage-word--upcoming"}`}
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Waveform */}
        <WaveformBars active={state === "speaking"} />

        {/* Big play button */}
        <div className="play-zone">
          {state === "idle" ? (
            <button className="play-btn" onClick={speak} disabled={!text.trim() || !voices.length} aria-label="Read aloud">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
            </button>
          ) : (
            <div className="play-controls">
              <button className="ctrl-btn ctrl-pause" onClick={togglePause}>
                {state === "paused"
                  ? <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>
                  : <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                }
              </button>
              <button className="ctrl-btn ctrl-stop" onClick={stop}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 6h12v12H6z"/></svg>
              </button>
            </div>
          )}
          <span className="play-status">
            {state === "idle" && "Ready"}
            {state === "speaking" && "Speaking…"}
            {state === "paused" && "Paused"}
          </span>
        </div>

        {/* Tips */}
        <div className="tips-list">
          <div className="tips-heading">Pronunciation Notes</div>
          {TIPS.map(t => (
            <div key={t.label} className="tip-row">
              <span className="tip-icon">{t.icon}</span>
              <div>
                <div className="tip-label">{t.label}</div>
                <div className="tip-body">{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="right-panel">
        {/* Voice + settings bar */}
        <div className="settings-bar">
          <div className="setting-item">
            <label className="setting-label">Voice</label>
            {voices.length > 0 ? (
              <select className="setting-select" value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}>
                {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
              </select>
            ) : (
              <span className="setting-missing">No UK voices found</span>
            )}
          </div>
          <div className="setting-item">
            <label className="setting-label">Speed <em>{rate.toFixed(2)}×</em></label>
            <input type="range" min="0.5" max="1.5" step="0.05" value={rate}
              onChange={e => setRate(+e.target.value)} className="range-input" />
          </div>
          <div className="setting-item">
            <label className="setting-label">Pitch <em>{pitch.toFixed(1)}</em></label>
            <input type="range" min="0.5" max="1.5" step="0.1" value={pitch}
              onChange={e => setPitch(+e.target.value)} className="range-input" />
          </div>
        </div>

        {/* Quick phrases */}
        <div className="phrases-section">
          <div className="phrases-heading">Quick Phrases</div>
          <div className="phrases-scroll">
            {QUICK_PHRASES.map(p => (
              <button
                key={p.label}
                className={`phrase-tag ${activePhrase === p.label ? "phrase-tag--active" : ""}`}
                onClick={() => pickPhrase(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {activePhrase && (
            <div className="phrase-preview">{text}</div>
          )}
        </div>

        {/* Main textarea */}
        <div className="editor-section">
          <div className="editor-header">
            <span className="editor-label">Your Text</span>
            <span className="editor-meta">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
          </div>
          <textarea
            ref={textareaRef}
            className="editor"
            value={text}
            onChange={e => { setText(e.target.value); setActivePhrase(""); stop(); }}
            placeholder="Type a word, sentence, or paste an entire paragraph…"
            rows={10}
          />
          <div className="editor-footer">
            <button className="clear-btn" onClick={() => { setText(""); setActivePhrase(""); stop(); }} disabled={!text}>
              Clear
            </button>
            <button
              className={`read-btn ${isPlaying ? "read-btn--playing" : ""}`}
              onClick={state === "idle" ? speak : stop}
              disabled={!text.trim() || !voices.length}
            >
              {state === "idle"
                ? <><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg> Read Aloud</>
                : <><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 6h12v12H6z"/></svg> Stop</>
              }
            </button>
          </div>
        </div>

        {/* Bottom word-track bar when idle after speaking */}
        <div className="footer-brand">
          <span>Powered by Web Speech API · en-GB</span>
        </div>
      </main>
    </div>
  );
}
