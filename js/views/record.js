/* ============================================================
   Record My Voice Studio (#/record) — dedicated, 1-click microphone
   recorder to record words like "Fahasalamana", preview immediately,
   use across the site, and download .wav / .json to upload.
   ============================================================ */
(function (S) {
  'use strict';

  var core = S.core;
  var ui = S.ui;

  var FEATURED_WORDS = [
    { key: 'word:fahasalamana', id: 'fahasalamana', mg: 'Fahasalamana?', pron: 'fah-hah-sah-lah-MAH-nah', en: 'How are you? (asking after health)' },
    { key: 'word:salama', id: 'salama', mg: 'Salama', pron: 'sah-LAH-mah', en: 'Hello / peace' },
    { key: 'word:manao_ahoana', id: 'manao_ahoana', mg: 'Manao ahoana?', pron: 'mah-NOW ah-WAH-nah', en: 'How are you?' },
    { key: 'word:azafady', id: 'azafady', mg: 'Azafady', pron: 'ah-zah-FAH-dee', en: 'Please / excuse me' },
    { key: 'word:misaotra', id: 'misaotra', mg: 'Misaotra', pron: 'mee-SOH-trah', en: 'Thank you' },
    { key: 'word:mandrosoa', id: 'mandrosoa', mg: 'Mandrosoa', pron: 'mahn-DROO-soo-ah', en: 'Come in / welcome inside' },
    { key: 'word:mipetrapetraha', id: 'mipetrapetraha', mg: 'Mipetrapetraha', pron: 'mee-PEH-trah-peh-trah-hah', en: 'Please have a seat' },
    { key: 'word:haody', id: 'haody', mg: 'Haody oh!', pron: 'outdzioh', en: 'Knock knock / Anybody home?' },
    { key: 'word:ndao', id: 'ndao', mg: 'Ndao', pron: 'NDOH', en: 'Let\u2019s go!' },
    { key: 'word:veloma', id: 'veloma', mg: 'Veloma', pron: 'veh-LOO-mah', en: 'Goodbye' }
  ];

  var state = {
    activeKey: 'word:fahasalamana',
    q: ''
  };

  function getEntryFor(key) {
    if (core.entryForKey && core.entryForKey(key)) return core.entryForKey(key);
    var shortId = String(key).replace(/^(word|phrase):/, '');
    if (core.wordById && core.wordById(shortId)) return core.wordById(shortId);
    for (var i = 0; i < FEATURED_WORDS.length; i++) {
      if (FEATURED_WORDS[i].key === key || FEATURED_WORDS[i].id === shortId) return FEATURED_WORDS[i];
    }
    return FEATURED_WORDS[0];
  }

  function searchMatches(q) {
    var normQ = ui.norm(q);
    if (!normQ) return FEATURED_WORDS;
    var results = [];
    var seen = {};
    (core.data.vocabulary || []).forEach(function (w) {
      if (results.length >= 24) return;
      if (ui.norm(w.mg).indexOf(normQ) !== -1 ||
          ui.norm(w.id).indexOf(normQ) !== -1 ||
          ui.norm(w.en).indexOf(normQ) !== -1) {
        seen[w.id] = true;
        results.push({
          key: 'word:' + w.id,
          id: w.id,
          mg: w.mg,
          pron: w.pron || '',
          en: w.en || ''
        });
      }
    });
    (core.data.phrases || []).forEach(function (p) {
      if (results.length >= 30 || seen[p.id]) return;
      if (ui.norm(p.mg).indexOf(normQ) !== -1 ||
          ui.norm(p.id).indexOf(normQ) !== -1 ||
          ui.norm(p.en).indexOf(normQ) !== -1) {
        seen[p.id] = true;
        results.push({
          key: 'phrase:' + p.id,
          id: p.id,
          mg: p.mg,
          pron: p.pron || '',
          en: p.en || ''
        });
      }
    });
    return results;
  }

  function recordedItemsList() {
    if (!S.speech || !S.speech.customAudioCount) return [];
    var items = [];
    var seen = {};
    (core.data.vocabulary || []).forEach(function (w) {
      var k = 'word:' + w.id;
      if (S.speech.hasCustomAudio(k) && !seen[w.id]) {
        seen[w.id] = true;
        items.push({ key: k, id: w.id, mg: w.mg, pron: w.pron, en: w.en });
      }
    });
    (core.data.phrases || []).forEach(function (p) {
      var k = 'phrase:' + p.id;
      if (S.speech.hasCustomAudio(k) && !seen[p.id]) {
        seen[p.id] = true;
        items.push({ key: k, id: p.id, mg: p.mg, pron: p.pron, en: p.en });
      }
    });
    return items;
  }

  function renderStudioCard() {
    var entry = getEntryFor(state.activeKey) || FEATURED_WORDS[0];
    var key = state.activeKey || 'word:fahasalamana';
    var shortId = String(key).replace(/^(word|phrase):/, '');
    var hasCustom = S.speech && S.speech.hasCustomAudio && S.speech.hasCustomAudio(key);
    var inIframe = false;
    try { inIframe = window.self !== window.top; } catch (e) { inIframe = true; }

    return '<section class="panel" style="border:2px solid var(--forest, #123F2B);padding:24px;margin-bottom:24px">' +
      (inIframe
        ? '<div style="background:#FFF3CD;border:1px solid #F2B705;border-radius:12px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">' +
            '<span style="font-size:0.92rem;color:#3d2c00"><strong>Tip:</strong> If your browser blocks the microphone inside this preview frame, open the recorder in a full tab:</span>' +
            '<a class="btn btn-sm" href="https://tianabizna-ctrl.github.io/Mianatra-Miteny-Malagasy/?v=4.3.8#/record/' + ui.esc(shortId) + '" target="_blank" rel="noopener">Open Recorder in Full Tab &nearr;</a>' +
          '</div>'
        : '') +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">' +
        '<div>' +
          '<p class="section-eyebrow" style="margin:0 0 4px">SELECTED WORD TO RECORD</p>' +
          '<h2 class="mg-line" lang="mg" style="font-size:2.4rem;margin:0 0 6px">' + ui.esc(entry.mg) + '</h2>' +
          (entry.pron ? '<p class="say" style="font-size:1.1rem;margin:0 0 6px"><span class="say-label">Phonetic:</span> ' + ui.esc(entry.pron) + '</p>' : '') +
          '<p class="en" style="font-size:1.05rem;margin:0">' + ui.esc(entry.en || '') + '</p>' +
        '</div>' +
        '<div>' +
          (hasCustom
            ? '<span class="checked" style="font-size:0.95rem;padding:6px 12px;background:#e5f7ed;border-radius:999px;display:inline-block">\u2713 Your Voice Recorded &amp; Active</span>'
            : '<span class="meta" style="padding:6px 12px;background:var(--surface-2,#f3ead8);border-radius:999px;display:inline-block">Currently using default voice</span>') +
        '</div>' +
      '</div>' +

      '<div class="btn-row" style="margin-top:20px;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<button class="btn btn-lg" type="button" id="studioRecordBtn" data-studio-record="' + ui.esc(key) + '" style="background:#c93b2b;border-color:#c93b2b;color:#fff;font-size:1.1rem;padding:14px 26px">' +
          '\u25CF <span>' + (hasCustom ? 'Re-record My Voice' : 'Click to Record My Voice') + '</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-lg" type="button" data-speak="' + ui.esc(entry.mg) + '" data-word-id="' + ui.esc(shortId) + '">' +
          ui.icon('play') + '<span>' + (hasCustom ? 'Play My Recording' : 'Hear Current Audio') + '</span>' +
        '</button>' +
        '<label class="btn btn-quiet" style="cursor:pointer">' +
          ui.icon('download') + '<span>Or Upload Audio File (.wav / .mp3 / .m4a)</span>' +
          '<input type="file" accept="audio/*" id="studioUploadInput" data-studio-upload="' + ui.esc(key) + '" hidden>' +
        '</label>' +
        (hasCustom
          ? '<button class="btn btn-gold" type="button" data-studio-download="' + ui.esc(key) + '">' +
              '\u2B07 Download <code>' + ui.esc(shortId) + '.wav</code></button>' +
            '<button class="btn btn-quiet btn-sm" type="button" data-studio-clear="' + ui.esc(key) + '">Reset to default</button>'
          : '') +
      '</div>' +
      '<p class="meta" style="margin:14px 0 0">1. Click <strong>\u25CF Click to Record My Voice</strong> and allow microphone access. &nbsp;2. Say <strong lang="mg">\u201c' + ui.esc(entry.mg) + '\u201d</strong> clearly, then click <strong>Stop recording</strong>. &nbsp;3. Download the <code>.wav</code> file (or bundle below) and attach it here in chat so I can also bake it permanently into GitHub &amp; Netlify!</p>' +
    '</section>';
  }

  function renderRecordedTable() {
    var recList = recordedItemsList();
    if (!recList.length) {
      return '<section class="panel" style="margin-top:24px">' +
        '<h2 style="margin:0 0 6px">Your Recorded Words (0 so far)</h2>' +
        '<p class="meta" style="margin:0">Once you record a word above, it will appear here with a 1-click download button so you can upload your recordings in the chat.</p>' +
      '</section>';
    }
    return '<section class="panel" style="margin-top:24px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">' +
        '<div>' +
          '<h2 style="margin:0 0 4px">Your Recorded Words (' + recList.length + ')</h2>' +
          '<p class="meta" style="margin:0">Download individual <code>.wav</code> files or click <strong>Download All Recordings (.json)</strong> and attach the file in chat to permanently bundle your voice into the site.</p>' +
        '</div>' +
        '<button class="btn" type="button" id="studioExportAllBtn">' +
          ui.icon('download') + 'Download All Recordings (.json)</button>' +
      '</div>' +
      '<div class="entry-list">' +
        recList.map(function (r) {
          return '<article class="entry" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
            '<div>' +
              '<strong class="mg-line" lang="mg" style="font-size:1.25rem">' + ui.esc(r.mg) + '</strong> ' +
              '<span class="meta">(' + ui.esc(r.en || '') + ')</span>' +
            '</div>' +
            '<div class="entry-tools">' +
              '<button class="icon-btn hear-btn" type="button" data-speak="' + ui.esc(r.mg) + '" data-word-id="' + ui.esc(r.id) + '">' +
                ui.icon('play') + '<span>Play My Voice</span></button>' +
              '<button class="icon-btn" type="button" data-pick-word="' + ui.esc(r.key) + '">\u25CF Re-record</button>' +
              '<button class="icon-btn" type="button" data-studio-download="' + ui.esc(r.key) + '">\u2B07 Download <code>' + ui.esc(r.id) + '.wav</code></button>' +
            '</div>' +
          '</article>';
        }).join('') +
      '</div>' +
    '</section>';
  }

  function render(parts) {
    if (parts && parts[1]) {
      var slug = decodeURIComponent(parts[1]);
      state.activeKey = slug.indexOf(':') !== -1 ? slug : ('word:' + slug);
    }
    var matches = searchMatches(state.q);

    return '<div class="view-narrow">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px;margin-bottom:12px">' +
        '<div>' +
          '<p class="section-eyebrow" style="margin:0 0 4px">VOICE RECORDER STUDIO</p>' +
          '<h1 style="margin:0">Record Your Voice</h1>' +
        '</div>' +
        '<a class="cta-link" href="#/dictionary">&larr; Back to Dictionary</a>' +
      '</div>' +

      '<div id="studioActiveCard">' + renderStudioCard() + '</div>' +

      '<section class="panel">' +
        '<h2 style="margin:0 0 10px;font-size:1.15rem">Choose Any Word to Record</h2>' +
        '<div class="filter-row" style="margin-bottom:12px">' +
          '<div class="search-wrap">' + ui.icon('search') +
            '<input type="search" id="studioSearch" placeholder="Search any word in Malagasy or English (e.g. fahasalamana, salama, misaotra)\u2026" value="' + ui.esc(state.q) + '">' +
          '</div>' +
        '</div>' +
        '<div class="chips" id="studioWordChips">' +
          matches.map(function (m) {
            var hasRec = S.speech && S.speech.hasCustomAudio && S.speech.hasCustomAudio(m.key);
            return '<button class="chip" type="button" data-pick-word="' + ui.esc(m.key) + '" aria-pressed="' +
              (state.activeKey === m.key ? 'true' : 'false') + '">' +
              (hasRec ? '\u2713 ' : '') + ui.esc(m.mg) + ' <span class="meta">(' + ui.esc(m.en.slice(0, 24)) + ')</span></button>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<div id="studioRecordedList">' + renderRecordedTable() + '</div>' +
    '</div>';
  }

  function refreshStudio(scope) {
    var activeHolder = scope.querySelector('#studioActiveCard');
    if (activeHolder) activeHolder.innerHTML = renderStudioCard();
    var recHolder = scope.querySelector('#studioRecordedList');
    if (recHolder) recHolder.innerHTML = renderRecordedTable();
    var chipsHolder = scope.querySelector('#studioWordChips');
    if (chipsHolder) {
      var matches = searchMatches(state.q);
      chipsHolder.innerHTML = matches.map(function (m) {
        var hasRec = S.speech && S.speech.hasCustomAudio && S.speech.hasCustomAudio(m.key);
        return '<button class="chip" type="button" data-pick-word="' + ui.esc(m.key) + '" aria-pressed="' +
          (state.activeKey === m.key ? 'true' : 'false') + '">' +
          (hasRec ? '\u2713 ' : '') + ui.esc(m.mg) + ' <span class="meta">(' + ui.esc(m.en.slice(0, 24)) + ')</span></button>';
      }).join('');
    }
  }

  function mount(root) {
    var scope = root.firstElementChild || root;

    scope.addEventListener('click', function (event) {
      var pickBtn = event.target.closest('[data-pick-word]');
      if (pickBtn) {
        state.activeKey = pickBtn.getAttribute('data-pick-word');
        refreshStudio(scope);
        return;
      }

      var recBtn = event.target.closest('[data-studio-record]');
      if (recBtn) {
        var rKey = recBtn.getAttribute('data-studio-record');
        if (S.speech && S.speech.toggleMicRecording) {
          S.speech.toggleMicRecording(rKey, recBtn, function () {
            refreshStudio(scope);
          });
        }
        return;
      }

      var dlBtn = event.target.closest('[data-studio-download]');
      if (dlBtn) {
        var dKey = dlBtn.getAttribute('data-studio-download');
        if (S.speech && S.speech.downloadCustomWav) {
          S.speech.downloadCustomWav(dKey);
        }
        return;
      }

      var clrBtn = event.target.closest('[data-studio-clear]');
      if (clrBtn) {
        var cKey = clrBtn.getAttribute('data-studio-clear');
        if (S.speech && S.speech.removeCustomAudio) {
          S.speech.removeCustomAudio(cKey, function () {
            refreshStudio(scope);
            ui.toast('Restored default audio.');
          });
        }
        return;
      }

      if (event.target.closest('#studioExportAllBtn')) {
        var n = (S.speech && S.speech.exportCustomAudioBundle) ? S.speech.exportCustomAudioBundle() : 0;
        if (!n) ui.toast('No recordings yet — click Record My Voice above first.');
        else ui.toast('Downloaded salama_my_voice_recordings.json (' + n + ' word(s)). Attach it in chat!');
        return;
      }

      if (ui.speakFrom(event)) return;
    });

    scope.addEventListener('change', function (event) {
      var upKey = event.target.getAttribute && event.target.getAttribute('data-studio-upload');
      if (upKey && event.target.files && event.target.files[0]) {
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function () {
          if (S.speech && S.speech.saveCustomAudio) {
            S.speech.saveCustomAudio(upKey, String(reader.result), function () {
              refreshStudio(scope);
              ui.toast('Uploaded and saved your voice recording!');
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });

    scope.addEventListener('input', function (event) {
      if (event.target.id === 'studioSearch') {
        state.q = event.target.value;
        refreshStudio(scope);
      }
    });
  }

  S.views = S.views || {};
  S.views.record = { render: render, mount: mount, nav: 'record' };
})(window.Salama);
