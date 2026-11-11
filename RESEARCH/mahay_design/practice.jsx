/* MAHAY — practice hub: flashcards (Leitner SRS), quiz, progress */

function StreakWeek() {
  const { p } = useProgress();
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
  const names = ['Al', 'Alt', 'Tal', 'Alr', 'Alk', 'Zom', 'Asa']; // Sun..Sat abbreviations
  return (
    <div className="week">
      {days.map((d) => {
        const on = p.days.includes(todayStr(d));
        return <div key={d} className={`wk-day ${on ? 'on' : ''} ${todayStr(d) === todayStr() ? 'today' : ''}`}><span>{names[d.getDay()]}</span><i /></div>;
      })}
    </div>
  );
}

function ProgressPanel() {
  const { p } = useProgress();
  const cards = Object.values(p.cards);
  const boxes = [1, 2, 3, 4, 5].map((b) => cards.filter((c) => c.box === b).length);
  const todayXp = p.lastDay === todayStr() ? p.todayXp || 0 : 0;
  return (
    <aside className="prog-panel">
      <div className="pp-streak">
        <div className="pp-flame">{Ico.flame(22)}</div>
        <div><b>{p.streak}</b> day streak</div>
      </div>
      <StreakWeek />
      <div className="pp-goal">
        <div className="pp-row"><span>Today’s goal</span><span>{Math.min(todayXp, p.goal)}/{p.goal} XP</span></div>
        <ProgressBar value={todayXp} max={p.goal} />
      </div>
      <div className="pp-boxes">
        <div className="pp-row"><span>Memory strength</span><span>{cards.length} words</span></div>
        <div className="boxes">
          {boxes.map((n, i) => (
            <div key={i} className="box"><div className="box-bar" style={{ height: `${cards.length ? 8 + (n / cards.length) * 72 : 8}px` }} /><span>{n}</span></div>
          ))}
        </div>
        <div className="pp-row small"><span>new</span><span>mastered</span></div>
      </div>
      <div className="pp-row"><span>Total XP</span><b>{p.xp}</b></div>
      <div className="pp-row"><span>Best quiz</span><b>{p.quizBest || 0}/10</b></div>
    </aside>
  );
}

function Flashcards({ onExit }) {
  const prog = useProgress();
  const prefs = usePrefs();
  const [dir, setDir] = useState('mg-en');
  const queue0 = useMemo(() => {
    const due = Object.values(prog.p.cards).filter((c) => c.due <= todayStr());
    return shuffle(due).slice(0, 15);
  }, []); // snapshot at session start
  const [queue, setQueue] = useState(queue0);
  const [flip, setFlip] = useState(false);
  const [stats, setStats] = useState({ ok: 0, no: 0 });
  const c = queue[0];

  const grade = (ok) => {
    prog.gradeCard(c.mg, ok); prog.addXp(ok ? 2 : 1);
    setStats((s) => ({ ...s, [ok ? 'ok' : 'no']: s[ok ? 'ok' : 'no'] + 1 }));
    setFlip(false);
    setQueue((q) => ok ? q.slice(1) : [...q.slice(1), q[0]]);
  };
  useEffect(() => {
    const k = (e) => {
      if (!c) return;
      if (e.code === 'Space') { e.preventDefault(); setFlip((f) => !f); }
      if (flip && e.key === '1') grade(false);
      if (flip && e.key === '2') grade(true);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  useEffect(() => { if (c && dir === 'mg-en' && !flip) Speech.speak(c.mg); }, [c && c.mg]);

  if (!queue0.length) return (
    <div className="empty">
      <h2 lang="mg">Tsy misy karatra</h2>
      <p>No cards are due. Finish a lesson or add phrases from the phrasebook with the + button.</p>
      <button className="btn btn-ghost" onClick={onExit}>{Ico.back(12)} Back</button>
    </div>
  );
  if (!c) return (
    <div className="empty">
      <div className="done-mark">{Ico.check(30)}</div>
      <h2 lang="mg">Vita ny famerenana!</h2>
      <p>Review done: {stats.ok} remembered, {stats.no} to practise again.</p>
      <button className="btn btn-primary" onClick={onExit}>Back to practice</button>
    </div>
  );
  const front = dir === 'mg-en';
  return (
    <div className="fc-wrap">
      <div className="fc-top">
        <button className="btn btn-ghost btn-sm" onClick={onExit}>{Ico.back(12)} Exit</button>
        <div className="seg">
          <button className={dir === 'mg-en' ? 'on' : ''} onClick={() => { setDir('mg-en'); setFlip(false); }}>MG → EN</button>
          <button className={dir === 'en-mg' ? 'on' : ''} onClick={() => { setDir('en-mg'); setFlip(false); }}>EN → MG</button>
        </div>
        <span className="muted">{queue.length} left</span>
      </div>
      <div className={`fc ${flip ? 'flipped' : ''}`} onClick={() => setFlip(!flip)}>
        <div className="fc-face fc-front">
          <div className="fc-box">Box {c.box}</div>
          {front ? <div className="fc-mg" lang="mg">{c.mg}</div> : <div className="fc-en">{c.en}</div>}
          {front && prefs.phonetic && <div className="phrase-phon">{c.phon}</div>}
          <div className="fc-hint">Tap or press space to flip</div>
        </div>
        <div className="fc-face fc-back">
          <div className="fc-mg" lang="mg">{c.mg}</div>
          {prefs.phonetic && <div className="phrase-phon">{c.phon}</div>}
          <div className="fc-en">{c.en}</div>
          <div onClick={(e) => e.stopPropagation()} className="fc-audio"><SpeakBtn text={c.mg} label="Listen" /><SpeakBtn text={c.mg} slow /></div>
        </div>
      </div>
      <div className={`fc-grade ${flip ? '' : 'hidden'}`}>
        <button className="btn btn-again" onClick={() => grade(false)}>Again <kbd>1</kbd></button>
        <button className="btn btn-primary" onClick={() => grade(true)}>Got it <kbd>2</kbd></button>
      </div>
    </div>
  );
}

function buildQuiz() {
  const pool = D.lessons.flatMap((l) => l.vocab.map((v) => ({ ...v, lesson: l.title })));
  const qs = shuffle(pool).slice(0, 10).map((v, i) => {
    const type = i % 3; // 0: mg→en, 1: en→mg, 2: listen
    const wrong = shuffle(pool.filter((x) => x.mg !== v.mg && x.en !== v.en)).slice(0, 3);
    const opts = shuffle([v, ...wrong]);
    return { v, type, opts };
  });
  return qs;
}

function Quiz({ onExit }) {
  const prog = useProgress();
  const [qs, setQs] = useState(buildQuiz);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const q = qs[i];
  useEffect(() => { if (q && q.type === 2) setTimeout(() => Speech.speak(q.v.mg), 250); }, [i]);

  if (!q) {
    return (
      <div className="empty">
        <div className="quiz-score">{score}<span>/10</span></div>
        <h2 lang="mg">{score >= 8 ? 'Mahay be ianao!' : score >= 5 ? 'Tsara!' : 'Mazotoa!'}</h2>
        <p>{score >= 8 ? 'You really know it!' : score >= 5 ? 'Good work, keep reviewing.' : 'Keep it up. Review your flashcards and try again.'}</p>
        <div className="hero-cta center">
          <button className="btn btn-primary" onClick={() => { setQs(buildQuiz()); setI(0); setScore(0); setPick(null); }}>Try again</button>
          <button className="btn btn-ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }
  const answer = (o) => {
    if (pick) return;
    setPick(o);
    const ok = o.mg === q.v.mg;
    if (ok) { setScore(score + 1); prog.addXp(3); }
    if (q.type !== 1) Speech.speak(q.v.mg);
  };
  const advance = () => {
    if (i === qs.length - 1) prog.setQuizBest(score);
    setI(i + 1); setPick(null);
  };
  return (
    <div className="quiz">
      <div className="fc-top">
        <button className="btn btn-ghost btn-sm" onClick={onExit}>{Ico.back(12)} Exit</button>
        <ProgressBar value={i} max={qs.length} />
        <span className="muted">{i + 1}/10</span>
      </div>
      <div className="quiz-q">
        <Eyebrow>{q.type === 0 ? 'What does this mean?' : q.type === 1 ? 'How do you say…' : 'Listen and choose'}</Eyebrow>
        {q.type === 0 && <div className="quiz-prompt mg" lang="mg">{q.v.mg}</div>}
        {q.type === 1 && <div className="quiz-prompt">{q.v.en}</div>}
        {q.type === 2 && <div className="quiz-listen"><SpeakBtn text={q.v.mg} size="lg" label="Play again" /><SpeakBtn text={q.v.mg} slow size="lg" /></div>}
      </div>
      <div className="quiz-opts">
        {q.opts.map((o) => {
          const st = pick ? (o.mg === q.v.mg ? 'ok' : o === pick ? 'no' : 'dim') : '';
          return (
            <button key={o.mg} className={`quiz-opt ${st}`} onClick={() => answer(o)} lang={q.type === 0 ? undefined : 'mg'}>
              {q.type === 0 ? o.en : o.mg}
            </button>
          );
        })}
      </div>
      <div className={`quiz-foot ${pick ? '' : 'hidden'}`}>
        {pick && <span className={`fb ${pick.mg === q.v.mg ? 'ok' : 'no'}`}>{pick.mg === q.v.mg ? 'Marina! Correct.' : <>The answer is <b lang="mg">{q.v.mg}</b>: {q.v.en}</>}</span>}
        <button className="btn btn-primary" onClick={advance}>{i === qs.length - 1 ? 'See score' : 'Next'} {Ico.arrow(12)}</button>
      </div>
    </div>
  );
}

function Practice({ sub }) {
  const prog = useProgress();
  const cards = Object.values(prog.p.cards);
  const due = cards.filter((c) => c.due <= todayStr()).length;
  if (sub === 'cards') return <div className="page wrap narrow" data-screen-label="04 Flashcards"><Flashcards onExit={() => go('practice')} /></div>;
  if (sub === 'quiz') return <div className="page wrap narrow" data-screen-label="04 Quiz"><Quiz onExit={() => go('practice')} /></div>;
  return (
    <div className="page wrap" data-screen-label="04 Practice">
      <header className="page-head">
        <Eyebrow>Fanazarana · practice</Eyebrow>
        <h1>Practice</h1>
        <p>A few minutes a day beats an hour once a week. Cards you get right come back less often; cards you miss come back sooner.</p>
      </header>
      <div className="practice-grid">
        <div className="practice-main">
          <button className="pr-card big" onClick={() => go('practice/cards')}>
            <div>
              <Eyebrow>Karatra · flashcards</Eyebrow>
              <h2>{due ? `${due} card${due > 1 ? 's' : ''} due` : cards.length ? 'All caught up' : 'No cards yet'}</h2>
              <p>{cards.length ? `${cards.length} words in your deck. Spaced repetition across 5 boxes.` : 'Finish a lesson or tap + in the phrasebook to add words.'}</p>
            </div>
            <span className="btn btn-primary">{due ? 'Review now' : 'Open'} {Ico.arrow(12)}</span>
          </button>
          <button className="pr-card" onClick={() => go('practice/quiz')}>
            <div>
              <Eyebrow>Fanadinana · quiz</Eyebrow>
              <h2>10-question quiz</h2>
              <p>Read, translate and listen, drawn from every lesson.</p>
            </div>
            <span className="btn btn-ghost">Start {Ico.arrow(12)}</span>
          </button>
          {cards.length > 0 && (
            <div className="deck-list">
              <div className="pp-row"><b>Your deck</b><span className="muted">{cards.length} words</span></div>
              <div className="deck-items">
                {cards.slice(0, 40).map((c) => (
                  <div key={c.mg} className="deck-item"><span lang="mg">{c.mg}</span><span className="muted">{c.en}</span><i className={`dot b${c.box}`} title={`Box ${c.box}`} /></div>
                ))}
              </div>
            </div>
          )}
        </div>
        <ProgressPanel />
      </div>
    </div>
  );
}

Object.assign(window, { Practice, ProgressPanel });
