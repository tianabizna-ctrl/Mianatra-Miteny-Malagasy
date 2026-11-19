/* Salama! lesson runner: read, write, recall, listen and speak. */
(function (S) {
  'use strict';
  var ui = S.ui;
  var study = S.study;
  var STEPS = [
    { id: 'read', title: 'Learn & read', skill: 'reading' },
    { id: 'words', title: 'Vocabulary', skill: 'reading' },
    { id: 'write', title: 'Writing', skill: 'writing' },
    { id: 'drills', title: 'Drills', skill: 'drills' },
    { id: 'listen', title: 'Listening', skill: 'listening' },
    { id: 'speak', title: 'Speaking', skill: 'speaking' }
  ];

  function read(lesson) {
    return '<section class="study-panel"><h2>The patterns to notice</h2><ol class="study-notes">' +
      lesson.notes.map(function (note) { return '<li>' + ui.esc(note) + '</li>'; }).join('') + '</ol></section>' +
      (lesson.id === 'theme_1' ? familyDiagram() : '') +
      '<section class="study-panel"><h2>Examples in context</h2><div class="study-examples">' + lesson.examples.map(function (example) {
        return '<div><p class="mg-line" lang="mg">' + ui.esc(example.mg) + '</p><p class="en-line">' + ui.esc(example.en) + '</p></div>';
      }).join('') + '</div></section>' +
      '<section class="study-panel"><h2>' + (lesson.longReading ? 'Read the complete situation' : 'Read it without the translation') +
      '</h2><div class="study-reading" lang="mg">' + lesson.reading.map(function (line) { return '<p>' + ui.esc(line) + '</p>'; }).join('') +
      '</div><p class="meta">Read once for the meaning, then again to notice the word order. Check the vocabulary tab for unfamiliar words.</p></section>';
  }

  function familyDiagram() {
    return '<section class="study-panel"><h2>Three generations, Official Malagasy</h2>' +
      '<div class="study-family-tree" role="group" aria-label="A family across three generations">' +
      '<div><strong lang="mg">Dadabe</strong><small>Grandfather</small></div><div><strong lang="mg">Renibe</strong><small>Grandmother</small></div>' +
      '<p class="study-family-generation">Parents · <span lang="mg">Ray aman-dreny</span></p>' +
      '<div><strong lang="mg">Ray</strong><small>Father</small></div><div><strong lang="mg">Reny</strong><small>Mother</small></div>' +
      '<p class="study-family-generation">Children · <span lang="mg">Zanaka</span></p>' +
      '<div><strong lang="mg">Zoky</strong><small>Elder sibling</small></div><div><strong lang="mg">Zandry</strong><small>Younger sibling</small></div></div>' +
      '<p class="meta">A child of the parents is a <span lang="mg">zafikely</span> (grandchild) of the grandparents. Use the vocabulary tab for sibling, aunt, uncle and in-law terms.</p></section>';
  }

  function words(lesson) {
    return '<section class="study-panel"><h2>Words for this situation</h2><p class="meta">Learn each word, listen to its pronunciation, and explore the dictionary for more practice.</p>' +
      '<div class="study-word-grid">' + lesson.vocabulary.map(function (word) {
        return '<div class="study-word"><strong lang="mg">' + ui.esc(word.mg) + '</strong><p>' + ui.esc(word.en) + '</p>' +
          (word.wordId ? ui.speakButtons(word.mg, { wordId: word.wordId }) : '') + '</div>';
      }).join('') + '</div><div class="btn-row"><a class="btn btn-secondary" href="#/dictionary/' + lesson.theme + '">Explore this dictionary topic</a>' +
      '<a class="btn btn-quiet" href="#/quiz">Open the vocabulary quiz →</a></div></section>';
  }

  function write(lesson) {
    return '<section class="study-panel"><h2>Make it your own</h2><p class="study-task">' + ui.esc(lesson.task) + '</p>' +
      '<label class="study-draft-label" for="studyDraft">Your Official Malagasy draft</label>' +
      '<textarea id="studyDraft" rows="9" maxlength="8000" placeholder="Write your answer here…" spellcheck="false" lang="mg">' + ui.esc(study.draft(lesson.id)) + '</textarea>' +
      '<p id="studyDraftStatus" class="meta" role="status">Drafts are saved on this device and included in progress backups.</p>' +
      '<details class="study-hint"><summary>Writing checklist & example patterns</summary><ul><li>Keep the situation and meaning clear.</li>' +
      '<li>Check the subject position, tense and pronouns.</li><li>Use the Official Malagasy words in the vocabulary tab.</li></ul>' +
      lesson.examples.map(function (e) { return '<p lang="mg">' + ui.esc(e.mg) + '</p>'; }).join('') +
      '<p class="meta">Your free writing is not automatically graded. Review it with a teacher or compare the patterns yourself.</p></details></section>';
  }

  function drills(lesson) {
    return '<section class="study-panel"><h2>Recall & transform</h2><p class="meta">Try the exercise before checking. Capitalisation, punctuation and apostrophe style do not affect matching. Other valid wording may not match the sample: use the feedback to compare, not as an automatic fluency grade.</p>' +
      '<form id="studyDrills" class="study-drill-form">' + lesson.drills.map(function (drill, index) {
        return '<div class="study-drill"><label for="studyAnswer' + index + '"><span class="meta">' + (index + 1) + '.</span> ' + ui.esc(drill.prompt) + '</label>' +
          '<input id="studyAnswer' + index + '" data-answer="' + index + '" type="text" lang="mg" autocomplete="off" spellcheck="false" required>' +
          '<p id="studyFeedback' + index + '" class="study-feedback" hidden></p></div>';
      }).join('') + '<button class="btn" type="submit">Check model answers</button>' +
      '<p id="studyScore" class="meta" role="status"></p></form></section>';
  }

  function listen(lesson) {
    var words = lesson.listeningWords.map(function (id) { return S.core.wordById(id); }).filter(Boolean);
    if (!words.length) return '<section class="study-panel"><h2>Listening</h2><p>Audio is not available for this lesson yet.</p><a class="btn btn-secondary" href="#/skills/listening">Explore listening lessons →</a></section>';
    return '<section class="study-panel"><h2>Listen, then reveal</h2><p class="meta">Tap a number, listen, write what you heard on paper, then reveal the word and its meaning.</p>' +
      '<div class="study-listening">' + words.map(function (word, index) {
        return '<div class="study-listen-card"><button class="btn btn-secondary" data-listen-word="' + ui.esc(word.id) + '" type="button">' + ui.icon('volume') + ' Listen ' + (index + 1) + '</button>' +
          '<details><summary>Reveal word & meaning</summary><p class="mg-line" lang="mg">' + ui.esc(word.mg) + '</p><p>' + ui.esc(word.en) + '</p></details></div>';
      }).join('') + '</div><p id="studyAudioStatus" class="meta" role="status"></p></section>';
  }

  function speak(lesson) {
    var recordedWord = lesson.vocabulary.filter(function (word) { return word.wordId; })[0];
    return '<section class="study-panel"><h2>Use the situation aloud</h2><p class="study-task">' + ui.esc(lesson.task) + '</p>' +
      '<ol class="study-notes"><li>Read the examples aloud once, then hide them.</li><li>Use the situation with a partner, or play both roles yourself.</li>' +
      '<li>Change a person, object, time or place while keeping the pattern.</li><li>Check your word choices and try again without reading.</li></ol>' +
      '<details class="study-hint"><summary>Show useful example sentences</summary>' + lesson.examples.map(function (e) {
        return '<p lang="mg">' + ui.esc(e.mg) + '</p>';
      }).join('') + '</details><a class="btn btn-secondary" href="#/record/' + ui.esc(recordedWord ? recordedWord.wordId : 'salama') + '">Open the voice-recording studio →</a>' +
      '<p class="meta">The studio records existing dictionary entries. New free-form roleplays are not automatically transcribed or pronunciation-scored.</p></section>';
  }

  function render(parts) {
    var lesson = study.lesson(parts[1]);
    if (!lesson) return '<div class="view-narrow"><h1>Lesson not found</h1><p class="lead">Choose a lesson from the learning pathways.</p><a class="btn" href="#/learn">All levels</a></div>';
    var step = STEPS.filter(function (s) { return s.id === parts[2]; })[0] || STEPS[0];
    var next = study.next(lesson.id);
    var panels = { read: read, words: words, write: write, drills: drills, listen: listen, speak: speak };
    var sideSkill = step.id === 'read' && lesson.topic === 'grammar' ? 'grammar' : step.skill;
    return '<div class="study-layout">' + S.studyUi.sidebar(sideSkill) + '<article class="study-content">' +
      '<a class="study-back" href="#/learn/' + lesson.level + '">← ' + ui.esc(lesson.level) + ' pathway</a>' +
      '<header class="study-lesson-header"><p class="section-eyebrow">Official Malagasy · ' + lesson.minutes + ' minute lesson</p><h1>' + ui.esc(lesson.title) + '</h1>' +
      '<p class="meta"><span id="studyDoneLabel">' + (study.isDone(lesson.id) ? '✓ Studied' : 'Not marked studied') + '</span></p></header>' +
      '<nav class="study-steps" aria-label="Lesson activities">' + STEPS.filter(function (s) { return s.id !== 'listen' || lesson.listeningWords.length; }).map(function (s) {
        return '<a href="#/study/' + lesson.id + '/' + s.id + '"' + (s.id === step.id ? ' aria-current="page"' : '') + '>' + s.title + '</a>';
      }).join('') + '</nav>' + panels[step.id](lesson) +
      '<div class="study-finish"><button class="btn" id="studyComplete" type="button" aria-pressed="' + study.isDone(lesson.id) + '">' +
      (study.isDone(lesson.id) ? 'Mark as not studied' : 'Mark lesson studied') + '</button>' +
      (next ? '<a class="btn btn-secondary" href="#/study/' + next.id + '/read">Next lesson →</a>' : '<a class="btn btn-secondary" href="#/learn">Explore another level →</a>') +
      '<p class="meta">Studied is a self-reported completion, not a proficiency score. Drill results and drafts are tracked separately.</p></div>' +
      '<section class="study-related"><h2>Where this fits in your course</h2><div class="btn-row">' + lesson.relatedWeeks.map(function (week) {
        return '<a class="btn btn-quiet btn-sm" href="#/course/' + week + '">Beginner course · Week ' + week + '</a>';
      }).join('') + '</div></section></article></div>';
  }

  function mount(root, parts) {
    var lesson = study.lesson(parts[1]);
    if (!lesson) return;
    var complete = root.querySelector('#studyComplete');
    if (complete) complete.addEventListener('click', function () {
      study.mark(lesson.id, !study.isDone(lesson.id));
      var done = study.isDone(lesson.id);
      complete.setAttribute('aria-pressed', String(done));
      complete.textContent = done ? 'Mark as not studied' : 'Mark lesson studied';
      root.querySelector('#studyDoneLabel').textContent = done ? '✓ Studied' : 'Not marked studied';
      ui.toast(done ? 'Lesson marked studied. Progress saved.' : 'Lesson marked not studied.');
    });
    var draft = root.querySelector('#studyDraft');
    if (draft) draft.addEventListener('input', function () {
      study.draft(lesson.id, draft.value);
      root.querySelector('#studyDraftStatus').textContent = 'Draft saved on this device.';
    });
    var form = root.querySelector('#studyDrills');
    if (form) form.addEventListener('submit', function (event) {
      event.preventDefault();
      var correct = 0;
      var answered = 0;
      lesson.drills.forEach(function (drill, index) {
        var value = root.querySelector('#studyAnswer' + index).value;
        if (value.trim()) answered++;
        var matches = study.matches(value, drill.answers);
        if (matches) correct++;
        var feedback = root.querySelector('#studyFeedback' + index);
        feedback.hidden = false;
        feedback.className = 'study-feedback ' + (matches ? 'is-match' : 'is-compare');
        feedback.textContent = (matches ? '✓ Matches the sample. ' : 'Compare with the sample: ' + drill.answers[0] + ' — ') + drill.explanation;
      });
      if (answered === lesson.drills.length) study.record(lesson.id, correct, lesson.drills.length);
      root.querySelector('#studyScore').textContent = answered < lesson.drills.length ? 'Answer all questions before a result is saved.' :
        correct + ' of ' + lesson.drills.length + ' exact sample matches. Result saved; other valid phrasing may differ.';
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-listen-word]'), function (button) {
      button.addEventListener('click', function () {
        S.speech.speakWordId(button.getAttribute('data-listen-word'));
        root.querySelector('#studyAudioStatus').textContent = 'Use Reveal to compare what you heard.';
      });
    });
    // The router replaces main's contents, not main itself. Bind to the new
    // article so old speech handlers disappear when navigating to another lesson.
    var scope = root.querySelector('.study-content');
    if (scope) scope.addEventListener('click', function (event) { ui.speakFrom(event); });
  }

  S.views.study = { render: render, mount: mount, nav: 'skills' };
})(window.Salama);
