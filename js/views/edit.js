/* ============================================================
   Edit Malagasy, Phonetics & Record My Voice (#/edit) —
   direct side-by-side live editor and microphone voice recorder
   for every word, phrase, and dialogue line in the course.
   ============================================================ */
(function (S) {
  'use strict';
  var core = S.core;
  var ui = S.ui;

  var PAGE = 40;
  var state = {
    tab: 'words', // 'words' | 'phrases' | 'sentences' | 'voice' | 'edited'
    q: '',
    limit: PAGE
  };

  var QUICK_VOICE_WORDS = [
    'Fahasalamana?',
    'Salama',
    'Manao ahoana?',
    'Misaotra',
    'Azafady',
    'Mandrosoa',
    'Mipetrapetraha',
    'Haody oh',
    'Ndao',
    'Veloma'
  ];

  function allRowsForTab(tab) {
    var rows = [];
    if (tab === 'words' || tab === 'voice' || tab === 'edited') {
      core.data.vocabulary.forEach(function (w) {
        var key = 'word:' + w.id;
        rows.push({
          key: key,
          kind: 'Word',
          where: (w.themes && w.themes[0]) ? core.themeTitle(w.themes[0]) : (w.pos || 'Dictionary'),
          item: w,
          speakOpts: { wordId: w.id, editKey: key }
        });
      });
    }
    if (tab === 'phrases' || tab === 'voice' || tab === 'edited') {
      core.data.phrases.forEach(function (p) {
        var key = 'phrase:' + p.id;
        rows.push({
          key: key,
          kind: 'Phrase',
          where: p.group || '',
          item: p,
          speakOpts: { wordId: p.id, phraseId: p.id, editKey: key }
        });
      });
    }
    if (tab === 'sentences' || tab === 'voice' || tab === 'edited') {
      core.data.dialogues.forEach(function (d) {
        (d.lines || []).forEach(function (line, idx) {
          var key = 'dlg:' + d.id + ':' + idx;
          rows.push({
            key: key,
            kind: 'Sentence',
            where: d.title,
            item: line,
            speakOpts: { line: d.id + ':' + idx, editKey: key }
          });
        });
      });
    }
    if (tab === 'voice') {
      rows = rows.filter(function (r) {
        return Boolean(S.speech && S.speech.hasCustomAudio && S.speech.hasCustomAudio(r.key));
      });
    } else if (tab === 'edited') {
      rows = rows.filter(function (r) {
        var hasAud = S.speech && S.speech.hasCustomAudio && S.speech.hasCustomAudio(r.key);
        return Boolean(r.item.pron_edited || core.getEdit(r.key) || hasAud);
      });
    }
    var q = ui.norm(state.q);
    if (q) {
      rows = rows.filter(function (r) {
        return ui.norm(r.item.mg).indexOf(q) !== -1 ||
               ui.norm(r.item.id || '').indexOf(q) !== -1 ||
               ui.norm(r.item.pron || '').indexOf(q) !== -1 ||
               ui.norm(r.item.en || '').indexOf(q) !== -1 ||
               ui.norm(r.where || '').indexOf(q) !== -1;
      });
    }
    return rows;
  }

  function renderCard(r) {
    var item = r.item;
    var ed = core.getEdit ? (core.getEdit(r.key) || {}) : {};
    var hasAudio = S.speech && S.speech.hasCustomAudio ? S.speech.hasCustomAudio(r.key) : false;
    var edited = Boolean(item.pron_edited || ed.note || hasAudio);
    var extra = (r.speakOpts.wordId ? ' data-word-id="' + ui.esc(r.speakOpts.wordId) + '"' : '') +
                (r.speakOpts.line ? ' data-line="' + ui.esc(r.speakOpts.line) + '"' : '');
    return '<article class="entry edit-card" data-row-key="' + ui.esc(r.key) + '">' +
      '<div style="width:100%">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
          '<span class="meta"><strong>' + ui.esc(r.kind) + '</strong>' +
            (r.where ? ' · ' + ui.esc(r.where) : '') +
            ' · <code>' + ui.esc(r.key) + '</code>' +
            ' <span class="checked" data-status-for="' + ui.esc(r.key) + '"' + (edited ? '' : ' hidden') + '>\u2713 ' + (hasAudio ? 'Using My Recorded Voice' : 'Saved') + '</span>' +
          '</span>' +
          '<div class="entry-tools">' +
            '<button class="icon-btn hear-btn" type="button" data-speak="' + ui.esc(item.mg) + '"' + extra + '>' +
              ui.icon('play') + '<span>' + (hasAudio ? 'Hear My Voice' : 'Listen') + '</span></button>' +
            '<button class="icon-btn slow" type="button" data-slow="' + ui.esc(item.mg) + '"' + extra + '>' +
              ui.icon('volume') + '<span>Syllables</span></button>' +
            '<button class="icon-btn record-mic-btn" type="button" data-record-audio-key="' + ui.esc(r.key) + '" style="border-color:#c93b2b;color:#c93b2b;font-weight:700">' +
              '\u25CF <span>' + (hasAudio ? 'Re-record my voice' : 'Record my voice') + '</span></button>' +
            '<label class="icon-btn" style="cursor:pointer">' +
              ui.icon('download') + '<span>' + (hasAudio ? 'Replace file' : 'Upload audio') + '</span>' +
              '<input type="file" accept="audio/*" data-upload-audio-key="' + ui.esc(r.key) + '" hidden>' +
            '</label>' +
            '<button class="icon-btn" type="button" data-download-audio-key="' + ui.esc(r.key) + '"' + (hasAudio ? '' : ' hidden') + ' title="Download your .wav recording">\u2B07 <span>.wav</span></button>' +
            '<button class="icon-btn" type="button" data-clear-audio-key="' + ui.esc(r.key) + '"' + (hasAudio ? '' : ' hidden') + '>Reset voice</button>' +
            '<button class="icon-btn" type="button" data-live-reset="' + ui.esc(r.key) + '"' + (item.pron_edited ? '' : ' hidden') + '>Reset text</button>' +
          '</div>' +
        '</div>' +
        '<div class="inline-edit-fields">' +
          '<label class="inline-edit-field">' +
            '<span>Malagasy (type to edit)</span>' +
            '<input type="text" class="inline-edit-mg" lang="mg" data-live-field="mg" data-live-key="' + ui.esc(r.key) + '" value="' + ui.esc(item.mg || '') + '">' +
          '</label>' +
          '<label class="inline-edit-field">' +
            '<span>Phonetics / pronunciation (type to edit)</span>' +
            '<input type="text" class="inline-edit-pron" data-live-field="pron" data-live-key="' + ui.esc(r.key) + '" placeholder="e.g. fah-hah-sah-lah-MAH-nah" value="' + ui.esc(item.pron || '') + '">' +
          '</label>' +
        '</div>' +
        '<label class="inline-edit-field" style="margin-top:8px;display:block">' +
          '<span>Voice pronunciation instructions (optional — for Coral / Sage / Ash)</span>' +
          '<input type="text" class="inline-edit-pron" data-live-field="note" data-live-key="' + ui.esc(r.key) + '" placeholder="e.g. say o like oo, drop final vowel softly, stress MAH" value="' + ui.esc(ed.note || '') + '">' +
        '</label>' +
        '<p class="en" style="margin-top:8px">' + ui.esc(item.en || '') + '</p>' +
      '</div>' +
    '</article>';
  }

  function tabBar() {
    var lineCount = core.data.dialogues.reduce(function (n, d) { return n + (d.lines ? d.lines.length : 0); }, 0);
    var voiceCount = (S.speech && S.speech.customAudioCount) ? S.speech.customAudioCount() : 0;
    var tabs = [
      ['words', 'Words (' + core.data.vocabulary.length.toLocaleString() + ')'],
      ['phrases', 'Phrases (' + core.data.phrases.length + ')'],
      ['sentences', 'Dialogue sentences (' + lineCount + ')'],
      ['voice', 'My Voice Recordings (' + voiceCount + ')'],
      ['edited', 'Edited (' + core.editCount() + ')']
    ];
    return tabs.map(function (t) {
      return '<button class="chip" type="button" data-edit-tab="' + t[0] + '" aria-pressed="' +
        (state.tab === t[0] ? 'true' : 'false') + '">' + ui.esc(t[1]) + '</button>';
    }).join('');
  }

  function paintList(scope) {
    var list = allRowsForTab(state.tab);
    var shown = list.slice(0, state.limit);
    var holder = scope.querySelector('#editList');
    var countNode = scope.querySelector('#editCount');
    var moreBtn = scope.querySelector('#editMore');
    var tabsNode = scope.querySelector('#editTabs');
    if (tabsNode) tabsNode.innerHTML = tabBar();
    if (!holder) return;
    holder.innerHTML = shown.length
      ? shown.map(renderCard).join('')
      : '<p class="empty">No entries match this filter.</p>';
    if (countNode) {
      var vCount = (S.speech && S.speech.customAudioCount) ? S.speech.customAudioCount() : 0;
      countNode.textContent = list.length.toLocaleString() + ' ' + ui.plural(list.length, 'entry', 'entries') +
        (list.length > shown.length ? ', showing ' + shown.length : '') +
        ' · ' + vCount + ' custom voice recording(s) · ' + core.editCount() + ' text edit(s)';
    }
    if (moreBtn) moreBtn.hidden = list.length <= shown.length;
  }

  function render(parts) {
    if (parts && parts[1]) {
      var p1 = parts[1];
      if (p1 === 'words' || p1 === 'phrases' || p1 === 'sentences' || p1 === 'voice' || p1 === 'edited') {
        state.tab = p1;
        if (parts[2] !== undefined) state.q = decodeURIComponent(parts[2]);
      } else {
        state.q = decodeURIComponent(p1);
      }
    }

    return '<div>' +
      '<p style="margin-bottom:8px"><a class="cta-link" href="#/settings">&larr; Back to Settings</a></p>' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px">' +
        '<div>' +
          '<h1>Record My Voice &amp; Edit Malagasy</h1>' +
          '<p class="lead">Click <strong>\u25CF Record my voice</strong> on any word (like <strong lang="mg">Fahasalamana</strong>) to record directly from your microphone, or upload an audio file. Your voice will immediately be used across the entire app.</p>' +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn" type="button" id="exportVoiceBtn">' +
            ui.icon('download') + 'Export My Voice (.json)</button>' +
          '<label class="btn btn-secondary" style="cursor:pointer">' +
            'Import Voice (.json)' +
            '<input type="file" accept=".json,application/json" id="importVoiceInput" hidden>' +
          '</label>' +
          '<button class="btn btn-quiet" type="button" id="exportEditsBtn">' +
            ui.icon('download') + 'Export text edits (.tsv)</button>' +
        '</div>' +
      '</div>' +

      '<section class="panel" style="margin:14px 0 18px;padding:14px 18px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px">' +
          '<strong style="font-size:0.95rem">\u25CF Quick-Jump to Record Common Words:</strong>' +
          '<span class="meta">Click a word below to filter, then press <strong>\u25CF Record my voice</strong></span>' +
        '</div>' +
        '<div class="chips">' +
          QUICK_VOICE_WORDS.map(function (w) {
            return '<button class="chip" type="button" data-quick-voice-word="' + ui.esc(w) + '">' + ui.esc(w) + '</button>';
          }).join('') +
          (state.q ? '<button class="chip" type="button" data-quick-voice-word="">Show all (' + core.data.vocabulary.length.toLocaleString() + ')</button>' : '') +
        '</div>' +
      '</section>' +

      '<div class="filter-row">' +
        '<div class="search-wrap">' + ui.icon('search') +
          '<input type="search" id="editSearch" placeholder="Search any word to record (e.g. fahasalamana, salama, misaotra)…" aria-label="Search entries" value="' + ui.esc(state.q) + '">' +
        '</div>' +
      '</div>' +
      '<div class="chips" id="editTabs">' + tabBar() + '</div>' +
      '<p class="result-count" id="editCount"></p>' +
      '<div class="entry-list" id="editList"></div>' +
      '<div style="margin-top:24px"><button class="btn btn-quiet" type="button" id="editMore" hidden>Show more entries</button></div>' +
    '</div>';
  }

  function mount(root) {
    var scope = root.firstElementChild || root;
    paintList(scope);

    scope.addEventListener('click', function (event) {
      var quickBtn = event.target.closest('[data-quick-voice-word]');
      if (quickBtn) {
        state.q = quickBtn.getAttribute('data-quick-voice-word') || '';
        state.tab = 'words';
        state.limit = PAGE;
        var sInput = scope.querySelector('#editSearch');
        if (sInput) sInput.value = state.q;
        paintList(scope);
        return;
      }

      var recBtn = event.target.closest('[data-record-audio-key]');
      if (recBtn) {
        var rKey = recBtn.getAttribute('data-record-audio-key');
        if (S.speech && S.speech.toggleMicRecording) {
          S.speech.toggleMicRecording(rKey, recBtn, function () {
            paintList(scope);
          });
        }
        return;
      }

      var dlBtn = event.target.closest('[data-download-audio-key]');
      if (dlBtn) {
        var dKey = dlBtn.getAttribute('data-download-audio-key');
        if (S.speech && S.speech.downloadCustomWav) {
          S.speech.downloadCustomWav(dKey);
        }
        return;
      }

      var tabBtn = event.target.closest('[data-edit-tab]');
      if (tabBtn) {
        state.tab = tabBtn.getAttribute('data-edit-tab');
        state.limit = PAGE;
        paintList(scope);
        return;
      }
      if (event.target.closest('#editMore')) {
        state.limit += PAGE;
        paintList(scope);
        return;
      }
      if (event.target.closest('#exportVoiceBtn')) {
        var vc = (S.speech && S.speech.exportCustomAudioBundle) ? S.speech.exportCustomAudioBundle() : 0;
        if (!vc) ui.toast('No voice recordings yet — click "Record my voice" on any word first.');
        else ui.toast('Exported ' + vc + ' voice recording(s) to salama_my_voice_recordings.json.');
        return;
      }
      if (event.target.closest('#exportEditsBtn')) {
        var n = core.exportEditsTSV();
        if (!n) ui.toast('No manual edits to export yet — type in any box first.');
        else ui.toast('Exported ' + n + ' edit(s) to salama_corrections.tsv.');
        return;
      }
      var clearAudioBtn = event.target.closest('[data-clear-audio-key]');
      if (clearAudioBtn) {
        var cKey = clearAudioBtn.getAttribute('data-clear-audio-key');
        if (S.speech && S.speech.removeCustomAudio) {
          S.speech.removeCustomAudio(cKey, function () {
            paintList(scope);
            ui.toast('Restored default audio recording.');
          });
        }
        return;
      }
      var resetBtn = event.target.closest('[data-live-reset]');
      if (resetBtn) {
        var resetKey = resetBtn.getAttribute('data-live-reset');
        core.resetEdit(resetKey);
        paintList(scope);
        ui.toast('Restored original Malagasy & phonetics.');
        return;
      }
      var speakNode = event.target.closest('[data-speak],[data-slow]');
      if (speakNode) {
        ui.speakFrom(event);
      }
    });

    scope.addEventListener('change', function (event) {
      if (event.target.id === 'importVoiceInput' && event.target.files && event.target.files[0]) {
        var vFile = event.target.files[0];
        var vReader = new FileReader();
        vReader.onload = function () {
          if (S.speech && S.speech.importCustomAudioBundle) {
            S.speech.importCustomAudioBundle(String(vReader.result), function (count) {
              paintList(scope);
              ui.toast('Imported ' + count + ' custom voice recording(s)!');
            });
          }
        };
        vReader.readAsText(vFile);
        return;
      }
      var upKey = event.target.getAttribute && event.target.getAttribute('data-upload-audio-key');
      if (upKey && event.target.files && event.target.files[0]) {
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function () {
          if (S.speech && S.speech.saveCustomAudio) {
            S.speech.saveCustomAudio(upKey, String(reader.result), function () {
              paintList(scope);
              ui.toast('Saved your custom audio recording for ' + upKey + '!');
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });

    scope.addEventListener('input', function (event) {
      if (event.target.id === 'editSearch') {
        state.q = event.target.value;
        state.limit = PAGE;
        paintList(scope);
        return;
      }
      var key = event.target.getAttribute('data-live-key');
      var field = event.target.getAttribute('data-live-field');
      if (!key || !field) return;
      var card = event.target.closest('[data-row-key]');
      var mgInput = card ? card.querySelector('[data-live-field="mg"]') : null;
      var pronInput = card ? card.querySelector('[data-live-field="pron"]') : null;
      var noteInput = card ? card.querySelector('[data-live-field="note"]') : null;
      core.saveEdit(key, {
        mg: mgInput ? mgInput.value : undefined,
        pron: pronInput ? pronInput.value : undefined,
        note: noteInput ? noteInput.value : undefined
      });
      var item = core.entryForKey(key);
      var edited = Boolean(item && item.pron_edited);
      if (card) {
        var status = card.querySelector('[data-status-for]');
        if (status) status.hidden = !edited;
        var rst = card.querySelector('[data-live-reset]');
        if (rst) rst.hidden = !edited;
        var spk = card.querySelectorAll('[data-speak]');
        for (var i = 0; i < spk.length; i++) spk[i].setAttribute('data-speak', item.mg || '');
        var slw = card.querySelectorAll('[data-slow]');
        for (var j = 0; j < slw.length; j++) slw[j].setAttribute('data-slow', item.mg || '');
      }
      var tabsNode = scope.querySelector('#editTabs');
      if (tabsNode) tabsNode.innerHTML = tabBar();
    });
  }

  S.views = S.views || {};
  S.views.edit = { render: render, mount: mount, nav: 'edit' };
})(window.Salama);
