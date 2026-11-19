# Official Malagasy course extensions

## What was added

The local source collection contains **61 PDFs and 206 pages**:

| Source group | PDFs | Pages |
|---|---:|---:|
| Introductory | 8 | 19 |
| Grammar | 29 | 105 |
| Thematic | 24 | 82 |

Every PDF is mapped to one course lesson. The app presents a unified Salama!
curriculum without source-author labels, page counts or adaptation commentary.
The full text layer, diagram OCR and source mapping remain separate research
records, not learner-facing data.

| Learning pathway | Lessons | Placement |
|---|---:|---|
| Beginner | 26 | Reinforcement alongside the existing 12-week course |
| Intermediate | 27 | Longer daily situations, questions, connectors, tenses and possession |
| Advanced grammar | 8 | Superlatives, ownership chains, precise time/place, patient voice 16A/16B/16D and the 11D hospital route |

The advanced pathway is an advanced-grammar extension, not a complete advanced
proficiency course or a CEFR certification. Levels are open for exploration;
prerequisites are guidance, not automatic mastery gates.

Each lesson includes teaching notes, Official Malagasy vocabulary, translated
examples, untranslated reading, a writing/roleplay prompt, and answer-comparison
drills. The farmer's routine and hospital-route dialogue retain their original
situations. The family diagram was rebuilt with Official Malagasy labels.

## Official-language policy

The owner's requirement is **Official Malagasy only in the learning interface**.
Keep the situation from the source, but select its Official Malagasy form or
rewrite the complete construction where changing a word alone is insufficient.

Examples: `ino → inona`, `akory → ahoana`, `Dadilahy → Dadabe`, `zaho → aho`,
`fontsy → akondro`, and `ndreky → sy`. Retain the appropriate Official Malagasy
sentence pattern, such as `Faly no anarako`, rather than only swapping nouns.
Do not show both variants to learners.

Do not globally replace `antsika`: it is a valid Official Malagasy object or
possessive form. In subject position use `isika` when appropriate. Likewise,
do not reinterpret reduplication as a universal comparative, or apply the active
`m-/n-/h-` tense pattern mechanically to patient-voice verbs.

The new course material has not been certified through native-speaker review.
Corrections belong in `study_curriculum.py`; the data is reproducible.

The existing dataset already has its Official Malagasy conversion applied.
Its stable IDs sometimes retain historical dialect names. These IDs are
internal references, not teaching text: do not rename them or break the owner's
recordings, pronunciation edits or stored progress.

## Runtime architecture

- `APP/data/study.js`: generated, independent `window.STUDY_CONTENT` dataset.
- `APP/js/study-core.js`: matching, lesson lookup and extended-course progress.
- `APP/js/views/study-hub.js`: level catalogue, skills sidebar and filters.
- `APP/js/views/study-lesson.js`: reading, vocabulary, writing, drills, listening
  and speaking activities.
- `APP/study.css`: responsive styles using the existing light/dark tokens.
- `RESEARCH/study_curriculum.py`: editable teaching material and level assignments.
- `RESEARCH/BAKO_SOURCE_MANIFEST.json`: all source files, page counts and SHA-256s.

Routes:

| Route | Purpose |
|---|---|
| `#/learn` | All levels and lesson catalogue |
| `#/learn/beginner`, `#/learn/intermediate`, `#/learn/advanced` | Ordered pathway |
| `#/skills`, `#/skills/grammar` etc. | Seven skills, including verb forms |
| `#/study/gram_16b/read` | One course lesson |
| `#/study/:id/words`, `/write`, `/drills`, `/listen`, `/speak` | Lesson activities |

The original 36 sessions are unchanged. Related-week links connect source
lessons to the existing course; dedicated topics include home, school, chores,
jobs, transport and daily routines. The complete source/level/skill map is
generated in `COURSE_CURRICULUM_MAP.md`. Source details are not shipped in
`APP/data/study.js`.

## Progress and audio

`salama_state_v3.study` contains `completed`, `drafts` and `checks`. It is included
in export, validated on import, and cleared by the existing reset action. Old
backups without this field still restore correctly. Unknown lesson IDs, invalid
scores and drafts longer than 8,000 characters are rejected or bounded.

"Studied" is a learner's own completion marker, separate from vocabulary
mastery, beginner-session completion or drill results. Drills compare to sample
answers, ignoring punctuation, case, apostrophe style and extra spaces. A valid
alternative translation may not match; the interface says so. Free writing is
saved, escaped on rendering, and not automatically graded.

Listening reuses existing word clips with matching Official Malagasy text and
meaning. No embedded regional recording is relabelled as Official Malagasy.
New lesson sentences have no new generated or native-speaker recordings.
The recording-studio link targets an existing dictionary word, not an invented
free-form recording feature.

The full new dataset and UI are small enough to precache on install. Service
worker `salama-v4.6.6` matches versioned asset requests against the shell cache
offline. Uncached non-navigation assets return an error, not HTML disguised as
JavaScript or audio. Recorded audio retains the app's cache-on-play behaviour.

## Extract and rebuild

For the initial text/diagram extraction, install PyMuPDF in your research Python
environment. The original PDFs remain read-only. On macOS, Vision supplies OCR;
Malagasy dictionary autocorrection is deliberately disabled.

```bash
python3 RESEARCH/extract_bako.py /Users/tianaalbert/bako_pdfs --ocr-dir /path/to/local/ocr-pages
swift RESEARCH/bako_ocr.swift /path/to/local/ocr-pages RESEARCH/BAKO_OCR.json
python3 RESEARCH/extract_bako.py /Users/tianaalbert/bako_pdfs --ocr-json RESEARCH/BAKO_OCR.json
```

`BAKO_EXTRACTED.json` keeps exact page text and a separate, uncorrected `ocrText`
field. `BAKO_OCR.json` has 206 page results, including labels embedded in diagrams.
These two files are local and gitignored. They are not copied into `APP/`.

Normal curriculum changes require no PDF or OCR dependency:

```bash
python3 RESEARCH/build_study_data.py
python3 RESEARCH/test_study_content.py
node RESEARCH/test_study.js
node RESEARCH/smoke_app.js
```

Optional real-browser regression check (Node 22+, installed Chrome, local app
server running; no npm dependencies):

```bash
node RESEARCH/test_study_browser.mjs http://127.0.0.1:8790
```

It uses isolated Chrome profiles and real emulated 390px/1440px viewports,
checks the learning flows and reloads a lesson with the page and service-worker
networks disabled. Set `BAKO_CAPTURE=1` for screenshots in a temporary folder,
not the repository. Captures are optional because headless macOS Chrome can
stall its compositor even when layout and learning-flow checks pass.

**Do not rebuild `APP/data/content.js` for this feature.** The older base
generator does not reproduce all current roleplays, explicit session word lists
or custom-voice mappings. Reading it as a dependency preserves those additions;
regenerating it blindly would discard them.

## Publication permission and product copy

On 19 November 2026 the maintainer confirmed permission to publish the course
material and requested removal of product-facing source and adaptation labels.
The app therefore uses neutral Salama! course copy, with no author badges,
source-page metadata, "adapted from" statements or claims that reference
material was created from scratch.

The source collection is Bako's lesson material. Its provenance remains in the
research inventory and course map for maintenance. The almost 484 MiB of PDFs,
embedded recordings and full extracted text are not bundled into the app.
Existing licensing notices for other referenced material and speech models
remain in the repository; they are not replaced by the course publication
permission. Both `index.html` and `fresh.html` load the same branded course data.

## Verification and baseline limits

New content gates cover all 61 source mappings, 206 pages, level/skill assignments,
Official-only forms, original situations, valid dictionary/audio references and
offline shell assets. JS checks cover completion, drafts, drills, filters,
escaping, reload, import/reset and legacy backups. The existing smoke suite also
renders every new lesson activity.

The unchanged base checks have pre-existing failures: `validate_content.py`
expects string pronunciations but encounters list-valued pronunciations; three
`test_pronunciation.py` assertions disagree with the current stress table and
conflict list. `check_parity.py` passes. These are not repaired by rebuilding the
base dataset or relaxing the new content gates.
