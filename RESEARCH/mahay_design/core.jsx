/* MAHAY — core: store, speech, shared components */
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;
const D = window.MAHAY_DATA;

/* ---------------- progress store (localStorage) ---------------- */
const STORE_KEY = 'mahay.progress.v1';
const todayStr = (d = new Date()) => d.toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function loadProgress() {
  try { const p = JSON.parse(localStorage.getItem(STORE_KEY)); if (p) return p; } catch (e) {}
  return { xp: 0, completed: {}, streak: 0, lastDay: null, days: [], cards: {}, quizBest: 0, goal: 30 };
}
const ProgressCtx = createContext(null);
function ProgressProvider({ children }) {
  const [p, setP] = useState(loadProgress);
  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(p)); }, [p]);
  const api = useMemo(() => ({
    p,
    addXp(n) {
      setP((s) => {
        const t = todayStr();
        let streak = s.streak, days = s.days.slice();
        if (s.lastDay !== t) {
          streak = s.lastDay && daysBetween(s.lastDay, t) === 1 ? s.streak + 1 : 1;
          days = [...days.filter((d) => daysBetween(d, t) < 14), t];
        }
        const todayXp = (s.lastDay === t ? (s.todayXp || 0) : 0) + n;
        return { ...s, xp: s.xp + n, streak, lastDay: t, days, todayXp };
      });
    },
    completeLesson(id, vocab) {
      setP((s) => {
        const cards = { ...s.cards };
        vocab.forEach((v) => { if (!cards[v.mg]) cards[v.mg] = { ...v, box: 1, due: todayStr(), lesson: id }; });
        return { ...s, completed: { ...s.completed, [id]: todayStr() }, cards };
      });
    },
    addCard(v) { setP((s) => s.cards[v.mg] ? s : { ...s, cards: { ...s.cards, [v.mg]: { ...v, box: 1, due: todayStr() } } }); },
    removeCard(mg) { setP((s) => { const c = { ...s.cards }; delete c[mg]; return { ...s, cards: c }; }); },
    gradeCard(mg, ok) {
      // Leitner: boxes 1..5, intervals in days
      const iv = [0, 1, 2, 4, 8, 16];
      setP((s) => {
        const c = s.cards[mg]; if (!c) return s;
        const box = ok ? Math.min(5, c.box + 1) : 1;
        const d = new Date(); d.setDate(d.getDate() + (ok ? iv[box] : 0));
        return { ...s, cards: { ...s.cards, [mg]: { ...c, box, due: todayStr(d) } } };
      });
    },
    setQuizBest(n) { setP((s) => ({ ...s, quizBest: Math.max(s.quizBest || 0, n) })); },
    reset() { setP({ xp: 0, completed: {}, streak: 0, lastDay: null, days: [], cards: {}, quizBest: 0, goal: 30 }); },
  }), [p]);
  return <ProgressCtx.Provider value={api}>{children}</ProgressCtx.Provider>;
}
const useProgress = () => useContext(ProgressCtx);

/* ---------------- display prefs (from tweaks) ---------------- */
const PrefsCtx = createContext({ phonetic: true, english: true });
const usePrefs = () => useContext(PrefsCtx);

/* ---------------- speech ---------------- */
// Browsers rarely ship a Malagasy voice. Order of preference:
// mg → Indonesian/Malay (similar spelling-to-sound) → any voice, slowed.
const Speech = (() => {
  let voices = [];
  const load = () => { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; };
  if (window.speechSynthesis) { load(); speechSynthesis.onvoiceschanged = load; }
  const pick = () => voices.find((v) => /^mg/i.test(v.lang)) || voices.find((v) => /^id/i.test(v.lang)) ||
    voices.find((v) => /^ms/i.test(v.lang)) || voices.find((v) => /^fr/i.test(v.lang)) || voices[0];
  // light respelling so a non-Malagasy voice gets closer
  const prep = (t) => t.replace(/…/g, ' ').replace(/tr/gi, 'tch').replace(/dr/gi, 'dj').replace(/o/g, 'u').replace(/O/g, 'U');
  return {
    available: !!window.speechSynthesis,
    voiceName() { const v = pick(); return v ? `${v.name} (${v.lang})` : 'none'; },
    speak(text, { rate = 0.85, onend } = {}) {
      if (!window.speechSynthesis) { onend && onend(); return; }
      speechSynthesis.cancel();
      const v = pick();
      const u = new SpeechSynthesisUtterance(v && /^mg/i.test(v.lang) ? text : prep(text));
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = rate;
      u.onend = () => onend && onend();
      u.onerror = () => onend && onend();
      speechSynthesis.speak(u);
    },
  };
})();

function useSpeak() {
  const [speaking, setSpeaking] = useState(null);
  const speak = useCallback((text, rate) => {
    setSpeaking(text);
    Speech.speak(text, { rate, onend: () => setSpeaking((s) => (s === text ? null : s)) });
  }, []);
  return [speaking, speak];
}

/* ---------------- tiny icons (simple shapes only) ---------------- */
const Ico = {
  play: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>,
  slow: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M2 3v10l6-5zM9 3v10l6-5z" fill="currentColor" opacity=".55" /></svg>,
  mic: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" fill="currentColor" /><path d="M3.5 7.5a4.5 4.5 0 009 0M8 12v2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>,
  stop: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" fill="currentColor" /></svg>,
  plus: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  check: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  arrow: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  back: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  ext: (s = 12) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  flame: (s = 14) => <svg width={s} height={s} viewBox="0 0 16 16"><path d="M8 1.5c1 2.5 4.5 4 4.5 8a4.5 4.5 0 01-9 0c0-2 1-3 2-4 0 1.5.8 2.3 1.5 2.5C7 6 7 3.5 8 1.5z" fill="currentColor" /></svg>,
};

/* ---------------- shared components ---------------- */
function SpeakBtn({ text, size = 'md', label, slow = false }) {
  const [speaking, speak] = useSpeak();
  const on = speaking === text;
  return (
    <button className={`speak speak-${size} ${on ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); speak(text, slow ? 0.55 : 0.85); }}
      aria-label={`Listen: ${text}`} title={slow ? 'Listen slowly' : 'Listen'}>
      {slow ? Ico.slow(size === 'lg' ? 18 : 13) : Ico.play(size === 'lg' ? 18 : 12)}
      {label && <span>{label}</span>}
    </button>
  );
}

/* record & compare */
function RecordBtn({ text }) {
  const [state, setState] = useState('idle'); // idle | rec | ready | denied
  const [url, setUrl] = useState(null);
  const rec = useRef(null);
  const start = async (e) => {
    e.stopPropagation();
    if (state === 'rec') { rec.current && rec.current.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream); const chunks = [];
      mr.ondataavailable = (ev) => chunks.push(ev.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const u = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType }));
        setUrl(u); setState('ready'); new Audio(u).play();
      };
      rec.current = mr; mr.start(); setState('rec');
      setTimeout(() => { if (mr.state === 'recording') mr.stop(); }, 5000);
    } catch (err) { setState('denied'); }
  };
  return (
    <span className="rec-wrap">
      <button className={`speak speak-md rec ${state === 'rec' ? 'recording' : ''}`} onClick={start} title="Record yourself (5s max)">
        {state === 'rec' ? Ico.stop(12) : Ico.mic(13)}
        <span>{state === 'rec' ? 'Stop' : state === 'denied' ? 'Mic blocked' : 'Repeat'}</span>
      </button>
      {url && state === 'ready' && (
        <button className="speak speak-md ghost" onClick={(e) => { e.stopPropagation(); new Audio(url).play(); }} title="Play your recording">
          {Ico.play(11)}<span>You</span>
        </button>
      )}
    </span>
  );
}

/* phrase row — respects phonetic / english prefs */
function Phrase({ item, size = 'md', who, actions = true, addable = false }) {
  const prefs = usePrefs();
  const [revealed, setRevealed] = useState(false);
  const prog = useProgress();
  const inDeck = prog && prog.p.cards[item.mg];
  return (
    <div className={`phrase phrase-${size}`}>
      {who !== undefined && who !== '' && <div className="phrase-who">{who}</div>}
      <div className="phrase-main">
        <div className="phrase-mg" lang="mg">{item.mg}</div>
        {prefs.phonetic && item.phon && <div className="phrase-phon">{item.phon}</div>}
        {prefs.english ? <div className="phrase-en">{item.en}</div> : (
          <button className={`phrase-en reveal ${revealed ? 'shown' : ''}`} onClick={() => setRevealed(!revealed)}>
            {revealed ? item.en : 'Tap to reveal meaning'}
          </button>
        )}
      </div>
      {actions && (
        <div className="phrase-actions">
          <SpeakBtn text={item.mg} />
          <SpeakBtn text={item.mg} slow />
          {addable && (
            <button className={`speak speak-md ${inDeck ? 'added' : 'ghost'}`} title={inDeck ? 'In your flashcards' : 'Add to flashcards'}
              onClick={() => inDeck ? prog.removeCard(item.mg) : prog.addCard(item)}>
              {inDeck ? Ico.check(12) : Ico.plus(12)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Photo({ src, alt, className = '', style }) {
  return <div className={`photo ${className}`} style={style} role="img" aria-label={alt}><img src={src} alt={alt} loading="lazy" /></div>;
}

function Eyebrow({ children, className = '' }) { return <div className={`eyebrow ${className}`}>{children}</div>; }

function ProgressBar({ value, max = 1 }) {
  return <div className="pbar"><div style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div>;
}

/* ---------------- routing ---------------- */
function useRoute() {
  const get = () => (location.hash.replace(/^#\/?/, '') || 'home');
  const [r, setR] = useState(get);
  useEffect(() => { const f = () => { setR(get()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return r;
}
const go = (path) => { location.hash = '/' + path; };

Object.assign(window, {
  D, ProgressProvider, useProgress, PrefsCtx, usePrefs, Speech, useSpeak, Ico, SpeakBtn, RecordBtn, Phrase,
  Photo, Eyebrow, ProgressBar, useRoute, go, todayStr,
});
