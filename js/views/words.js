/* Reference: Full 2,198+ Word Malagasy <-> English Dictionary (Rakibolana), phrases, dialogues. */
(function (S) {
  'use strict';
  var core = S.core;
  var ui = S.ui;
  var speech = S.speech;

  var PAGE = 100;
  var CHIP_LIMIT = 9;
  var words = {
    q: '',
    theme: 'all',
    pos: 'all',
    letter: 'all',
    sort: 'mg', // 'mg' | 'en' | 'topic'
    limit: PAGE
  };
  var phrases = { q: '', group: 'all', limit: 60 };
  var topicsExpanded = false;
  var groupsExpanded = false;

  var MG_LETTERS = ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'V', 'Z'];
  var EN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z'];

  var POS_LABELS = {
    n: 'Noun',
    v: 'Verb',
    adj: 'Adjective',
    adv: 'Adverb / Prep',
    pron: 'Pronoun',
    conj: 'Conjunction',
    interj: 'Interjection'
  };

  function allVocabulary() {
    return (core && core.data && core.data.vocabulary) ? core.data.vocabulary : [];
  }

  function firstAlpha(str) {
    var m = String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[A-Za-z]/);
    return m ? m[0].toUpperCase() : '';
  }

  /* ---------------- words / dictionary ---------------- */
  function wordEntry(w, index) {
    var primaryTheme = (w.themes && w.themes[0]) || w.theme || '';
    var badgeText = primaryTheme
      ? ((core.themeTitle && core.themeTitle(primaryTheme)) || primaryTheme)
      : 'General Dictionary';
    var posLabel = w.pos ? (POS_LABELS[w.pos] || w.pos) : (w.isPhrase ? 'Expression' : 'Dictionary');
    var num = typeof index === 'number' ? String(index + 1).padStart(2, '0') + ' \u2022 ' : '';
    return '<article class="entry">' +
      '<div class="entry-top">' +
        '<span class="entry-badge">' + num + ui.esc(badgeText) + '</span>' +
        '<span class="entry-lesson">' + ui.esc(posLabel) + '</span>' +
      '</div>' +
      '<div>' +
        '<p class="mg-line" lang="mg">' + ui.esc(w.mg) + '</p>' +
        (w.pron ? '<p class="say"><span class="say-label">Phonetic:</span> ' + ui.esc(w.pron) + ui.pronunciationTag(w) + '</p>' : '') +
        '<p class="en">' + ui.esc(w.en) + (w.pos ? ' <span class="meta">(' + ui.esc(w.pos) + ')</span>' : '') + '</p>' +
        (w.mg_alt && w.mg_alt.length ? '<p class="alt">Also written: <span lang="mg">' + ui.esc(w.mg_alt.join(', ')) + '</span></p>' : '') +
        (w.alt && w.alt.length ? '<p class="alt">Also: ' + ui.esc(w.alt.join('; ')) + '</p>' : '') +
        (w.note ? '<p class="note">' + ui.esc(w.note) + '</p>' : '') +
      '</div>' +
      '<div class="entry-tools">' + ui.speakButtons(w.mg, { wordId: w.id }) + '</div>' +
      '</article>';
  }

  function matchesTheme(w, theme) {
    if (!theme || theme === 'all') return true;
    var ts = w.themes || [];
    if (theme === '__dictionary__') return ts.length === 0;
    return ts.indexOf(theme) !== -1 || w.theme === theme;
  }

  function matchesPos(w, posFilter) {
    if (!posFilter || posFilter === 'all') return true;
    if (posFilter === 'expr') return !w.pos;
    if (posFilter === 'pron_conj') return w.pos === 'pron' || w.pos === 'conj' || w.pos === 'interj';
    return w.pos === posFilter;
  }

  function matchesLetter(w, letter) {
    if (!letter || letter === 'all') return true;
    var target = words.sort === 'en' ? w.en : w.mg;
    return firstAlpha(target) === letter.toUpperCase();
  }

  function filteredWords() {
    var q = ui.norm(words.q);
    var list = allVocabulary().filter(function (w) {
      if (!matchesTheme(w, words.theme)) return false;
      if (!matchesPos(w, words.pos)) return false;
      if (!matchesLetter(w, words.letter)) return false;
      if (!q) return true;
      if (ui.norm(w.mg).indexOf(q) !== -1) return true;
      if (ui.norm(w.en).indexOf(q) !== -1) return true;
      if (w.pron && ui.norm(w.pron).indexOf(q) !== -1) return true;
      if ((w.mg_alt || []).some(function (a) { return ui.norm(a).indexOf(q) !== -1; })) return true;
      return (w.alt || []).some(function (a) { return ui.norm(a).indexOf(q) !== -1; });
    });

    if (words.sort === 'mg') {
      list = list.slice().sort(function (a, b) {
        return ui.norm(a.mg).localeCompare(ui.norm(b.mg));
      });
    } else if (words.sort === 'en') {
      list = list.slice().sort(function (a, b) {
        return ui.norm(a.en).localeCompare(ui.norm(b.en));
      });
    }
    return list;
  }

  function paintWords() {
    var list = filteredWords();
    var shown = list.slice(0, words.limit);
    var listNode = document.getElementById('wordList');
    var countNode = document.getElementById('wordCount');
    var moreBtn = document.getElementById('wordMore');
    var allBtn = document.getElementById('wordShowAll');
    if (!listNode) return;
    listNode.innerHTML = list.length
      ? shown.map(wordEntry).join('')
      : '<p class="empty">No dictionary entries match those filters. Try clicking "Reset filters" or searching with fewer letters.</p>';
    if (countNode) {
      countNode.textContent = list.length + ' ' + ui.plural(list.length, 'dictionary entry', 'dictionary entries') +
        (list.length > shown.length ? ' (showing ' + shown.length + ' of ' + list.length + ')' : ' (showing all ' + list.length + ')');
    }
    if (moreBtn) moreBtn.hidden = list.length <= shown.length;
    if (allBtn) {
      allBtn.hidden = list.length <= shown.length;
      allBtn.textContent = 'Show all ' + list.length + ' entries';
    }
  }

  function topicCounts() {
    var counts = { all: 0, __dictionary__: 0 };
    allVocabulary().forEach(function (w) {
      counts.all += 1;
      var ts = w.themes || [];
      if (!ts.length) counts.__dictionary__ += 1;
      ts.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    });
    return counts;
  }

  function topicChips() {
    var counts = topicCounts();
    var topics = core.data.themeMap || [];
    var visible = topicsExpanded ? topics : topics.slice(0, CHIP_LIMIT);
    var more = topics.length > CHIP_LIMIT
      ? '<button class="chip" type="button" data-expand-topics="true">' +
        (topicsExpanded ? 'Fewer topics' : 'More topics (' + (topics.length - CHIP_LIMIT) + ')') + '</button>'
      : '';
    return '<button class="chip" type="button" data-word-theme="all" aria-pressed="' +
      (words.theme === 'all' ? 'true' : 'false') + '">All dictionary entries (' + counts.all + ')</button>' +
      '<button class="chip" type="button" data-word-theme="__dictionary__" aria-pressed="' +
      (words.theme === '__dictionary__' ? 'true' : 'false') + '">Core A\u2013Z Dictionary (' + counts.__dictionary__ + ')</button>' +
      visible.map(function (t) {
        var c = counts[t.id] || t.count || 0;
        return '<button class="chip" type="button" data-word-theme="' + t.id + '" aria-pressed="' +
          (words.theme === t.id ? 'true' : 'false') + '">' + ui.esc(t.title) + ' (' + c + ')</button>';
      }).join('') + more;
  }

  function posChips() {
    var vocab = allVocabulary();
    var cN = 0, cV = 0, cAdj = 0, cAdv = 0, cPron = 0, cExpr = 0;
    vocab.forEach(function (w) {
      if (w.pos === 'n') cN += 1;
      else if (w.pos === 'v') cV += 1;
      else if (w.pos === 'adj') cAdj += 1;
      else if (w.pos === 'adv') cAdv += 1;
      else if (w.pos === 'pron' || w.pos === 'conj' || w.pos === 'interj') cPron += 1;
      else cExpr += 1;
    });
    var items = [
      { id: 'all', label: 'All types (' + vocab.length + ')' },
      { id: 'n', label: 'Nouns (' + cN + ')' },
      { id: 'v', label: 'Verbs (' + cV + ')' },
      { id: 'adj', label: 'Adjectives (' + cAdj + ')' },
      { id: 'adv', label: 'Adverbs & Prep (' + cAdv + ')' },
      { id: 'pron_conj', label: 'Pronouns & Conj (' + cPron + ')' },
      { id: 'expr', label: 'Course Words & Expressions (' + cExpr + ')' }
    ];
    return items.map(function (it) {
      return '<button class="chip" type="button" data-word-pos="' + it.id + '" aria-pressed="' +
        (words.pos === it.id ? 'true' : 'false') + '">' + ui.esc(it.label) + '</button>';
    }).join('');
  }

  function sortChips() {
    var modes = [
      { id: 'mg', label: 'Malagasy A \u2192 Z' },
      { id: 'en', label: 'English A \u2192 Z' },
      { id: 'topic', label: 'Course Order' }
    ];
    return modes.map(function (m) {
      return '<button class="chip" type="button" data-word-sort="' + m.id + '" aria-pressed="' +
        (words.sort === m.id ? 'true' : 'false') + '">' + ui.esc(m.label) + '</button>';
    }).join('');
  }

  function alphabetBar() {
    var letters = words.sort === 'en' ? EN_LETTERS : MG_LETTERS;
    return '<button class="chip" type="button" data-word-letter="all" aria-pressed="' +
      (words.letter === 'all' ? 'true' : 'false') + '">All A\u2013Z</button>' +
      letters.map(function (L) {
        return '<button class="chip" type="button" data-word-letter="' + L + '" aria-pressed="' +
          (words.letter === L ? 'true' : 'false') + '">' + L + '</button>';
      }).join('');
  }

  function phraseChips() {
    var groups = core.data.phraseGroups;
    var visible = groupsExpanded ? groups : groups.slice(0, CHIP_LIMIT);
    var more = groups.length > CHIP_LIMIT
      ? '<button class="chip" type="button" data-expand-groups="true">' +
        (groupsExpanded ? 'Fewer situations' : 'More situations (' + (groups.length - CHIP_LIMIT) + ')') + '</button>'
      : '';
    return '<button class="chip" type="button" data-phrase-group="all" aria-pressed="' +
      (phrases.group === 'all' ? 'true' : 'false') + '">All situations (' + core.data.phrases.length + ')</button>' +
      visible.map(function (g) {
        return '<button class="chip" type="button" data-phrase-group="' + g.id + '" aria-pressed="' +
          (phrases.group === g.id ? 'true' : 'false') + '">' + ui.esc(g.title) + ' (' + g.count + ')</button>';
      }).join('') + more;
  }

  function applyRouteParams(parts) {
    if (!parts || !parts.length) return;
    // Support #/dictionary/A or #/dictionary/core or #/reference/words/A
    var param = parts[0] === 'dictionary' ? parts[1] : (parts[0] === 'reference' ? parts[2] : parts[1]);
    if (!param) return;
    if (param.length === 1 && /^[A-Za-z]$/.test(param)) {
      words.letter = param.toUpperCase();
      words.limit = PAGE;
    } else if (param === 'core' || param === '__dictionary__') {
      words.theme = '__dictionary__';
      words.limit = PAGE;
    } else if (param === 'all') {
      words.theme = 'all';
      words.pos = 'all';
      words.letter = 'all';
      words.limit = PAGE;
    } else if (POS_LABELS[param] || param === 'expr') {
      words.pos = param;
      words.limit = PAGE;
    }
  }

  function wordsView(parts) {
    applyRouteParams(parts);
    var totalWords = allVocabulary().length;
    return '<div>' +
      ui.referenceTabs('words') +
      '<p class="section-eyebrow" style="margin-bottom:6px">RAKIBOLANA \u2022 MALAGASY \u2194 ENGLISH DICTIONARY</p>' +
      '<h1>Malagasy \u2194 English Dictionary (' + totalWords.toLocaleString() + ' words)</h1>' +
      '<div class="filter-row" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">' +
        '<div class="search-wrap" style="flex:1;min-width:240px">' + ui.icon('search') +
          '<input type="search" id="wordSearch" placeholder="Search ' + totalWords.toLocaleString() + ' dictionary words in Malagasy, English, or phonetics\u2026" aria-label="Search dictionary" value="' + ui.esc(words.q) + '">' +
        '</div>' +
        '<div class="chips" id="wordSort" style="margin:0">' + sortChips() + '</div>' +
        '<a class="btn btn-secondary btn-sm" href="#/record/fahasalamana">\u25CF Record My Voice</a>' +
        '<button class="btn btn-quiet btn-sm" type="button" id="wordResetFilters">Reset filters</button>' +
      '</div>' +
      '<div class="chips" id="wordAlpha" style="margin-top:10px" aria-label="Filter by starting letter">' + alphabetBar() + '</div>' +
      '<div class="chips" id="wordPos" style="margin-top:8px" aria-label="Filter by part of speech">' + posChips() + '</div>' +
      '<div class="chips" id="wordTopics" style="margin-top:8px" aria-label="Filter by topic">' + topicChips() + '</div>' +
      '<p class="result-count" id="wordCount" style="margin-top:14px;font-weight:700"></p>' +
      '<div class="entry-list" id="wordList"></div>' +
      '<div class="btn-row" style="margin-top:24px">' +
        '<button class="btn btn-secondary" type="button" id="wordMore" hidden>Show 100 more words</button>' +
        '<button class="btn btn-quiet" type="button" id="wordShowAll" hidden>Show all entries</button>' +
      '</div>' +
      '</div>';
  }

  /* ---------------- phrases ---------------- */
  function phraseEntry(p, index) {
    var groupTitle = (core.themeTitle && p.group) ? core.themeTitle(p.group) : (p.group || 'Phrases');
    var num = typeof index === 'number' ? String(index + 1).padStart(2, '0') + ' \u2022 ' : '';
    return '<article class="entry">' +
      '<div class="entry-top">' +
        '<span class="entry-badge">' + num + ui.esc(groupTitle) + '</span>' +
        '<span class="entry-lesson">Phrasebook</span>' +
      '</div>' +
      '<div>' +
        '<p class="mg-line" lang="mg">' + ui.esc(p.mg) + '</p>' +
        (p.pron ? '<p class="say"><span class="say-label">Phonetic:</span> ' + ui.esc(p.pron) + ui.pronunciationTag(p) + '</p>' : '') +
        '<p class="en">' + ui.esc(p.en) + '</p>' +
        (p.note ? '<p class="note">' + ui.esc(p.note) + '</p>' : '') +
      '</div>' +
      '<div class="entry-tools">' + ui.speakButtons(p.mg, { wordId: p.id, phraseId: p.id }) + '</div>' +
      '</article>';
  }

  function filteredPhrases() {
    var q = ui.norm(phrases.q);
    return core.data.phrases.filter(function (p) {
      if (phrases.group !== 'all' && p.group !== phrases.group) return false;
      if (!q) return true;
      return ui.norm(p.mg).indexOf(q) !== -1 || ui.norm(p.en).indexOf(q) !== -1;
    });
  }

  function paintPhrases() {
    var list = filteredPhrases();
    var shown = list.slice(0, phrases.limit);
    var listNode = document.getElementById('phraseList');
    var countNode = document.getElementById('phraseCount');
    var moreBtn = document.getElementById('phraseMore');
    if (!listNode) return;
    listNode.innerHTML = list.length
      ? shown.map(phraseEntry).join('')
      : '<p class="empty">No phrases match that search.</p>';
    countNode.textContent = list.length + ' ' + ui.plural(list.length, 'phrase') +
      (list.length > shown.length ? ', showing ' + shown.length : '');
    moreBtn.hidden = list.length <= shown.length;
  }

  function dialogueList() {
    var q = ui.norm(phrases.q);
    var list = core.data.dialogues.filter(function (d) {
      if (!q) return true;
      if (ui.norm(d.title).indexOf(q) !== -1) return true;
      return d.lines.some(function (l) { return ui.norm(l.mg).indexOf(q) !== -1 || ui.norm(l.en).indexOf(q) !== -1; });
    });
    if (!list.length) return '';
    return '<h2>Dialogues (' + list.length + ')</h2><div class="entry-list">' + list.map(function (d) {
      return '<a class="grammar-item" href="#/dialogue/' + d.id + '">' +
        '<span class="t">' + ui.esc(d.title) + '</span>' +
        '<span class="m">' + d.lines.length + ' lines \u00b7 ' + ui.esc(core.themeTitle(d.group)) + '</span></a>';
    }).join('') + '</div>';
  }

  function phrasesView() {
    return '<div>' +
      ui.referenceTabs('phrases') +
      '<h1>Phrases &amp; dialogues</h1>' +
      '<p class="lead">' + core.data.phrases.length + ' phrases and ' + core.data.dialogues.length +
        ' recorded conversations, grouped by situation.</p>' +
      '<div class="filter-row">' +
        '<div class="search-wrap">' + ui.icon('search') +
          '<input type="search" id="phraseSearch" placeholder="Search phrases" aria-label="Search phrases" value="' + ui.esc(phrases.q) + '">' +
        '</div>' +
      '</div>' +
      '<div class="chips" id="phraseChips">' + phraseChips() + '</div>' +
      '<p class="result-count" id="phraseCount"></p>' +
      '<div class="entry-list" id="phraseList"></div>' +
      '<div style="margin-top:24px"><button class="btn btn-quiet" type="button" id="phraseMore" hidden>Show more phrases</button></div>' +
      '<div id="dialogueSection">' + dialogueList() + '</div>' +
      '</div>';
  }

  /* ---------------- one dialogue ---------------- */
  function dialogueView(id) {
    var dialogue = core.dialogue(id);
    if (!dialogue) return '<p class="empty">That dialogue was not found.</p>';
    return '<div class="view-narrow">' +
      '<p class="meta"><a class="cta-link" href="#/reference/phrases">Phrases &amp; dialogues</a></p>' +
      '<h1>' + ui.esc(dialogue.title) + '</h1>' +
      '<p class="meta">' + ui.esc(core.themeTitle(dialogue.group)) + ' \u00b7 ' + dialogue.lines.length + ' lines</p>' +
      '<div class="dialogue panel">' + dialogue.lines.map(function (line, index) {
        return '<div class="turn">' +
          '<span class="who">' + ui.esc(line.speaker || 'A') +
            (line.stage ? ' <span class="stage">(' + ui.esc(line.stage) + ')</span>' : '') + '</span>' +
          '<p class="line" lang="mg">' + ui.esc(line.mg) + '</p>' +
          (line.pron ? '<p class="say">' + ui.esc(line.pron) + ui.pronunciationTag(line) + '</p>' : '') +
          '<p class="trans">' + ui.esc(line.en) + '</p>' +
          '<div class="turn-tools">' +
            ui.speakButtons(line.mg, { line: id + ':' + index }) +
          '</div>' +
          '</div>';
      }).join('') + '</div>' +
      '</div>';
  }

  function refreshWordFilterBars(scope) {
    var topics = scope.querySelector('#wordTopics');
    if (topics) topics.innerHTML = topicChips();
    var posBox = scope.querySelector('#wordPos');
    if (posBox) posBox.innerHTML = posChips();
    var sortBox = scope.querySelector('#wordSort');
    if (sortBox) sortBox.innerHTML = sortChips();
    var alphaBox = scope.querySelector('#wordAlpha');
    if (alphaBox) alphaBox.innerHTML = alphabetBar();
  }

  /* ---------------- mount ---------------- */
  function mount(root, which) {
    var scope = root.querySelector('.view-narrow') || root.firstElementChild || root;
    if (!scope || !scope.addEventListener) scope = root;

    scope.addEventListener('click', function (event) {
      if (ui.speakFrom(event)) return;
      var chip = event.target.closest('[data-word-theme]');
      if (chip) {
        words.theme = chip.getAttribute('data-word-theme');
        words.limit = PAGE;
        refreshWordFilterBars(scope);
        paintWords();
        return;
      }
      var posBtn = event.target.closest('[data-word-pos]');
      if (posBtn) {
        words.pos = posBtn.getAttribute('data-word-pos');
        words.limit = PAGE;
        refreshWordFilterBars(scope);
        paintWords();
        return;
      }
      var sortBtn = event.target.closest('[data-word-sort]');
      if (sortBtn) {
        words.sort = sortBtn.getAttribute('data-word-sort');
        words.letter = 'all';
        words.limit = PAGE;
        refreshWordFilterBars(scope);
        paintWords();
        return;
      }
      var letterBtn = event.target.closest('[data-word-letter]');
      if (letterBtn) {
        words.letter = letterBtn.getAttribute('data-word-letter');
        words.limit = PAGE;
        refreshWordFilterBars(scope);
        paintWords();
        return;
      }
      if (event.target.closest('#wordResetFilters')) {
        words.q = '';
        words.theme = 'all';
        words.pos = 'all';
        words.letter = 'all';
        words.sort = 'mg';
        words.limit = PAGE;
        var searchInput = scope.querySelector('#wordSearch');
        if (searchInput) searchInput.value = '';
        refreshWordFilterBars(scope);
        paintWords();
        return;
      }
      if (event.target.closest('[data-expand-topics]')) {
        topicsExpanded = !topicsExpanded;
        var topicBox = scope.querySelector('#wordTopics');
        if (topicBox) topicBox.innerHTML = topicChips();
        return;
      }
      var group = event.target.closest('[data-phrase-group]');
      if (group) {
        phrases.group = group.getAttribute('data-phrase-group');
        phrases.limit = 60;
        var chipBox = scope.querySelector('#phraseChips');
        if (chipBox) chipBox.innerHTML = phraseChips();
        paintPhrases();
        var section = scope.querySelector('#dialogueSection');
        if (section) section.innerHTML = dialogueList();
        return;
      }
      if (event.target.closest('[data-expand-groups]')) {
        groupsExpanded = !groupsExpanded;
        var groupBox = scope.querySelector('#phraseChips');
        if (groupBox) groupBox.innerHTML = phraseChips();
        return;
      }
      if (event.target.closest('#wordMore')) { words.limit += PAGE; paintWords(); return; }
      if (event.target.closest('#wordShowAll')) { words.limit = 10000; paintWords(); return; }
      if (event.target.closest('#phraseMore')) { phrases.limit += 60; paintPhrases(); return; }
    });

    scope.addEventListener('input', function (event) {
      if (event.target.id === 'wordSearch') { words.q = event.target.value; words.limit = PAGE; paintWords(); }
      if (event.target.id === 'phraseSearch') {
        phrases.q = event.target.value;
        phrases.limit = 60;
        paintPhrases();
        var section = scope.querySelector('#dialogueSection');
        if (section) section.innerHTML = dialogueList();
      }
    });

    if (which === 'words') paintWords();
    if (which === 'phrases') paintPhrases();
  }

  S.views = S.views || {};
  S.views.words = {
    render: wordsView,
    mount: function (root) { mount(root, 'words'); },
    nav: 'dictionary'
  };
  S.views.dictionary = S.views.words;
  S.views.phrases = {
    render: phrasesView,
    mount: function (root) { mount(root, 'phrases'); },
    nav: 'reference'
  };
  S.views.dialogue = {
    render: function (parts) { return dialogueView(parts[1]); },
    mount: function (root) { mount(root, 'dialogue'); },
    nav: 'reference'
  };
})(window.Salama);
