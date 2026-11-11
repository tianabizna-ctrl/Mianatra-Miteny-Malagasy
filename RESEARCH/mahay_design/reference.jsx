/* MAHAY — phrasebook, sounds, grammar, culture, resources */

function Phrasebook({ sub }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(sub || D.phrasebook[0].id);
  useEffect(() => { if (sub) setCat(sub); }, [sub]);
  const results = q.trim()
    ? D.phrasebook.flatMap((c) => c.items.filter((i) => (i.mg + ' ' + i.en).toLowerCase().includes(q.toLowerCase())))
    : (D.phrasebook.find((c) => c.id === cat) || D.phrasebook[0]).items;
  const cur = D.phrasebook.find((c) => c.id === cat);
  return (
    <div className="page wrap" data-screen-label="05 Phrasebook">
      <header className="page-head">
        <Eyebrow>Fitenenana · phrasebook</Eyebrow>
        <h1>Phrasebook</h1>
        <p>Organised by situation. Tap ▶ to listen, ⏩ for slow, and + to add a phrase to your flashcards.</p>
      </header>
      <div className="pb-layout">
        <nav className="pb-nav">
          <input className="search" placeholder="Search English or Malagasy…" value={q} onChange={(e) => setQ(e.target.value)} />
          {D.phrasebook.map((c) => (
            <button key={c.id} className={`pb-cat ${c.id === cat && !q ? 'on' : ''}`} onClick={() => { setQ(''); setCat(c.id); }}>
              <span>{c.title}</span><span className="pb-cat-mg" lang="mg">{c.mg}</span>
            </button>
          ))}
        </nav>
        <div className="pb-list">
          <h2 className="pb-list-h">{q ? `Results for “${q}”` : cur.title}</h2>
          {results.length === 0 && <p className="muted">No phrases found.</p>}
          {results.map((it) => <Phrase key={it.mg} item={it} addable />)}
          <p className="pb-note">Speaking to an elder or official? Add <b lang="mg">tompoko</b> at the end of any phrase.</p>
        </div>
      </div>
    </div>
  );
}

function Sounds() {
  const [si, setSi] = useState(0);
  const w = D.sounds.stress[si];
  return (
    <div className="page wrap" data-screen-label="06 Sounds">
      <header className="page-head">
        <Eyebrow>Fanononana · pronunciation</Eyebrow>
        <h1>Sounds & stress</h1>
        <p>21 letters, no C, Q, W or X. Spelling is regular, so once you know the rules you can read any word aloud.</p>
      </header>

      <section className="snd-sec">
        <h2>The alphabet</h2>
        <div className="alpha">{D.sounds.letters.map((l) => <button key={l} onClick={() => Speech.speak(l.toLowerCase())}>{l}</button>)}</div>
      </section>

      <section className="snd-sec two">
        <div>
          <h2>Vowels</h2>
          <div className="snd-list">{D.sounds.vowels.map((v) => <SoundRow key={v.l} s={v} />)}</div>
        </div>
        <div>
          <h2>Tricky consonants</h2>
          <div className="snd-list">{D.sounds.consonants.map((v) => <SoundRow key={v.l} s={v} />)}</div>
        </div>
      </section>

      <section className="snd-sec stress-sec">
        <div>
          <h2>Stress & silent endings</h2>
          <p>Stress usually falls on the <b>second-to-last syllable</b>. When a word ends in <b>-tra, -ka or -na</b>, that last syllable is barely spoken, and a final <b>-y</b> or <b>-o</b> often fades completely.</p>
          <div className="legend"><span className="st-on">stressed</span><span className="st-weak">swallowed</span></div>
        </div>
        <div className="stress-demo">
          <div className="sd-word"><StressWord w={w} big /></div>
          <div className="sd-meta"><span>{w.en}</span><SpeakBtn text={w.word} label="Listen" /><SpeakBtn text={w.word} slow /></div>
          <p className="sd-note">{w.note}</p>
          <div className="sd-picks">{D.sounds.stress.map((s, i) => <button key={s.word} className={i === si ? 'on' : ''} onClick={() => { setSi(i); Speech.speak(s.word); }} lang="mg">{s.word}</button>)}</div>
        </div>
      </section>

      <section className="snd-sec">
        <div className="callout">
          <b>About the audio.</b> Listening uses your browser’s built-in voice. Few browsers include a Malagasy voice, so MAHAY falls back to a similar-sounding one ({Speech.voiceName()}). Treat the phonetic spelling as your main guide, and use the native-speaker recordings in <a href="#/resources">Resources</a>.
        </div>
      </section>
    </div>
  );
}
function SoundRow({ s }) {
  const prefs = usePrefs();
  return (
    <div className="snd-row">
      <div className="snd-l" lang="mg">{s.l}</div>
      <div className="snd-say">{s.say}</div>
      <div className="snd-ex"><span lang="mg">{s.ex.mg}</span>{prefs.english && <span className="muted"> · {s.ex.en}</span>}</div>
      <SpeakBtn text={s.ex.mg} />
    </div>
  );
}

function VOSDemo({ demo }) {
  const [order, setOrder] = useState('mg');
  const parts = order === 'mg' ? demo.parts : [demo.parts[2], demo.parts[0], demo.parts[1]];
  return (
    <div className="vos">
      <div className="vos-row">
        {parts.map((p) => (
          <div key={p.t} className={`vos-part r-${p.r}`} style={{ viewTransitionName: 'vos-' + p.r }}>
            <div className="vos-tag">{p.r === 'V' ? 'Verb' : p.r === 'O' ? 'Object' : 'Subject'}</div>
            <div className="vos-word" lang={order === 'mg' ? 'mg' : undefined}>{order === 'mg' ? p.t : p.en}</div>
          </div>
        ))}
      </div>
      <div className="seg">
        <button className={order === 'mg' ? 'on' : ''} onClick={() => setOrder('mg')}>Malagasy (V-O-S)</button>
        <button className={order === 'en' ? 'on' : ''} onClick={() => setOrder('en')}>English (S-V-O)</button>
      </div>
    </div>
  );
}

function Grammar() {
  const [open, setOpen] = useState('vos');
  return (
    <div className="page wrap" data-screen-label="07 Grammar">
      <header className="page-head">
        <Eyebrow>Fitsipi-pitenenana · grammar</Eyebrow>
        <h1>Grammar notes</h1>
        <p>No genders, no plurals, no verb conjugation by person. Malagasy grammar is mostly about word order and prefixes. These notes explain the patterns you meet in the lessons.</p>
      </header>
      <div className="gram-list">
        {D.grammar.map((g) => (
          <article key={g.id} className={`gram ${open === g.id ? 'open' : ''}`}>
            <button className="gram-head" onClick={() => setOpen(open === g.id ? null : g.id)}>
              <span className="gram-tag">{g.tag}</span>
              <span className="gram-title">{g.title}</span>
              <span className="gram-tog">{open === g.id ? '–' : '+'}</span>
            </button>
            {open === g.id && (
              <div className="gram-body">
                {g.body && <p>{g.body}</p>}
                {g.demo && <VOSDemo demo={g.demo} />}
                {g.tense && (
                  <div className="tense-row">
                    {g.tense.map((t) => (
                      <div key={t.k} className="tense">
                        <div className="tense-k">{t.k}</div>
                        <div className="tense-mg" lang="mg"><b>{t.mg[0]}</b>{t.mg.slice(1)}</div>
                        <div className="muted">{t.en}</div>
                        <SpeakBtn text={t.mg} />
                      </div>
                    ))}
                  </div>
                )}
                {g.table && (
                  <table className="gtable"><tbody>
                    {g.table.map((r) => <tr key={r[0]}><td lang="mg"><b>{r[0]}</b></td><td>{r[1]}</td>{r[2] && <td lang="mg" className="muted">{r[2]}</td>}<td className="td-play"><SpeakBtn text={r[2] || r[0]} /></td></tr>)}
                  </tbody></table>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function Culture() {
  return (
    <div className="page wrap" data-screen-label="08 Culture">
      <header className="page-head">
        <Eyebrow>Kolontsaina · culture</Eyebrow>
        <h1>Culture notes</h1>
        <p>Knowing a few customs makes every conversation warmer, and helps you avoid stepping on a fady.</p>
      </header>
      <div className="cult-list">
        {D.culture.map((c, i) => (
          <article key={c.id} className={`cult-row ${i % 2 ? 'flip' : ''}`}>
            <Photo src={c.img} alt={c.sub} />
            <div>
              <Eyebrow>{c.sub}</Eyebrow>
              <h2 lang="mg">{c.title} <SpeakBtn text={c.title} /></h2>
              <p>{c.body}</p>
            </div>
          </article>
        ))}
      </div>
      <section className="snd-sec">
        <h2>Family terms</h2>
        <p className="muted">Siblings are named by age and by the speaker’s gender. Elders are often called <b lang="mg">ray aman-dreny</b>, “fathers and mothers”, as a mark of respect.</p>
        <div className="vocab-grid">{D.family.map((v) => <Phrase key={v.mg} item={v} size="sm" addable />)}</div>
      </section>
    </div>
  );
}

function Resources() {
  return (
    <div className="page wrap" data-screen-label="09 Resources">
      <header className="page-head">
        <Eyebrow>Loharano · resources</Eyebrow>
        <h1>Go further</h1>
        <p>Trusted courses and tools for the next step. All links open on the original site.</p>
      </header>
      <div className="res-grid">
        {D.resources.map((r) => r.url ? (
          <a key={r.title} className="ext-card" href={r.url} target="_blank" rel="noopener">
            <div className="ext-by">{r.by}</div>
            <div className="ext-title">{r.title} {Ico.ext()}</div>
            <div className="ext-desc">{r.desc}</div>
          </a>
        ) : (
          <div key={r.title} className="ext-card pending">
            <div className="ext-by">{r.by}</div>
            <div className="ext-title">{r.title}</div>
            <div className="ext-desc">{r.desc}</div>
          </div>
        ))}
      </div>
      <p className="credit">Lesson content adapted from <a href="https://bako.blog/" target="_blank" rel="noopener">Learning Malagasy with Bako</a>, with dialect forms converted to official Malagasy. Photos: Flickr / PxHere (Creative Commons).</p>
    </div>
  );
}

Object.assign(window, { Phrasebook, Sounds, Grammar, Culture, Resources });
