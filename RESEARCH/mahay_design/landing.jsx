/* MAHAY — landing / home */

function StressWord({ w, big }) {
  return (
    <span className={`stress ${big ? 'big' : ''}`} lang="mg">
      {w.syl.map((s, i) => (
        <span key={i} className={i === w.s ? 'st-on' : i === w.weak ? 'st-weak' : ''}>{s}</span>
      ))}
    </span>
  );
}

function WordOfDay() {
  const idx = Math.floor(Date.now() / 86400000) % D.wordOfDay.length;
  const w = D.wordOfDay[idx];
  const prefs = usePrefs();
  return (
    <div className="wod">
      <Eyebrow>Teny androany · word of the day</Eyebrow>
      <div className="wod-row">
        <div>
          <div className="wod-mg" lang="mg">{w.mg}</div>
          {prefs.phonetic && <div className="phrase-phon">{w.phon}</div>}
          <div className="wod-en">{w.en}</div>
        </div>
        <SpeakBtn text={w.mg} size="lg" />
      </div>
    </div>
  );
}

function ContinueCard() {
  const { p } = useProgress();
  const next = D.lessons.find((l) => !p.completed[l.id]) || D.lessons[D.lessons.length - 1];
  const done = Object.keys(p.completed).length;
  const due = Object.values(p.cards).filter((c) => c.due <= todayStr()).length;
  if (!done && !p.xp) return null;
  return (
    <section className="wrap continue">
      <div className="continue-card">
        <div className="cc-main">
          <Eyebrow>Tohizo · continue</Eyebrow>
          <h3>Lesson {next.n}: {next.title}</h3>
          <div className="cc-mg" lang="mg">{next.mgTitle}</div>
          <button className="btn btn-primary" onClick={() => go('lesson/' + next.id)}>Resume {Ico.arrow()}</button>
        </div>
        <div className="cc-stats">
          <div><b>{p.streak}</b><span>day streak</span></div>
          <div><b>{done}/{D.lessons.length}</b><span>lessons</span></div>
          <div><b>{due}</b><span>cards due</span></div>
          <div><b>{p.xp}</b><span>XP</span></div>
        </div>
      </div>
    </section>
  );
}

function Landing({ direction }) {
  const { p } = useProgress();
  const [stressIdx, setStressIdx] = useState(0);
  const w = D.sounds.stress[stressIdx];
  const started = Object.keys(p.completed).length > 0 || p.xp > 0;

  return (
    <div className="landing" data-screen-label="01 Home">
      {/* HERO */}
      <section className={`hero hero-${direction}`}>
        <div className="hero-media"><img src={direction === 'raffia' ? 'img/highlands.jpg' : 'img/baobab-avenue.jpg'} alt="Baobab trees at dusk, Madagascar" /></div>
        <div className="hero-inner wrap">
          <div className="hero-copy">
            <Eyebrow>Mahay · <i>“to know how”</i></Eyebrow>
            <h1>Speak Malagasy,<br /><em lang="mg">mora mora.</em></h1>
            <p className="lede">Short lessons, real conversations and a phrasebook you’ll actually use, for travellers, volunteers and anyone curious about the language of Madagascar.</p>
            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={() => go(started ? 'learn' : 'lesson/greetings')}>
                {started ? 'Continue learning' : 'Start lesson 1, free'} {Ico.arrow()}
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => go('phrasebook')}>Open the phrasebook</button>
            </div>
          </div>
          <div className="hero-side"><WordOfDay /></div>
        </div>
      </section>

      <ContinueCard />

      {/* WHAT YOU'LL SAY */}
      <section className="wrap band">
        <div className="band-head">
          <Eyebrow>Ny dianao · your path</Eyebrow>
          <h2>From <span lang="mg">Salama</span> to full sentences.</h2>
          <p>Eight lessons in three units. Each one has dialogues, key words, culture notes and a short practice round. Words you learn go straight into your flashcards.</p>
        </div>
        <div className="unit-strip">
          {D.units.map((u) => {
            const ls = D.lessons.filter((l) => l.unit === u.n);
            const done = ls.filter((l) => p.completed[l.id]).length;
            return (
              <button key={u.n} className="unit-tile" onClick={() => go('learn')}>
                <div className="ut-n">Unit {u.n}</div>
                <div className="ut-title">{u.title}</div>
                <div className="ut-mg" lang="mg">{u.mg}</div>
                <ul>{ls.map((l) => <li key={l.id} className={p.completed[l.id] ? 'done' : ''}>{l.title}</li>)}</ul>
                <ProgressBar value={done} max={ls.length} />
              </button>
            );
          })}
        </div>
      </section>

      {/* SOUND TEASER */}
      <section className="sound-band">
        <div className="wrap sound-grid">
          <div>
            <Eyebrow>Feo · sound</Eyebrow>
            <h2>It’s spelled the way it sounds, almost.</h2>
            <p>Malagasy spelling is very regular. The tricky part is stress: words ending in <b>-tra, -ka, -na</b>, <b>-y</b> or <b>-o</b> swallow that last syllable. Tap a word to hear it.</p>
            <button className="btn btn-ghost" onClick={() => go('sounds')}>Full pronunciation guide {Ico.arrow()}</button>
          </div>
          <div className="stress-demo">
            <div className="sd-word"><StressWord w={w} big /></div>
            <div className="sd-meta"><span>{w.en}</span><SpeakBtn text={w.word} label="Listen" /></div>
            <p className="sd-note">{w.note}</p>
            <div className="sd-picks">
              {D.sounds.stress.map((s, i) => (
                <button key={s.word} className={i === stressIdx ? 'on' : ''} onClick={() => { setStressIdx(i); Speech.speak(s.word); }} lang="mg">{s.word}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SITUATIONS */}
      <section className="wrap band">
        <div className="band-head row">
          <div>
            <Eyebrow>Fitenenana · phrasebook</Eyebrow>
            <h2>Ready for the taxi-brousse.</h2>
          </div>
          <button className="btn btn-ghost" onClick={() => go('phrasebook')}>All situations {Ico.arrow()}</button>
        </div>
        <div className="sit-grid">
          {D.phrasebook.slice(0, 6).map((s) => (
            <button key={s.id} className="sit-tile" onClick={() => go('phrasebook/' + s.id)}>
              <div className="sit-mg" lang="mg">{s.mg}</div>
              <div className="sit-title">{s.title}</div>
              <div className="sit-sample" lang="mg">“{s.items[0].mg}”</div>
              <div className="sit-count">{s.items.length} phrases</div>
            </button>
          ))}
        </div>
      </section>

      {/* CULTURE */}
      <section className="culture-band">
        <div className="wrap">
          <div className="band-head row">
            <div>
              <Eyebrow>Kolontsaina · culture</Eyebrow>
              <h2>Language is more than words.</h2>
            </div>
            <button className="btn btn-ghost" onClick={() => go('culture')}>Culture notes {Ico.arrow()}</button>
          </div>
          <div className="cult-grid">
            {D.culture.slice(0, 3).map((c) => (
              <button key={c.id} className="cult-tile" onClick={() => go('culture')}>
                <Photo src={c.img} alt={c.sub} />
                <div className="cult-cap">
                  <div className="cult-title" lang="mg">{c.title}</div>
                  <div className="cult-sub">{c.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* WHO FOR */}
      <section className="wrap band who">
        {[
          ['Travellers', 'Greet people, bargain at the market, find the toilet and get to Morondava.', 'phrasebook'],
          ['Volunteers & NGO workers', 'Build real conversation skills, with grammar that explains the why, and the cultural know-how to settle in well.', 'grammar'],
          ['Language lovers', 'VOS word order, verbs that switch tense with a single letter, and numbers read right to left.', 'grammar'],
        ].map(([t, d, r]) => (
          <div key={t} className="who-col">
            <h3>{t}</h3>
            <p>{d}</p>
            <button className="link" onClick={() => go(r)}>Start here {Ico.arrow(12)}</button>
          </div>
        ))}
      </section>
    </div>
  );
}

Object.assign(window, { Landing, StressWord });
