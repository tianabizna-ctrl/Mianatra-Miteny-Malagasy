#!/usr/bin/env python3
"""Build PROOFREAD.html — an interactive review & manual editing sheet.

    python3 RESEARCH/proofread.py

One self-contained page that lists every Malagasy sentence, phrase and word in the
course, biggest impact first:

  1. Sentences   — the 196 dialogue lines (what the learner actually says out loud)
  2. Phrases     — the 717 phrasebook entries
  3. Words       — the single words the 36 sessions teach, then the rest
  4. Grammar     — example sentences from the 27 grammar topics
  5. Notes       — the culture notes

Every row lets you:
  - Listen to the recording (▶)
  - Directly edit the **Malagasy** text and the **Phonetics** (and English / note) inline
  - Mark ✔ (marina), ? (tsy fantatro) or ✘ (diso)

Edits save immediately in the browser's localStorage (shared with the live Salama! app
so your manual edits appear immediately in the app too) and export as TSV.
"""
import base64
import json
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "PROOFREAD.html")


def load_content():
    path = os.path.join(BASE, "APP", "data", "content.js")
    raw = open(path, encoding="utf-8").read()
    return json.loads(raw[raw.index("{"):raw.rindex("}") + 1])


def taught_themes(data):
    themes = set()
    for session in data["sessions"]:
        themes.update(session.get("themes") or [])
    return themes


def build_rows(data):
    taught = taught_themes(data)
    rows = []

    # 1. Dialogue sentences — natural speech, used in the roleplay step.
    for dialogue in data["dialogues"]:
        for index, line in enumerate(dialogue["lines"]):
            rows.append({
                "key": "dlg:%s:%d" % (dialogue["id"], index),
                "section": "sentences",
                "mg": line.get("mg", ""),
                "en": line.get("en", ""),
                "audio": data.get("lineAudio", {}).get("%s-%d" % (dialogue["id"], index), ""),
                "pron": line.get("pron", ""),
                "where": dialogue.get("title", ""),
                "who": line.get("speaker", ""),
            })

    # 2. Phrasebook phrases.
    for phrase in data["phrases"]:
        rows.append({
            "key": "phrase:%s" % phrase["id"],
            "section": "phrases",
            "mg": phrase.get("mg", ""),
            "en": phrase.get("en", ""),
            "audio": data.get("phraseAudio", {}).get(phrase["id"], ""),
            "pron": phrase.get("pron", ""),
            "where": phrase.get("group", ""),
            "who": "",
        })

    # 3. Words: everything the sessions teach first, then the long tail.
    for word in sorted(data["vocabulary"],
                       key=lambda w: (0 if set(w.get("themes") or []) & taught else 1,
                                      w.get("level") or 1, w["mg"])):
        rows.append({
            "key": "word:%s" % word["id"],
            "section": "words",
            "mg": word.get("mg", ""),
            "en": word.get("en", ""),
            "audio": data.get("wordAudio", {}).get(word["id"], ""),
            "pron": word.get("pron", ""),
            "where": ", ".join((word.get("themes") or [])[:2]) if word.get("themes") else "",
            "who": "taught" if set(word.get("themes") or []) & taught else "",
        })

    # 4. Grammar example sentences.
    for topic in data["grammar"]:
        for rule_index, rule in enumerate(topic.get("rules", [])):
            for example_index, example in enumerate(rule.get("examples", [])):
                if not example.get("mg"):
                    continue
                rows.append({
                    "key": "gram:%s:%d:%d" % (topic["id"], rule_index, example_index),
                    "section": "grammar",
                    "mg": example["mg"],
                    "en": example.get("en", ""),
                    "audio": "",
                    "pron": example.get("pron", ""),
                    "where": topic.get("title", ""),
                    "who": rule.get("rule", "")[:70],
                })

    # 5. Culture notes (English prose that quotes Malagasy).
    for index, note in enumerate(data["culture"]):
        rows.append({
            "key": "culture:%d" % index,
            "section": "notes",
            "mg": note.get("note", ""),
            "en": "",
            "audio": "",
            "pron": "",
            "where": note.get("lesson", "").replace("_", " "),
            "who": "",
        })
    return rows


PAGE = r"""<!DOCTYPE html>
<html lang="mg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Salama! — Fanitsiana sy Famoahana (Edit Malagasy &amp; Phonetics)</title>
<style>
  :root {
    --ink:#241f1a; --paper:#faf6ef; --card:#fff; --line:#d8ccb8; --line-soft:#e9e0d0;
    --green:#14603a; --green-soft:#e8f2ec; --gold:#87550f; --red:#8c2f1e; --red-soft:#f7e0dc;
    --muted:#5b5044; --blue-soft:#eaf1f6; --blue:#1f4e6b;
  }
  * { box-sizing:border-box; }
  html { -webkit-text-size-adjust:100%; }
  body {
    margin:0; background:var(--paper); color:var(--ink);
    font:19px/1.55 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  a { color:var(--green); }

  /* ---------- header ---------- */
  header { position:sticky; top:0; z-index:20; background:var(--paper);
           border-bottom:2px solid var(--line); padding:10px 16px 8px; }
  .head-top { display:flex; flex-wrap:wrap; gap:10px; align-items:baseline; justify-content:space-between; }
  h1 { font-size:21px; margin:0; }
  .sub { font-size:15px; color:var(--muted); margin:0; }
  .progress { margin:8px 0 6px; height:9px; background:var(--line-soft); border-radius:99px; overflow:hidden; }
  .progress > i { display:block; height:100%; width:0; background:var(--green); transition:width .2s; }
  .bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  button, select, input, textarea { font:inherit; color:inherit; }
  .btn { background:var(--card); border:2px solid var(--line); border-radius:9px;
         padding:9px 13px; min-height:44px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
  .btn:hover { border-color:var(--green); }
  .btn-primary { background:var(--green); border-color:var(--green); color:#fff; font-weight:600; }
  .btn-small { padding:6px 10px; min-height:38px; font-size:16px; }
  select, input[type=search] { background:var(--card); border:2px solid var(--line);
        border-radius:9px; padding:9px 11px; min-height:44px; }
  input[type=search] { min-width:190px; flex:1 1 190px; }
  .tabs { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  .tab { border:2px solid var(--line); background:var(--card); border-radius:99px;
         padding:7px 13px; cursor:pointer; font-size:16px; display:flex; gap:6px; align-items:center; }
  .tab[aria-pressed=true] { background:var(--green-soft); border-color:var(--green); font-weight:600; }
  .tab .n { font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums; }
  .tab[aria-pressed=true] .n { color:var(--green); }
  .counter { font-size:15px; color:var(--muted); margin-left:auto; font-variant-numeric:tabular-nums; }

  /* ---------- guidance ---------- */
  .persist-warn { margin: 8px 0 0; padding: 8px 10px; border-radius: 6px;
    background: #fff4e0; color: #6b4a10; font-size: 15px; line-height: 1.5; }
  .switch { display:flex; gap:8px; align-items:center; font-size:16px;
    border:2px solid var(--line); background:var(--card); border-radius:9px;
    padding:7px 11px; min-height:44px; cursor:pointer; }
  .switch input { width:20px; height:20px; }
  .listen { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:2px 0 8px; }
  .play { background:var(--green); color:#fff; border:2px solid var(--green); border-radius:11px;
    padding:10px 18px; font-size:18px; font-weight:700; min-height:48px; min-width:118px;
    cursor:pointer; }
  .play:hover { filter:brightness(1.08); }
  .play:disabled { background:var(--line); border-color:var(--line); color:var(--muted);
    cursor:not-allowed; }
  .noclip { font-size:15px; color:var(--muted); font-style:italic; }
  .row[data-active="true"] { border-color:var(--green); box-shadow:0 0 0 3px var(--green-soft); }
  .audio-tip { margin:8px 0 0; padding:9px 11px; border-radius:6px; background:var(--blue-soft);
    color:var(--blue); font-size:15px; line-height:1.5; }
  .listen audio { width:100%; max-width:360px; height:44px; margin:2px 0; }
  .audio-warn { margin:8px 0 0; padding:9px 11px; border-radius:6px; background:var(--red-soft);
    color:#6b2b1c; font-size:15px; line-height:1.5; }
  .order { margin: 0 0 10px; font-size: 16px; line-height: 1.55; }
  details.guide { margin:10px auto 0; max-width:900px; background:var(--blue-soft); border:1px solid #cfe0ea;
                  border-radius:12px; padding:10px 14px; }
  details.guide summary { cursor:pointer; font-weight:600; color:var(--blue); }
  details.guide ul { margin:8px 0 0 18px; padding:0; font-size:16px; }
  details.guide li { margin:4px 0; }

  /* ---------- rows ---------- */
  main { padding:12px 16px 120px; max-width:900px; margin:0 auto; }
  .row { background:var(--card); border:1px solid var(--line); border-radius:14px;
         padding:14px 16px; margin-bottom:10px; }
  .row[data-verdict=ok] { border-color:#b6d8c4; background:linear-gradient(0deg,#f4faf6,#fff); }
  .row[data-verdict=wrong] { border-color:#e3b3a9; background:linear-gradient(0deg,#fdf5f3,#fff); }
  .row[data-verdict=unsure] { border-color:#e2d3ae; background:linear-gradient(0deg,#fdfaf1,#fff); }

  .edit-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:6px 0; }
  .edit-grid.single { grid-template-columns:1fr; }
  .field-box label { display:block; font-size:13px; text-transform:uppercase; letter-spacing:.04em;
                     color:var(--muted); margin-bottom:3px; font-weight:600; }
  .field-box input, .field-box textarea {
    width:100%; background:#fffdf9; border:1.5px solid var(--line); border-radius:9px;
    padding:8px 11px; transition:border-color .15s, background .15s;
  }
  .field-box input:focus, .field-box textarea:focus {
    outline:none; border-color:var(--green); background:#fff;
    box-shadow:0 0 0 3px var(--green-soft);
  }
  .field-box input.mg-in { font-size:21px; font-weight:600; color:var(--ink); }
  .field-box input.pron-in { font-size:17px; color:var(--gold); font-family:ui-monospace, SFMono-Regular, Menlo, monospace; }
  .field-box input.en-in { font-size:16px; color:var(--muted); }
  .field-box input[data-dirty="true"], .field-box textarea[data-dirty="true"] {
    border-color:var(--green); background:#f4faf6;
  }

  .en-line { margin:4px 0 0; color:var(--muted); font-size:17px; }
  .meta { margin:6px 0 0; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .chip { font-size:12.5px; text-transform:uppercase; letter-spacing:.05em;
          border:1px solid var(--line); border-radius:99px; padding:2px 8px; color:var(--muted); }
  .chip.taught { border-color:var(--green); color:var(--green); }
  .chip.edited { border-color:var(--green); background:var(--green-soft); color:var(--green); font-weight:600; }

  .tools { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; align-items:center; }
  .verdict { display:flex; gap:5px; }
  .verdict button { border:2px solid var(--line); background:var(--card); border-radius:9px;
                    min-width:46px; min-height:42px; cursor:pointer; font-size:17px; padding:0 10px; }
  .verdict button[aria-pressed=true].y { background:var(--green-soft); border-color:var(--green); font-weight:700; }
  .verdict button[aria-pressed=true].n { background:var(--red-soft); border-color:var(--red); font-weight:700; }
  .verdict button[aria-pressed=true].q { background:#fdf3d9; border-color:var(--gold); font-weight:700; }

  .fix { display:none; margin-top:10px; border-top:1px dashed var(--line); padding-top:10px; }
  .fix[data-open=true] { display:block; }
  .fix label { display:block; font-size:14.5px; color:var(--muted); margin:8px 0 3px; }
  .fix input, .fix textarea { width:100%; background:#fffdf8; border:1.5px solid var(--line);
        border-radius:8px; padding:9px 11px; font-size:17px; }
  .fix textarea { min-height:56px; resize:vertical; }
  .saved { font-size:14px; color:var(--green); font-weight:600; margin-left:auto; }

  .onaat { position:fixed; inset:0; background:rgba(36,31,26,.55); display:none;
           align-items:center; justify-content:center; padding:16px; z-index:50; }
  .onaat[data-open=true] { display:flex; }
  .card-oa { background:var(--card); border-radius:16px; max-width:560px; width:100%;
             padding:20px; max-height:90vh; overflow:auto; }
  .card-oa h2 { margin:0 0 8px; font-size:22px; }
  .card-oa p { margin:8px 0; font-size:16.5px; }
  footer { padding:0 16px 40px; max-width:900px; margin:0 auto; color:var(--muted); font-size:15px; }
  @media (max-width:640px) {
    .edit-grid { grid-template-columns:1fr; }
    header { padding:8px 12px 6px; }
    main { padding:10px 12px 120px; }
  }
  @media print { header, .tools, .fix, footer { display:none; } .row { break-inside:avoid; } }
</style>
</head>
<body>

<header>
  <div class="head-top">
    <div>
      <h1>Fanitsiana ny votoaty — Salama! (Official Malagasy)</h1>
      <p class="sub">__TOTAL__ entries · Click any Malagasy or Phonetics box to edit directly. Saved automatically in this browser &amp; live app.</p>
    </div>
    <a class="btn btn-small" href="index.html">← Back to Salama! App</a>
  </div>
  <div class="progress" aria-hidden="true"><i id="bar"></i></div>
  <div class="bar">
    <input type="search" id="q" placeholder="Search Malagasy, phonetics, or English…" aria-label="Search">
    <select id="filter" aria-label="Filter">
      <option value="all">Everything</option>
      <option value="todo">Not judged yet</option>
      <option value="heard">Played, not judged</option>
      <option value="fixed">Edited / corrected</option>
      <option value="ok">Marked ✔ marina</option>
      <option value="wrong">Marked ✘ diso</option>
      <option value="unsure">Marked ?</option>
    </select>
    <label class="switch"><input type="checkbox" id="auto">
      <span>Auto-advance on mark</span></label>
    <button class="btn btn-small" id="testSound" type="button">Test sound</button>
    <button class="btn btn-small btn-primary" id="export" type="button">Export edits (.tsv)</button>
    <span class="counter" id="counter"></span>
  </div>
  <div class="tabs" id="tabs"></div>
</header>

<details class="guide">
  <summary>How to listen, edit Malagasy &amp; phonetics, and mark entries (tap to open)</summary>
  <p class="order"><b>Direct manual editing:</b> Every card below has editable <b>Malagasy</b> and
     <b>Phonetics</b> boxes. Just click into any box and type — your change is saved immediately
     and also appears live inside the main <b>Salama!</b> course app in this browser.</p>
  <ul>
    <li><b>Press ▶ to hear the clip</b>, or press Space when a row is active.</li>
    <li><b>Edit Malagasy or Phonetics directly</b> in the input fields on any row. Click <b>Reset</b> on a row if you want to restore the original text.</li>
    <li><b>Mark ✔ (marina), ? (unsure), or ✘ (diso)</b> to record your verdict on the sound or text.</li>
    <li>Press <b>Export edits (.tsv)</b> at any time to download all your edits and marks as a file.</li>
  </ul>
</details>

<main id="list" aria-live="polite"></main>

<footer>
  <p>Edits are saved automatically in your browser (shared with the Salama! course app) and can be
     downloaded at any time with <b>Export edits (.tsv)</b>.</p>
</footer>

<div class="onaat" id="onaat" role="dialog" aria-modal="true" aria-labelledby="oaTitle">
  <div class="card-oa">
    <h2 id="oaTitle">Exported</h2>
    <p id="oaBody"></p>
    <div class="bar" style="margin-top:14px">
      <button class="btn btn-primary" id="oaClose" type="button">Close</button>
    </div>
  </div>
</div>

<script>
var ROWS = __ROWS__;
var BY_KEY = {};
ROWS.forEach(function (r) { BY_KEY[r.key] = r; });

var SECTION_NAMES = {
  sentences: 'Sentences',
  phrases: 'Phrases',
  words: 'Words',
  grammar: 'Grammar examples',
  notes: 'Culture notes'
};
var STORE = 'salama_proofread_v1';
var EDITS_STORE = 'salama_edits_v1';
var POS = 'salama_proofread_pos_v1';

var view = {
  section: 'sentences',
  filter: 'all',
  q: '',
  shown: 50,
  step: 50
};

var persistOK = (function () {
  try { localStorage.setItem('salama_probe', '1'); localStorage.removeItem('salama_probe'); return true; }
  catch (e) { return false; }
})();

function load() {
  var m = {};
  try { m = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { m = {}; }
  try {
    var shared = JSON.parse(localStorage.getItem(EDITS_STORE) || '{}') || {};
    Object.keys(shared).forEach(function (k) {
      m[k] = Object.assign({}, m[k] || {}, shared[k]);
    });
  } catch (e) {}
  return m;
}
var marks = load();
var activeKey = null;

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(marks));
    localStorage.setItem(EDITS_STORE, JSON.stringify(marks));
  } catch (e) {}
  paintCounter();
  paintTabs();
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isEdited(row, m) {
  if (!m) return false;
  return Boolean(
    (m.mg !== undefined && m.mg !== '' && m.mg !== row.mg) ||
    (m.pron !== undefined && m.pron !== '' && m.pron !== (row.pron || '')) ||
    (m.en !== undefined && m.en !== '' && m.en !== (row.en || '')) ||
    m.note
  );
}

/* ---------------- filtering & rendering ---------------- */
function matchesFilter(row) {
  var m = marks[row.key] || {};
  var f = view.filter;
  if (f === 'todo') return !m.verdict && !isEdited(row, m);
  if (f === 'heard') return Boolean(m.heard && !m.verdict);
  if (f === 'ok') return m.verdict === 'ok';
  if (f === 'wrong') return m.verdict === 'wrong';
  if (f === 'unsure') return m.verdict === 'unsure';
  if (f === 'fixed') return isEdited(row, m);
  return true;
}

function matchesSearch(row) {
  var q = (view.q || '').trim().toLowerCase();
  if (!q) return true;
  var m = marks[row.key] || {};
  var mg = (m.mg !== undefined && m.mg !== '' ? m.mg : row.mg) || '';
  var pron = (m.pron !== undefined && m.pron !== '' ? m.pron : row.pron) || '';
  var en = (m.en !== undefined && m.en !== '' ? m.en : row.en) || '';
  return mg.toLowerCase().indexOf(q) !== -1 ||
         pron.toLowerCase().indexOf(q) !== -1 ||
         en.toLowerCase().indexOf(q) !== -1 ||
         (row.where || '').toLowerCase().indexOf(q) !== -1;
}

function rowsForView() {
  return ROWS.filter(function (row) {
    if (!view.q && row.section !== view.section) return false;
    return matchesFilter(row) && matchesSearch(row);
  });
}

function visibleRows() {
  return rowsForView().slice(0, view.shown);
}

function paintCounter() {
  var done = 0;
  var edited = 0;
  ROWS.forEach(function (r) {
    var m = marks[r.key];
    if (m && (m.verdict || isEdited(r, m))) done += 1;
    if (m && isEdited(r, m)) edited += 1;
  });
  var pct = ROWS.length ? Math.min(100, (done / ROWS.length) * 100) : 0;
  var bar = document.getElementById('bar');
  if (bar) bar.style.width = pct.toFixed(1) + '%';
  var counter = document.getElementById('counter');
  if (counter) {
    counter.textContent = done + ' / ' + ROWS.length + ' reviewed' +
      (edited ? ' (' + edited + ' edited)' : '');
  }
}

function paintTabs() {
  var holder = document.getElementById('tabs');
  if (!holder) return;
  var counts = {};
  ROWS.forEach(function (r) {
    counts[r.section] = (counts[r.section] || 0) + 1;
  });
  holder.innerHTML = Object.keys(SECTION_NAMES).map(function (sec) {
    return '<button class="tab" type="button" data-sec="' + sec + '" aria-pressed="' +
      (view.section === sec ? 'true' : 'false') + '">' +
      esc(SECTION_NAMES[sec]) + ' <span class="n">' + (counts[sec] || 0) + '</span></button>';
  }).join('');
}

function renderRow(row) {
  var m = marks[row.key] || {};
  var verdict = m.verdict || '';
  var curMg = (m.mg !== undefined && m.mg !== '') ? m.mg : row.mg;
  var curPron = (m.pron !== undefined && m.pron !== '') ? m.pron : (row.pron || '');
  var curEn = (m.en !== undefined && m.en !== '') ? m.en : (row.en || '');
  var mgDirty = curMg !== row.mg;
  var pronDirty = curPron !== (row.pron || '');
  var enDirty = curEn !== (row.en || '');
  var edited = isEdited(row, m);
  var isNote = row.section === 'notes';

  var audioHtml = row.audio
    ? '<div class="listen">' +
        '<button class="play" type="button" data-play="' + esc(row.key) + '">\u25B6 Listen</button>' +
        '<button class="btn btn-small" type="button" data-slow="' + esc(row.key) + '">\uD83D\uDC22 Slow</button>' +
      '</div>'
    : '<div class="listen"><span class="noclip">Text only (no audio clip)</span></div>';

  var fieldsHtml = isNote
    ? '<div class="edit-grid single">' +
        '<div class="field-box">' +
          '<label>Culture Note</label>' +
          '<textarea rows="3" data-field="mg" data-dirty="' + mgDirty + '">' + esc(curMg) + '</textarea>' +
        '</div>' +
      '</div>'
    : '<div class="edit-grid">' +
        '<div class="field-box">' +
          '<label>Malagasy (editable)</label>' +
          '<input type="text" class="mg-in" lang="mg" data-field="mg" data-dirty="' + mgDirty + '" value="' + esc(curMg) + '">' +
        '</div>' +
        '<div class="field-box">' +
          '<label>Phonetics / Pronunciation (editable)</label>' +
          '<input type="text" class="pron-in" data-field="pron" data-dirty="' + pronDirty + '" placeholder="e.g. sah-LAH-mah" value="' + esc(curPron) + '">' +
        '</div>' +
      '</div>';

  return '<article class="row" data-key="' + esc(row.key) + '" data-section="' + esc(row.section) + '"' +
    (verdict ? ' data-verdict="' + esc(verdict) + '"' : '') +
    (activeKey === row.key ? ' data-active="true"' : '') + '>' +
    audioHtml +
    fieldsHtml +
    (!isNote ? '<p class="en-line">' + esc(curEn) + '</p>' : '') +
    '<div class="meta">' +
      '<span class="chip">' + esc(row.key) + '</span>' +
      (row.where ? '<span class="chip">' + esc(row.where) + '</span>' : '') +
      (row.who === 'taught' ? '<span class="chip taught">Taught in sessions</span>' : (row.who ? '<span class="chip">' + esc(row.who) + '</span>' : '')) +
      (edited ? '<span class="chip edited">\u2713 Edited</span>' : '') +
    '</div>' +
    '<div class="tools">' +
      '<div class="verdict" role="group" aria-label="Verdict">' +
        '<button type="button" class="y" data-verdict-btn="ok" aria-pressed="' + (verdict === 'ok' ? 'true' : 'false') + '" title="Correct (marina)">\u2714</button>' +
        '<button type="button" class="q" data-verdict-btn="unsure" aria-pressed="' + (verdict === 'unsure' ? 'true' : 'false') + '" title="Unsure">?</button>' +
        '<button type="button" class="n" data-verdict-btn="wrong" aria-pressed="' + (verdict === 'wrong' ? 'true' : 'false') + '" title="Wrong (diso)">\u2718</button>' +
      '</div>' +
      '<button type="button" class="btn btn-small" data-toggle-more="true">English / Note</button>' +
      (edited ? '<button type="button" class="btn btn-small" data-reset-row="true">Reset original</button>' : '') +
      '<span class="saved" data-saved-msg="true">' + (edited ? 'Saved' : '') + '</span>' +
    '</div>' +
    '<div class="fix" data-open="' + ((enDirty || m.note) ? 'true' : 'false') + '">' +
      (!isNote ? '<label>English meaning</label><input type="text" class="en-in" data-field="en" data-dirty="' + enDirty + '" value="' + esc(curEn) + '">' : '') +
      '<label>Reviewer note (optional)</label>' +
      '<textarea data-field="note" placeholder="Optional note about pronunciation, dialect, or audio…">' + esc(m.note || '') + '</textarea>' +
    '</div>' +
  '</article>';
}

function render() {
  paintTabs();
  paintCounter();
  var all = rowsForView();
  var shown = all.slice(0, view.shown);
  var list = document.getElementById('list');
  if (!list) return;
  if (!shown.length) {
    list.innerHTML = '<p style="text-align:center;color:var(--muted);padding:32px 0">No entries match this filter.</p>';
    return;
  }
  var moreBtn = all.length > shown.length
    ? '<div style="text-align:center;margin-top:18px">' +
        '<button class="btn" type="button" id="moreRows">Show more (' + shown.length + ' of ' + all.length + ')</button>' +
      '</div>'
    : '';
  list.innerHTML = shown.map(renderRow).join('') + moreBtn;
}

/* ---------------- audio ---------------- */
var audioBase = '__AUDIO_BASE__';
var player = new Audio();
var playerReady = false;
var nativeMode = false;
var audioNote = null;

function noteToUser(html, bad) {
  if (!audioNote) {
    audioNote = document.createElement('p');
    audioNote.className = bad ? 'audio-warn' : 'audio-tip';
    document.querySelector('header').appendChild(audioNote);
  }
  audioNote.className = bad ? 'audio-warn' : 'audio-tip';
  audioNote.innerHTML = html;
}

function srcFor(row) { return row && row.audio ? audioBase + row.audio : ''; }

function rowNode(key) {
  return document.querySelector('.row[data-key="' + key.replace(/"/g, '\\"') + '"]');
}

function markActive(key) {
  activeKey = key;
  var previous = document.querySelector('.row[data-active="true"]');
  if (previous && previous.getAttribute('data-key') !== key) {
    previous.setAttribute('data-active', 'false');
  }
  var article = rowNode(key);
  if (article) article.setAttribute('data-active', 'true');
  return article;
}

function embedPlayer(row, article) {
  if (!article) return;
  var holder = article.querySelector('.listen');
  if (!holder) return;
  var existing = holder.querySelector('audio');
  if (existing) { existing.play().catch(function () {}); return; }
  var el = document.createElement('audio');
  el.controls = true;
  el.autoplay = true;
  el.preload = 'auto';
  el.src = srcFor(row);
  el.setAttribute('aria-label', 'Recording of ' + row.mg);
  holder.insertBefore(el, holder.firstChild);
  var attempt = el.play();
  if (attempt && attempt.catch) {
    attempt.catch(function () { noteToUser('Press the \u25B6 on the player below the phrase.', false); });
  }
}

var timer = null;

function playRow(row, slow) {
  if (!row) return;
  if (!row.audio) {
    noteToUser('That entry has no recording \u2014 it is text only.', false);
    return;
  }
  var article = markActive(row.key);
  if (timer) clearTimeout(timer);
  var mark = marks[row.key] || (marks[row.key] = {});
  if (!mark.heard) { mark.heard = true; save(); }

  if (nativeMode) {
    embedPlayer(row, article);
    if (autoMode()) scheduleNext(row.key);
    return;
  }

  player.pause();
  player.onended = null;
  player.src = srcFor(row);
  player.playbackRate = slow ? 0.7 : 1;
  var attempt = player.play();
  if (attempt && attempt.then) {
    attempt.then(function () {
      playerReady = true;
      if (autoMode()) player.onended = function () { timer = setTimeout(nextRow, 350); };
    }).catch(function (error) {
      nativeMode = true;
      embedPlayer(row, article);
      noteToUser('Press \u25B6 on the embedded player under the phrase.', false);
    });
  }
}

function autoMode() { return document.getElementById('auto').checked; }

function scheduleNext(key) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(function () {
    var rows = rowsForView();
    var position = -1;
    for (var i = 0; i < rows.length; i++) { if (rows[i].key === key) { position = i; break; } }
    var following = rows[position + 1];
    if (!following) return;
    if (!rowNode(following.key)) { view.shown += view.step; render(); }
    playRow(following, false);
  }, 300);
}

function nextRow() {
  var rows = rowsForView();
  var position = -1;
  for (var i = 0; i < rows.length; i++) { if (rows[i].key === activeKey) { position = i; break; } }
  var following = rows[position + 1];
  if (!following) return null;
  if (!rowNode(following.key)) { view.shown += view.step; render(); }
  playRow(following, false);
  return following;
}

function stepActive(direction) {
  var rows = rowsForView();
  if (!rows.length) return null;
  var index = -1;
  for (var i = 0; i < rows.length; i++) { if (rows[i].key === activeKey) { index = i; break; } }
  var next = rows[index + direction];
  if (!next) return null;
  if (!rowNode(next.key)) { view.shown += view.step; render(); }
  playRow(next, false);
  return next;
}

function testSound() {
  var row = ROWS.filter(function (r) { return r.audio; })[0];
  if (!row) { noteToUser('No recordings in this file.', true); return; }
  noteToUser('Playing sample: ' + row.mg, false);
  playRow(row, false);
}

/* ---------------- UI interactions ---------------- */
document.getElementById('tabs').addEventListener('click', function (event) {
  var btn = event.target.closest('[data-sec]');
  if (!btn) return;
  view.section = btn.getAttribute('data-sec');
  view.shown = view.step;
  try { localStorage.setItem(POS, view.section); } catch (e) {}
  render();
});

document.getElementById('filter').addEventListener('change', function (event) {
  view.filter = event.target.value;
  view.shown = view.step;
  render();
});

document.getElementById('q').addEventListener('input', function (event) {
  view.q = event.target.value;
  view.shown = view.step;
  render();
});

document.getElementById('testSound').addEventListener('click', testSound);
document.getElementById('export').addEventListener('click', exportAll);
document.getElementById('oaClose').addEventListener('click', function () {
  document.getElementById('onaat').setAttribute('data-open', 'false');
});

document.getElementById('list').addEventListener('click', function (event) {
  if (event.target.id === 'moreRows') {
    view.shown += view.step;
    render();
    return;
  }
  var article = event.target.closest('.row');
  if (!article) return;
  var key = article.getAttribute('data-key');
  var row = BY_KEY[key];
  if (!row) return;

  if (event.target.closest('[data-play]')) {
    playRow(row, false);
    return;
  }
  if (event.target.closest('[data-slow]')) {
    playRow(row, true);
    return;
  }
  var vBtn = event.target.closest('[data-verdict-btn]');
  if (vBtn) {
    var verdict = vBtn.getAttribute('data-verdict-btn');
    var m = marks[key] || (marks[key] = {});
    m.verdict = (m.verdict === verdict) ? '' : verdict;
    save();
    article.setAttribute('data-verdict', m.verdict || '');
    var buttons = article.querySelectorAll('[data-verdict-btn]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed',
        String(buttons[i].getAttribute('data-verdict-btn') === m.verdict));
    }
    if (m.verdict && autoMode()) scheduleNext(key);
    return;
  }
  if (event.target.closest('[data-toggle-more]')) {
    var fix = article.querySelector('.fix');
    if (fix) {
      fix.setAttribute('data-open', fix.getAttribute('data-open') === 'true' ? 'false' : 'true');
    }
    return;
  }
  if (event.target.closest('[data-reset-row]')) {
    var cur = marks[key];
    if (cur) {
      delete cur.mg;
      delete cur.pron;
      delete cur.en;
      delete cur.note;
      save();
    }
    render();
    return;
  }
});

document.getElementById('list').addEventListener('input', function (event) {
  var field = event.target.getAttribute('data-field');
  if (!field) return;
  var article = event.target.closest('.row');
  if (!article) return;
  var key = article.getAttribute('data-key');
  var row = BY_KEY[key];
  if (!row) return;
  var val = event.target.value;
  var m = marks[key] || (marks[key] = {});
  var orig = row[field] || '';
  if (val.trim() === orig.trim()) {
    delete m[field];
    event.target.setAttribute('data-dirty', 'false');
  } else {
    m[field] = val;
    event.target.setAttribute('data-dirty', 'true');
  }
  if (field === 'en') {
    var enLine = article.querySelector('.en-line');
    if (enLine) enLine.textContent = val;
  }
  var savedNode = article.querySelector('[data-saved-msg]');
  if (savedNode) savedNode.textContent = isEdited(row, m) ? 'Saved \u2713' : '';
  save();
});

/* ---------------- keyboard ---------------- */
document.addEventListener('keydown', function (event) {
  var tag = (event.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  var rows = visibleRows();
  var current = null;
  for (var i = 0; i < rows.length; i++) { if (rows[i].key === activeKey) { current = rows[i]; break; } }
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    if (current) { playRow(current, false); }
    else if (rows.length) { playRow(rows[0], false); }
    return;
  }
  if (event.key === 'j' || event.key === 'ArrowDown') { event.preventDefault(); stepActive(1); return; }
  if (event.key === 'k' || event.key === 'ArrowUp') { event.preventDefault(); stepActive(-1); return; }
  var map = { '1': 'ok', '2': 'unsure', '3': 'wrong' };
  var verdict = map[event.key];
  if (!verdict) return;
  if (!current && rows.length) current = rows[0];
  if (!current) return;
  event.preventDefault();
  var mark = marks[current.key] || (marks[current.key] = {});
  mark.verdict = verdict;
  save();
  if (autoMode()) {
    var position = rows.indexOf(current);
    var following = rows[position + 1];
    if (following) {
      if (!rowNode(following.key)) {
        view.shown += view.step;
        render();
      }
      playRow(following, false);
    }
  } else {
    var node = rowNode(current.key);
    if (node) {
      node.setAttribute('data-verdict', verdict);
      var buttons = node.querySelectorAll('[data-verdict-btn]');
      for (var b = 0; b < buttons.length; b++) {
        buttons[b].setAttribute('aria-pressed',
          String(buttons[b].getAttribute('data-verdict-btn') === verdict));
      }
    }
  }
});

document.getElementById('auto').addEventListener('change', function () {
  if (!autoMode()) { if (timer) clearTimeout(timer); player.onended = null; return; }
  var rows = visibleRows();
  var current = null;
  for (var i = 0; i < rows.length; i++) { if (rows[i].key === activeKey) { current = rows[i]; break; } }
  playRow(current || rows[0], false);
});

/* ---------------- export ---------------- */
function exportAll() {
  var keys = Object.keys(marks).filter(function (k) {
    var m = marks[k];
    var row = BY_KEY[k] || {};
    return m && (m.verdict || isEdited(row, m));
  });
  if (!keys.length) {
    document.getElementById('oaTitle').textContent = 'Nothing to export yet';
    document.getElementById('oaBody').textContent =
      'Edit a Malagasy or phonetics field, or mark a few entries first (\u2714, ?, \u2718).';
    document.getElementById('onaat').setAttribute('data-open', 'true');
    return;
  }
  var header = ['key', 'section', 'original_mg', 'original_en', 'original_pron', 'verdict',
                'corrected_mg', 'corrected_en', 'corrected_pron', 'note'];
  var lines = [header.join('\t')];
  keys.sort().forEach(function (key) {
    var row = BY_KEY[key] || { section: '', mg: '', en: '', pron: '' };
    var m = marks[key];
    lines.push([key, row.section,
                (row.mg || '').replace(/\t/g, ' '),
                (row.en || '').replace(/\t/g, ' '),
                (row.pron || '').replace(/\t/g, ' '),
                m.verdict || '',
                (m.mg || '').replace(/\t/g, ' '),
                (m.en || '').replace(/\t/g, ' '),
                (m.pron || '').replace(/\t/g, ' '),
                (m.note || '').replace(/\n/g, ' ').replace(/\t/g, ' ')].join('\t'));
  });
  var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/tab-separated-values' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'salama_corrections.tsv';
  document.body.appendChild(a);
  a.click();
  a.remove();

  var okCount = keys.filter(function (k) { return marks[k].verdict === 'ok'; }).length;
  var wrongCount = keys.filter(function (k) { return marks[k].verdict === 'wrong'; }).length;
  var fixCount = keys.filter(function (k) { return isEdited(BY_KEY[k] || {}, marks[k]); }).length;
  document.getElementById('oaTitle').textContent = 'Exported ' + keys.length + ' entries';
  document.getElementById('oaBody').innerHTML =
    '<b>salama_corrections.tsv</b> has been downloaded.<br>' +
    '\u2714 ' + okCount + ' correct \u00B7 \u2718 ' + wrongCount + ' wrong \u00B7 ' +
    fixCount + ' with manual Malagasy/phonetics/English edits.';
  document.getElementById('onaat').setAttribute('data-open', 'true');
}

/* ---------------- boot ---------------- */
try {
  var saved = localStorage.getItem(POS);
  if (saved && SECTION_NAMES[saved]) view.section = saved;
} catch (e) {}
if (!persistOK) {
  var warn = document.createElement('p');
  warn.className = 'persist-warn';
  warn.innerHTML = '<b>This preview cannot save to localStorage.</b> Open the live link in a normal browser tab for automatic saving and Export.';
  document.querySelector('header').appendChild(warn);
}
render();
</script>
</body>
</html>
"""


def inline_audio(rows):
    cache = {}
    for row in rows:
        path = row.get("audio")
        if not path:
            continue
        if path not in cache:
            full = os.path.join(BASE, "APP", path)
            try:
                with open(full, "rb") as handle:
                    cache[path] = "data:audio/mpeg;base64," + base64.b64encode(
                        handle.read()).decode("ascii")
            except OSError:
                cache[path] = ""
        row["audio"] = cache[path]
    return len([row for row in rows if row.get("audio")])


def main():
    data = load_content()
    rows = build_rows(data)
    payload = json.dumps(rows, ensure_ascii=False).replace("</", "<\\/")
    targets = [(OUT, "APP/"), (os.path.join(BASE, "APP", "PROOFREAD.html"), "")]
    for path, base in targets:
        html = (PAGE.replace("__ROWS__", payload)
                    .replace("__TOTAL__", str(len(rows)))
                    .replace("__AUDIO_BASE__", base))
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(html)

    counts = {}
    for row in rows:
        counts[row["section"]] = counts.get(row["section"], 0) + 1
    print("Wrote %s (%.1f MB) and APP/PROOFREAD.html"
          % (OUT, os.path.getsize(OUT) / 1048576))
    print("  with a recording: %d of %d rows"
          % (len([r for r in rows if r.get("audio")]), len(rows)))
    print("  " + " | ".join("%s: %d" % (name, counts.get(name, 0)) for name in
                            ("sentences", "phrases", "words", "grammar", "notes")))
    print("  total: %d entries" % len(rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
