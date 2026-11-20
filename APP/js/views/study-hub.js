/* Level pathways and a bilingual skills menu for the additive course. */
(function (S) {
  'use strict';
  var ui = S.ui;
  var study = S.study;
  var data = study.data;

  function sidebar(active) {
    return '<aside class="study-sidebar"><p class="study-sidebar-label">Skills</p>' +
      '<nav aria-label="Learning skills">' + data.skills.map(function (skill) {
        return '<a href="#/skills/' + skill.id + '"' + (active === skill.id ? ' aria-current="page"' : '') + '>' +
          '<span class="study-skill-icon" aria-hidden="true">' + skill.icon + '</span><span><strong>' +
          ui.esc(skill.title) + '</strong><small lang="mg">' + ui.esc(skill.mg) + '</small></span></a>';
      }).join('') + '</nav><a class="study-sidebar-all" href="#/learn">All learning levels →</a></aside>';
  }

  function nextOpenLesson(levelId) {
    return data.lessons.filter(function (lesson) { return !levelId || lesson.level === levelId; })
      .filter(function (lesson) { return !study.isDone(lesson.id); })[0] || null;
  }

  function quickStart() {
    var next = nextOpenLesson('beginner') || nextOpenLesson();
    var overall = study.count();
    var allDone = overall >= data.lessons.length;
    var featured = next || data.lessons[0];
    return '<section class="study-quick-start" aria-labelledby="studyStartTitle">' +
      '<div class="study-quick-copy"><p class="section-eyebrow">A good next step</p>' +
        '<h2 id="studyStartTitle">Keep your Malagasy moving</h2>' +
        '<p>' + (featured
          ? (allDone ? 'You have explored every skill lesson. Revisit <strong>' + ui.esc(featured.title) + '</strong> or choose another area to practise.'
            : 'Pick up with <strong>' + ui.esc(featured.title) + '</strong> — a short, practical lesson you can finish in about ' + featured.minutes + ' minutes.')
          : 'Choose a pathway and practise at your own pace.') + '</p>' +
        '<div class="btn-row"><a class="btn btn-lg" href="' + (featured ? '#/study/' + featured.id + '/read' : '#/learn') + '">' +
          (allDone ? 'Revisit a lesson' : (featured ? 'Start next lesson' : 'Choose a lesson')) + ' ' + ui.icon('arrow-right') + '</a>' +
          '<a class="btn btn-secondary" href="#/course">Continue 12-week course</a></div>' +
      '</div>' +
      '<div class="study-quick-stats"><div><strong>' + data.lessons.length + '</strong><span>skill lessons</span></div>' +
        '<div><strong>' + overall + '</strong><span>marked studied</span></div>' +
        '<p>Begin with a conversation, then explore a skill whenever you want.</p></div>' +
    '</section>';
  }

  function levelCards() {
    return '<div class="study-levels">' + data.levels.map(function (level, index) {
      var total = data.lessons.filter(function (l) { return l.level === level.id; }).length;
      var done = study.count(level.id);
      var percent = total ? Math.round(done * 100 / total) : 0;
      var next = nextOpenLesson(level.id);
      return '<a class="study-level-card" href="#/learn/' + level.id + '">' +
        '<span class="study-level-number">0' + (index + 1) + '</span><span class="study-level-count">' + total + ' lessons · ' + done + ' studied</span>' +
        '<h2>' + ui.esc(level.title) + '</h2><p>' + ui.esc(level.subtitle) + '</p>' +
        '<span class="study-level-progress" role="progressbar" aria-label="' + ui.esc(level.title) + ' progress" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '"><span style="width:' + percent + '%"></span></span>' +
        '<span class="study-level-next">' + (next ? 'Next · ' + ui.esc(next.title) : 'Pathway complete') + '</span>' +
        '<span class="study-card-go">Explore level <span aria-hidden="true">→</span></span></a>';
    }).join('') + '</div>';
  }

  function lessonCard(lesson, skill) {
    var step = { grammar: 'read', verbs: 'read', reading: 'read', writing: 'write', drills: 'drills', listening: 'listen', speaking: 'speak' }[skill] || 'read';
    var done = study.isDone(lesson.id);
    return '<a class="study-lesson-card" href="#/study/' + lesson.id + '/' + step + '">' +
      '<span class="study-lesson-meta"><span>' + ui.esc(lesson.level) + ' · ' + lesson.minutes + ' min</span>' +
      '<span>' + (done ? '✓ Studied' : (lesson.topic === 'grammar' ? 'Grammar' : 'Everyday Malagasy')) + '</span></span>' +
      '<h3>' + ui.esc(lesson.title) + '</h3><p>' + ui.esc(lesson.notes[0]) + '</p>' +
      '<span class="study-card-go">' + (done ? 'Revisit lesson' : 'Open lesson') + ' →</span></a>';
  }

  function listMarkup(lessons, skill) {
    if (!lessons.length) return '<p class="study-empty">No lessons match those filters. Try another level or search.</p>';
    return '<div class="study-lesson-grid">' + lessons.map(function (lesson) { return lessonCard(lesson, skill); }).join('') + '</div>';
  }

  function render(parts) {
    var skillsRoute = parts[0] === 'skills';
    var skill = skillsRoute ? data.skills.filter(function (s) { return s.id === parts[1]; })[0] : null;
    var level = !skillsRoute ? data.levels.filter(function (l) { return l.id === parts[1]; })[0] : null;
    var lessons = data.lessons.filter(function (lesson) {
      return (!skill || lesson.skills.indexOf(skill.id) !== -1) && (!level || lesson.level === level.id);
    });
    var heading = skill ? skill.title : (level ? level.title : 'A little further, every day.');
    var description = skill ? skill.description : (level ? level.description :
      'Build on your beginner course with real-life situations, focused practice and a new advanced-grammar pathway. Everything you learn here uses Official Malagasy.');
    return '<div class="study-layout">' + sidebar(skill ? skill.id : '') + '<div class="study-content">' +
      '<header class="study-hero"><p class="section-eyebrow">Official Malagasy · Learn & practise</p><h1>' +
      ui.esc(heading) + '</h1><p class="lead">' + ui.esc(description) + '</p>' +
      '<div class="study-hero-meta"><span>' + data.lessons.length + ' lessons</span><span>3 learning levels</span><span>' + study.count() + ' studied</span></div></header>' +
      (!level && !skill ? quickStart() : '') +
      (level ? '<div class="study-prerequisite"><strong>Before you begin</strong><p>' + ui.esc(level.prerequisite) + '</p><a href="#/learn">← All levels</a></div>' : (!skill ? levelCards() : '')) +
      '<section aria-labelledby="studyListTitle"><div class="study-list-heading"><h2 id="studyListTitle">' +
      (skill ? 'Practise ' + ui.esc(skill.title.toLowerCase()) : (level ? 'Your learning pathway' : 'Explore the lessons')) + '</h2>' +
      '<p id="studyCount" class="meta" aria-live="polite">' + lessons.length + ' ' + ui.plural(lessons.length, 'lesson') + '</p></div>' +
      '<div class="study-filters"><label>Find a lesson<input id="studySearch" type="search" placeholder="Try family, recipes or travel" autocomplete="off"></label>' +
      (!level ? '<label>Learning level<select id="studyLevel"><option value="">All levels</option>' + data.levels.map(function (l) {
        return '<option value="' + l.id + '">' + ui.esc(l.title) + '</option>';
      }).join('') + '</select></label>' : '') +
      '<label>Lesson type<select id="studyType"><option value="">All lesson types</option><option value="grammar">Grammar</option><option value="everyday">Everyday situations</option></select></label></div>' +
      '<div id="studyResults">' + listMarkup(lessons, skill ? skill.id : '') + '</div></section>' +
      '<section class="study-practice-guide"><h2>Make Malagasy part of your day</h2><p>Choose a lesson, learn the words, then practise the situation through reading, writing, listening and speaking. Return to your saved drafts and build confidence one conversation at a time.</p>' +
      '<a href="#/course">Continue the 12-week course →</a></section></div></div>';
  }

  function mount(root, parts) {
    var search = root.querySelector('#studySearch');
    var level = root.querySelector('#studyLevel');
    var type = root.querySelector('#studyType');
    if (!search || !type) return;
    function update() {
      var query = ui.norm(search.value).trim();
      var selectedLevel = level ? level.value : parts[1];
      var skill = parts[0] === 'skills' ? parts[1] : '';
      var lessons = data.lessons.filter(function (lesson) {
        return (!skill || lesson.skills.indexOf(skill) !== -1) &&
          (!selectedLevel || lesson.level === selectedLevel) &&
          (!type.value || (type.value === 'grammar' ? lesson.topic === 'grammar' : lesson.topic !== 'grammar')) &&
          (!query || ui.norm([
            lesson.title, lesson.topic, lesson.task, lesson.notes.join(' '),
            lesson.examples.map(function (e) { return e.mg + ' ' + e.en; }).join(' '),
            lesson.reading.join(' '),
            lesson.drills.map(function (d) { return d.prompt + ' ' + d.answers.join(' '); }).join(' '),
            lesson.vocabulary.map(function (w) { return w.mg + ' ' + w.en; }).join(' ')
          ].join(' ')).indexOf(query) !== -1);
      });
      root.querySelector('#studyResults').innerHTML = listMarkup(lessons, skill);
      root.querySelector('#studyCount').textContent = lessons.length + ' ' + ui.plural(lessons.length, 'lesson');
    }
    search.addEventListener('input', update);
    type.addEventListener('change', update);
    if (level) level.addEventListener('change', update);
  }

  S.studyUi = { sidebar: sidebar, levelCards: levelCards, lessonCard: lessonCard };
  S.views = S.views || {};
  S.views.learn = { render: render, mount: mount, nav: 'course' };
  S.views.skills = { render: render, mount: mount, nav: 'skills' };
})(window.Salama);
