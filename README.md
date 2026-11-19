# Salama! — Learn Malagasy

An offline-first, installable web app for learning **Official Malagasy**.
The 12-week, 36-session beginner course has 2,198 dictionary entries,
712 phrases and 27 grammar topics. It also includes **61 skill lessons**:
26 beginner extensions, 27 intermediate lessons and 8 advanced-grammar lessons,
with a bilingual Skills menu and saved reading, writing and drill progress.
Static files only: no build step, no dependencies at runtime, no server logic.

<sub>UI version 4.6.6 · November 2026 · part of the Vahiny Mianatra Malagasy project</sub>

## Run it

```bash
cd APP
python3 -m http.server 8788
# open http://127.0.0.1:8788
```

Opening `APP/index.html` directly also works; only the offline cache needs `http(s)`.
Install it from the browser menu to get an app icon and offline use.

Open **Course → Explore learning levels**, or **Skills**. Learn Official Malagasy
through real-life situations, practical vocabulary and guided exercises.
See [the integration guide](RESEARCH/COURSE_INTEGRATION.md) for the curriculum map,
content maintenance, audio capabilities and validation.

## Reviewed by a native speaker

`PROOFREAD.html` is a review sheet (open it in a browser, no server needed) that
lists all 3,843 Malagasy entries — sentences, phrases, words, grammar examples and
notes — so a Malagasy speaker can mark ✔ / ✘ and type corrections. The export feeds
`RESEARCH/apply_corrections.py`; approved entries lose the *(approx.)* label and show
**✓ checked** in the app. See `RESEARCH/PROOFREADING.md`.

## Voices

Every word, phrase and dialogue sentence is spoken by **Abidi**
(abidi.artifisialy.mg), a Malagasy text-to-speech service — 3,377 clips, 28.6 MB.
A native speaker judged it markedly better than the Meta MMS voice the app used
before; the exceptions are pinned per entry in `RESEARCH/VOICE_MAP.json` (MMS reads
*veloma* correctly). Twelve dialogue lines are placeholders copied from the source
packs, not spoken Malagasy, and were deliberately left without a recording.
`RESEARCH/ABIDI.md` has the details, the licence state and the note to the service.

## What is in here

```
APP/                    the app itself (static)
  index.html            shell, inline SVG icons, script order
  styles.css            design tokens + all styling (no framework)
  app.js                router and header controls
  js/core.js            stored state, spaced repetition, progress selectors
  js/speech.js          rendered clips, Malagasy→voice adapter, syllable shaping
  js/ui.js              escaping, icons, toast, the shared Listen/Syllables controls
  js/views/*.js         one file per screen
  data/content.js       generated — do not edit by hand
  media/audio/          15 Peace Corps recordings + rendered words/ and lines/
  manifest.webmanifest  install metadata
  sw.js                 offline cache
RESEARCH/               the content pipeline, the audio renderer, and the checks
MALAGASY ASSETS/        source dictionaries and course material (unchanged)
extracted/              text extracted from those sources (unchanged)
```

## Validation

```bash
python3 RESEARCH/build_study_data.py     # rebuild the skill course; preserves existing customisations
python3 RESEARCH/test_study_content.py   # coverage, level assignments and Official-only vocabulary
node RESEARCH/test_study.js             # lesson progress, drafts, drills, import and reset
python3 RESEARCH/validate_content.py     # content and pronunciation gates
python3 RESEARCH/test_pronunciation.py   # 28 unit tests on the pronunciation rules
python3 RESEARCH/check_parity.py         # Python and JavaScript adapters must agree
node RESEARCH/smoke_app.js               # every screen renders, every handler runs
```

Do not blindly run the older base-data generator: it does not yet reproduce all
current session/voice customisations. The base content validator and three
pronunciation assertions have known pre-existing failures; details are in the
integration guide. The new course checks are separate.

## Audio, honestly

Three layers, tried in that order:

1. **A rendered Malagasy clip** (`media/audio/words/<id>.mp3`,
   `media/audio/lines/<dialogue>-<n>.mp3`) — spoken by Meta's MMS Malagasy model, so the
   pronunciation is Malagasy, not an accent of French.
2. **The best installed system voice**, with Malagasy rewritten into that language's
   spelling (`o`→`ou`, `j`→`dz`, `ao`→`ô`) and delivered one syllable at a time.
3. **The Peace Corps recordings**, which are the human reference for listening.

Two things are still true and are stated in the app: no device ships an *installed*
Malagasy voice, and **no native speaker has reviewed the pronunciation yet**. The review
sheet for that is `RESEARCH/pron_qa.html`; the ten questions worth asking first are in
`RESEARCH/SPEAKER_QUESTIONS.md`; the evidence behind every rule is in
`RESEARCH/PRONUNCIATION.md`.

Licences: session audio is public domain (Peace Corps); rendered word and line audio is
CC BY-NC 4.0 (Meta MMS) — free for personal, non-commercial use with attribution;
traveler phrases and the guide are CC BY-SA 3.0 (Wikivoyage). Details in `APP/README.md`.

## Licensing and technical references

Reference material includes Peace Corps Malagasy Language Lessons (public domain),
Rasoloson's Malagasy–English dictionary (for stress marks), Wikivoyage's Malagasy
phrasebook (CC BY-SA 3.0). Course publication permission is recorded in the
integration guide. Original course PDFs, embedded recordings and full extracted
text are not bundled into the public app.
