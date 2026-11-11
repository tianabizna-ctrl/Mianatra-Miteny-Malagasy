/* MAHAY — course map + lesson player */

function CourseMap() {
  const { p } = useProgress();
  const firstOpen = D.lessons.find((l) => !p.completed[l.id]);
  return (
    <div className="page wrap" data-screen-label="02 Learn">
      <header className="page-head">
        <Eyebrow>Mianatra · learn</Eyebrow>
        <h1>Your course</h1>
        <p>Official Malagasy, the variety taught in schools and understood across the island. Where it helps, we note the regional variants you’ll hear.</p>
      </header>
      {D.units.map((u) => (
        <section key={u.n} className="unit">
          <div className="unit-head">
            <div className="unit-n">{String(u.n).padStart(2, '0')}</div>
            <div>
              <h2>{u.title} <span lang="mg">· {u.mg}</span></h2>
              <p>{u.desc}</p>
            </div>
          </div>
          <div className="lesson-grid">
            {D.lessons.filter((l) => l.unit === u.n).map((l) => {
              const done = !!p.completed[l.id];
              const isNext = firstOpen && firstOpen.id === l.id;
              return (
                <button key={l.id} className={`lesson-card ${done ? 'done' : ''} ${isNext ? 'next' : ''}`} onClick={() => go('lesson/' + l.id)}>
                  <Photo src={l.img} alt="" />
                  <div className="lc-body">
                    <div className="lc-top"><span>Lesson {l.n}</span><span>{l.level} · {l.minutes} min</span></div>
                    <div className="lc-title">{l.title}</div>
                    <div className="lc-mg" lang="mg">{l.mgTitle}</div>
                    <div className="lc-foot">
                      {done ? <span className="tag ok">{Ico.check(11)} Completed</span> : isNext ? <span className="tag next">Up next</span> : <span className="tag">{l.vocab.length} words</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <section className="unit more">
        <div className="unit-head">
          <div className="unit-n">+</div>
          <div>
            <h2>Keep going</h2>
            <p>Go further with the free materials these lessons build on.</p>
          </div>
        </div>
        <div className="more-links">
          {D.resources.slice(0, 3).map((r) => (
            <a key={r.url} className="ext-card" href={r.url} target="_blank" rel="noopener">
              <div className="ext-title">{r.title} {Ico.ext()}</div>
              <div className="ext-desc">{r.desc}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- lesson player ---------- */
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function DialogueStep({ d }) {
  const [shown, setShown] = useState(1);
  const [speaking, speak] = useSpeak();
  const playAll = () => {
    let i = 0; setShown(d.lines.length);
    const next = () => { if (i >= d.lines.length) return; const l = d.lines[i++]; Speech.speak(l.mg, { onend: () => setTimeout(next, 450) }); };
    next();
  };
  return (
    <div className="dialogue">
      <div className="dlg-head">
        <h3>{d.title}</h3>
        <button className="btn btn-ghost btn-sm" onClick={playAll}>{Ico.play(11)} Play conversation</button>
      </div>
      <div className="dlg-lines">
        {d.lines.slice(0, shown).map((l, i) => (
          <div key={i} className={`dlg-line ${i % 2 ? 'r' : 'l'}`}>
            <Phrase item={l} who={l.who} addable />
            <div className="dlg-rec"><RecordBtn text={l.mg} /></div>
          </div>
        ))}
      </div>
      {shown < d.lines.length && (
        <button className="btn btn-soft" onClick={() => { setShown(shown + 1); Speech.speak(d.lines[shown].mg); }}>Next line {Ico.arrow(12)}</button>
      )}
    </div>
  );
}

function BuildExercise({ sentence, onDone }) {
  const words = useMemo(() => sentence.replace(/[.?!]/g, '').split(' '), [sentence]);
  const [pool, setPool] = useState(() => shuffle(words.map((w, i) => ({ w, i }))));
  const [picked, setPicked] = useState([]);
  const [state, setState] = useState(null);
  const check = () => {
    const ok = picked.map((x) => x.w).join(' ') === words.join(' ');
    setState(ok ? 'ok' : 'no');
    if (ok) { Speech.speak(sentence); onDone(true); }
  };
  return (
    <div className={`build ${state || ''}`}>
      <div className="build-slot">
        {picked.length === 0 && <span className="muted">Tap words in order…</span>}
        {picked.map((x) => <button key={x.i} className="chip on" onClick={() => { setPicked(picked.filter((y) => y !== x)); setPool([...pool, x]); setState(null); }} lang="mg">{x.w}</button>)}
      </div>
      <div className="build-pool">
        {pool.map((x) => <button key={x.i} className="chip" onClick={() => { setPool(pool.filter((y) => y !== x)); setPicked([...picked, x]); setState(null); }} lang="mg">{x.w}</button>)}
      </div>
      <div className="build-foot">
        {state === 'ok' && <span className="fb ok">{Ico.check(13)} Tsara be! Very good!</span>}
        {state === 'no' && <span className="fb no">Not quite. Remember: the subject goes at the end.</span>}
        {state !== 'ok' && <button className="btn btn-primary btn-sm" disabled={pool.length > 0} onClick={check}>Check</button>}
      </div>
    </div>
  );
}

function MatchExercise({ vocab, onDone }) {
  const set = useMemo(() => shuffle(vocab).slice(0, 5), [vocab]);
  const right = useMemo(() => shuffle(set), [set]);
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);
  const pickRight = (r) => {
    if (!sel || matched[r.mg]) return;
    if (sel.mg === r.mg) { const m = { ...matched, [r.mg]: true }; setMatched(m); setSel(null); if (Object.keys(m).length === set.length) onDone(true); }
    else { setWrong(r.mg); setTimeout(() => setWrong(null), 500); }
  };
  return (
    <div className="match">
      <div className="match-col">
        {set.map((v) => (
          <button key={v.mg} lang="mg" className={`chip wide ${matched[v.mg] ? 'matched' : ''} ${sel === v ? 'sel' : ''}`} disabled={matched[v.mg]}
            onClick={() => { setSel(v); Speech.speak(v.mg); }}>{v.mg}</button>
        ))}
      </div>
      <div className="match-col">
        {right.map((v) => (
          <button key={v.mg} className={`chip wide en ${matched[v.mg] ? 'matched' : ''} ${wrong === v.mg ? 'shake' : ''}`} disabled={matched[v.mg]}
            onClick={() => pickRight(v)}>{v.en}</button>
        ))}
      </div>
    </div>
  );
}

function LessonPlayer({ id }) {
  const lesson = D.lessons.find((l) => l.id === id) || D.lessons[0];
  const prog = useProgress();
  const steps = useMemo(() => [
    { k: 'intro', label: 'Intro' },
    ...lesson.dialogues.map((d, i) => ({ k: 'dlg', i, label: `Dialogue ${i + 1}` })),
    { k: 'vocab', label: 'Words' },
    { k: 'notes', label: 'Notes' },
    { k: 'match', label: 'Match' },
    ...lesson.build.map((s, i) => ({ k: 'build', i, label: 'Build' })),
    { k: 'done', label: 'Done' },
  ], [lesson]);
  const SKEY = 'mahay.lessonstep.' + lesson.id;
  const [step, setStep] = useState(() => Math.min(+localStorage.getItem(SKEY) || 0, steps.length - 1));
  const [canNext, setCanNext] = useState(true);
  useEffect(() => { localStorage.setItem(SKEY, step); }, [step]);
  useEffect(() => { const k = steps[step].k; setCanNext(!(k === 'match' || k === 'build')); }, [step]);
  const s = steps[step];

  const next = () => {
    if (s.k === 'match' || s.k === 'build') prog.addXp(5);
    if (steps[step + 1] && steps[step + 1].k === 'done') { prog.completeLesson(lesson.id, lesson.vocab); prog.addXp(20); }
    setStep(Math.min(step + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const nextLesson = D.lessons[D.lessons.indexOf(lesson) + 1];

  return (
    <div className="player" data-screen-label={`03 Lesson ${lesson.n}`}>
      <div className="player-bar">
        <div className="wrap pb-inner">
          <button className="icon-btn" onClick={() => go('learn')} aria-label="Back to course">{Ico.back(16)}</button>
          <div className="pb-title"><span>Lesson {lesson.n}</span> {lesson.title}</div>
          <div className="pb-steps">
            {steps.map((x, i) => <button key={i} title={x.label} className={i === step ? 'cur' : i < step ? 'past' : ''} onClick={() => i <= step && setStep(i)} />)}
          </div>
        </div>
      </div>

      <div className="wrap player-body">
        {s.k === 'intro' && (
          <div className="p-intro">
            <Photo src={lesson.img} alt="" className="p-intro-img" />
            <div>
              <Eyebrow>Lesson {lesson.n} · {lesson.level}</Eyebrow>
              <h1>{lesson.title}</h1>
              <div className="p-mg" lang="mg">{lesson.mgTitle} <SpeakBtn text={lesson.mgTitle} /></div>
              <p className="lede">{lesson.intro}</p>
              <ul className="p-outline">
                <li>{lesson.dialogues.length} dialogues</li><li>{lesson.vocab.length} key words</li><li>{lesson.notes.length} notes</li><li>~{lesson.minutes} min</li>
              </ul>
            </div>
          </div>
        )}

        {s.k === 'dlg' && <DialogueStep key={s.i} d={lesson.dialogues[s.i]} />}

        {s.k === 'vocab' && (
          <div>
            <div className="step-head"><Eyebrow>Voambolana · vocabulary</Eyebrow><h2>Key words</h2><p>These will be added to your flashcards when you finish the lesson.</p></div>
            <div className="vocab-grid">{lesson.vocab.map((v) => <Phrase key={v.mg} item={v} size="sm" />)}</div>
          </div>
        )}

        {s.k === 'notes' && (
          <div>
            <div className="step-head"><Eyebrow>Fanamarihana · notes</Eyebrow><h2>Good to know</h2></div>
            <div className="notes-grid">
              {lesson.notes.map((n) => (
                <article key={n.title} className={`note note-${n.kind.toLowerCase()}`}>
                  <div className="note-kind">{n.kind}</div>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {s.k === 'match' && (
          <div>
            <div className="step-head"><Eyebrow>Fampiharana · practice</Eyebrow><h2>Match the pairs</h2><p>Tap a Malagasy word, then its meaning.</p></div>
            <MatchExercise vocab={lesson.vocab} onDone={() => setCanNext(true)} />
          </div>
        )}

        {s.k === 'build' && (
          <div>
            <div className="step-head"><Eyebrow>Fampiharana · practice</Eyebrow><h2>Build the sentence</h2>
              <p className="build-en">“{(lesson.dialogues.flatMap((d) => d.lines).find((l) => l.mg === lesson.build[s.i]) || {}).en}”</p></div>
            <BuildExercise key={s.i} sentence={lesson.build[s.i]} onDone={() => setCanNext(true)} />
          </div>
        )}

        {s.k === 'done' && (
          <div className="p-done">
            <div className="done-mark">{Ico.check(36)}</div>
            <h1 lang="mg">Arahaba! Vita!</h1>
            <p className="lede">Congratulations, lesson {lesson.n} is complete. {lesson.vocab.length} words were added to your flashcards.</p>
            <div className="done-stats">
              <div><b>+{20 + 5 * (1 + lesson.build.length)}</b><span>XP</span></div>
              <div><b>{prog.p.streak}</b><span>day streak</span></div>
            </div>
            <div className="hero-cta center">
              {nextLesson && <button className="btn btn-primary btn-lg" onClick={() => { go('lesson/' + nextLesson.id); }}>Next: {nextLesson.title} {Ico.arrow()}</button>}
              <button className="btn btn-ghost btn-lg" onClick={() => go('practice')}>Review flashcards</button>
            </div>
          </div>
        )}
      </div>

      {s.k !== 'done' && (
        <div className="player-foot">
          <div className="wrap pf-inner">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>{Ico.back(12)} Back</button>
            <span className="pf-count">{step + 1} / {steps.length}</span>
            <button className="btn btn-primary" disabled={!canNext} onClick={next}>
              {steps[step + 1] && steps[step + 1].k === 'done' ? 'Finish lesson' : 'Continue'} {Ico.arrow(12)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CourseMap, LessonPlayer, shuffle });
