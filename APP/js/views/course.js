/* Course: the 12-week outline, one week's three sessions, and the two
   higher tracks (intermediate / advanced) that continue it. */
(function (S) {
  'use strict';
  var core = S.core;
  var ui = S.ui;

  var LEVELS = [
    { id: 'beginner', label: 'Beginner', blurb: 'Twelve weeks, three sessions a week' },
    { id: 'intermediate', label: 'Intermediate', blurb: 'Everyday situations, longer conversations' },
    { id: 'advanced', label: 'Advanced', blurb: 'Grammar that changes the focus of a sentence' }
  ];

  function studyData() {
    return (S.study && S.study.data) ? S.study.data : null;
  }

  function studyLessons(levelId) {
    var data = studyData();
    if (!data) return [];
    return data.lessons.filter(function (lesson) { return lesson.level === levelId; })
      .sort(function (a, b) { return a.order - b.order; });
  }

  function levelById(id) {
    return LEVELS.filter(function (l) { return l.id === id; })[0] || LEVELS[0];
  }

  function hasLevel(id) {
    return id === 'beginner' || studyLessons(id).length > 0;
  }

  function themeTitle(id) {
    var theme = (core.data.themeMap || []).filter(function (t) { return t.id === id; })[0];
    return theme ? theme.title : 'Malagasy in practice';
  }

  /* Intermediate and advanced lessons are grouped by theme, then split into
     weeks of at most three — the same rhythm as the 12-week course. */
  function studyWeeks(levelId) {
    var lessons = studyLessons(levelId);
    var runs = [];
    lessons.forEach(function (lesson) {
      var last = runs[runs.length - 1];
      if (last && last.theme === lesson.theme) last.lessons.push(lesson);
      else runs.push({ theme: lesson.theme, lessons: [lesson] });
    });
    var weeks = [];
    runs.forEach(function (run) {
      for (var i = 0; i < run.lessons.length; i += 3) {
        weeks.push({
          week: weeks.length + 1,
          theme: themeTitle(run.theme),
          lessons: run.lessons.slice(i, i + 3)
        });
      }
    });
    return weeks;
  }

  function studyDone(lesson) {
    return Boolean(S.study && S.study.isDone && S.study.isDone(lesson.id));
  }

  function doneIn(lessons) {
    return lessons.filter(studyDone).length;
  }

  function tabBar(levelId) {
    return '<div class="tabs course-level-tabs" aria-label="Course level">' +
      LEVELS.filter(function (level) { return hasLevel(level.id); }).map(function (level) {
        var href = level.id === 'beginner' ? '#/course' : '#/course/' + level.id;
        return '<a href="' + href + '"' + (level.id === levelId ? ' aria-current="page"' : '') + '>' +
          ui.esc(level.label) + '</a>';
      }).join('') +
    '</div>';
  }

  function beginnerWeekList(selectedWeek) {
    return '<div class="week-list">' + core.data.curriculum.map(function (week) {
      var done = core.weekDoneCount(week.week);
      var state = done === week.sessions.length ? 'Complete'
        : (done ? done + ' of ' + week.sessions.length : '3 sessions');
      var img = ui.photoForIndex ? ui.photoForIndex(week.week - 1) : 'img/highlands.jpg';
      return '<a class="week-row week-row-photo" href="#/course/' + week.week + '"' +
        (week.week === selectedWeek ? ' aria-current="true"' : '') + '>' +
        '<span class="week-thumb"><img src="' + img + '" alt="" loading="lazy"><span class="week-badge">' + week.week + '</span></span>' +
        '<span class="week-body">' +
          '<span class="week-no">Week ' + week.week + ' \u2022 Month ' + week.month + '</span>' +
          '<span class="week-title">' + ui.esc(week.title) + '</span>' +
        '</span>' +
        '<span class="week-state">' + state + '</span>' +
        ui.icon('chevron-right', 'icon-sm') +
        '</a>';
    }).join('') + '</div>';
  }

  function studyWeekList(levelId, selectedWeek) {
    var weeks = studyWeeks(levelId);
    return '<div class="week-list">' + weeks.map(function (week) {
      var done = doneIn(week.lessons);
      var state = done === week.lessons.length ? 'Complete'
        : (done ? done + ' of ' + week.lessons.length : week.lessons.length + (week.lessons.length === 1 ? ' lesson' : ' lessons'));
      return '<a class="week-row" href="#/course/' + levelId + '/' + week.week + '"' +
        (week.week === selectedWeek ? ' aria-current="true"' : '') + '>' +
        '<span class="week-badge">' + week.week + '</span>' +
        '<span class="week-body">' +
          '<span class="week-no">Week ' + week.week + ' \u2022 ' + ui.esc(week.theme) + '</span>' +
          '<span class="week-title">' + ui.esc(week.lessons[0].title) + '</span>' +
          '<span class="week-sub">' + ui.esc(week.lessons.slice(1).map(function (l) { return l.title; }).join(' \u00b7 ') || (week.lessons.length + ' lesson' + (week.lessons.length === 1 ? '' : 's') + ' \u00b7 ' + week.lessons[0].minutes + ' min')) + '</span>' +
        '</span>' +
        '<span class="week-state">' + state + '</span>' +
        ui.icon('chevron-right', 'icon-sm') +
        '</a>';
    }).join('') + '</div>';
  }

  function weekDetail(week) {
    var sessions = core.data.sessions.filter(function (s) { return s.week === week.week; });
    return '<section class="panel" aria-labelledby="weekTitle">' +
      '<div class="session-meta"><span class="week">Month ' + week.month + '</span> ' +
      '<span>' + core.weekDoneCount(week.week) + ' of ' + sessions.length + ' sessions complete</span></div>' +
      '<h2 id="weekTitle" style="margin-top:0">Week ' + week.week + ' — ' + ui.esc(week.title) + '</h2>' +
      '<div class="week-pager">' +
        (week.week > 1 ? '<a class="btn btn-quiet btn-sm" href="#/course/' + (week.week - 1) + '">\u2190 Week ' + (week.week - 1) + '</a>' : '<span></span>') +
        '<span class="meta">Week ' + week.week + ' of ' + core.data.curriculum.length + '</span>' +
        (week.week < core.data.curriculum.length ? '<a class="btn btn-quiet btn-sm" href="#/course/' + (week.week + 1) + '">Week ' + (week.week + 1) + ' \u2192</a>' : '<span></span>') +
      '</div>' +
      sessions.map(function (session) {
        var done = core.isSessionDone(session.id);
        var pos = core.lastPosition();
        var here = pos && pos.id === session.id;
        var canEdit = Boolean(core.state && core.state.prefs && core.state.prefs.showInlineEdit);
        var img = ui.photoForIndex ? ui.photoForIndex((session.week - 1) * 3 + session.number - 1) : 'img/highlands.jpg';
        return '<div class="session-row-wrap">' +
          '<a class="session-row session-row-photo' + (here ? ' is-here' : '') + '" href="' + (here ? core.positionHash(pos) : '#/session/' + session.id + '/dialogue') + '">' +
            '<span class="session-row-left">' +
              '<img class="session-row-thumb" src="' + img + '" alt="" loading="lazy">' +
              '<span><span class="day">' + ui.esc(session.day) + ' · Session ' + session.number +
                (here ? ' <span class="here-tag">\u25CF You are here \u00b7 ' + core.STEP_NAMES[pos.step] + '</span>' : '') + '</span>' +
              '<p class="focus">' + ui.esc(session.focus) + '</p></span>' +
            '</span>' +
            '<span class="state">' + (here ? 'Continue' : (done ? ui.icon('check', 'icon-sm') + ' Done' : 'Start')) +
            ui.icon('chevron-right', 'icon-sm') + '</span></a>' +
          (canEdit ? '<a class="course-session-edit-link" href="#/edit/session/' + ui.esc(session.id) + '" title="Manual edits (Malagasy &amp; phonetics) for Week ' + session.week + ' \u00b7 Session ' + session.number + '">\u270E Manual edits (W' + session.week + '\u00b7S' + session.number + ')</a>' : '') +
        '</div>';
      }).join('') +
      (S.study ? '<div class="study-related"><h3>Extra practice for this week</h3><div class="btn-row">' +
        S.study.data.lessons.filter(function (lesson) {
          return lesson.relatedWeeks.indexOf(week.week) !== -1;
        }).slice(0, 5).map(function (lesson) {
          return '<a class="btn btn-quiet btn-sm" href="#/study/' + lesson.id + '/read">' + ui.esc(lesson.title) + '</a>';
        }).join('') + '</div><a href="#/learn">See all learning pathways →</a></div>' : '') +
      '</section>';
  }

  function studyWeekDetail(levelId, week) {
    var level = levelById(levelId);
    var weeks = studyWeeks(levelId);
    var done = doneIn(week.lessons);
    return '<section class="panel" aria-labelledby="weekTitle">' +
      '<div class="session-meta"><span class="week">' + ui.esc(level.label) + '</span> ' +
      '<span>' + done + ' of ' + week.lessons.length + ' lessons studied</span></div>' +
      '<h2 id="weekTitle" style="margin-top:0">Week ' + week.week + ' — ' + ui.esc(week.theme) + '</h2>' +
      '<div class="week-pager">' +
        (week.week > 1 ? '<a class="btn btn-quiet btn-sm" href="#/course/' + levelId + '/' + (week.week - 1) + '">\u2190 Week ' + (week.week - 1) + '</a>' : '<span></span>') +
        '<span class="meta">Week ' + week.week + ' of ' + weeks.length + '</span>' +
        (week.week < weeks.length ? '<a class="btn btn-quiet btn-sm" href="#/course/' + levelId + '/' + (week.week + 1) + '">Week ' + (week.week + 1) + ' \u2192</a>' : '<span></span>') +
      '</div>' +
      week.lessons.map(function (lesson) {
        var isDone = studyDone(lesson);
        return '<div class="session-row-wrap">' +
          '<a class="session-row' + (isDone ? ' is-done' : '') + '" href="#/study/' + lesson.id + '/read">' +
            '<span class="session-row-left"><span>' +
              '<span class="day">' + ui.esc(themeTitle(lesson.theme)) + ' · ' + lesson.minutes + ' min</span>' +
              '<span class="focus" style="display:block;font-weight:700">' + ui.esc(lesson.title) + '</span>' +
              '<p class="focus">' + ui.esc((lesson.notes && lesson.notes[0]) || lesson.task || '') + '</p>' +
            '</span></span>' +
            '<span class="state">' + (isDone ? ui.icon('check', 'icon-sm') + ' Studied' : 'Start') +
            ui.icon('chevron-right', 'icon-sm') + '</span></a>' +
        '</div>';
      }).join('') +
      '</section>';
  }

  function studyLevelIntro(levelId) {
    var level = levelById(levelId);
    var data = studyData();
    var meta = data && data.levels ? data.levels.filter(function (l) { return l.id === levelId; })[0] : null;
    return '<section class="panel">' +
      '<p class="section-eyebrow" style="margin:0 0 4px">' + ui.esc(level.label) + ' track</p>' +
      '<h2 style="margin-top:0">' + ui.esc(level.blurb) + '</h2>' +
      '<p>' + ui.esc(meta ? meta.description : 'Continue the course beyond the first twelve weeks.') + '</p>' +
      (meta && meta.prerequisite ? '<p class="meta">' + ui.esc(meta.prerequisite) + '</p>' : '') +
      '<div class="btn-row"><a class="btn btn-secondary" href="#/learn/' + levelId + '">All ' + ui.esc(level.label.toLowerCase()) + ' lessons</a>' +
      '<a class="btn btn-quiet" href="#/skills">Practise by skill</a></div>' +
      '</section>';
  }

  function resumeCard() {
    var pos = core.lastPosition();
    var posSession = pos ? core.session(pos.id) : null;
    if (!posSession) return '';
    var prev = core.adjacentSession(posSession.id, -1);
    var next = core.adjacentSession(posSession.id, 1);
    return '<div class="resume-wrap" style="margin-bottom:18px">' +
      (prev ? '<a class="resume-side" href="#/session/' + prev.id + '/dialogue"><small>Previous lesson</small>\u2190 Week ' + prev.week + ' \u00b7 ' + ui.esc(prev.day.slice(0, 3)) + ' S' + prev.number + '</a>' : '') +
      '<a class="resume-card" href="' + core.positionHash(pos) + '">' +
        '<span class="resume-dot">\u25B6</span>' +
        '<span class="resume-text"><small>You are here \u2014 continue where you left off</small>' +
        '<strong>Week ' + posSession.week + ' \u00b7 ' + ui.esc(posSession.day) + ' \u00b7 Session ' + posSession.number + ' \u00b7 ' + core.STEP_NAMES[pos.step] + '</strong>' +
        '<span>' + ui.esc(posSession.focus) + '</span></span>' +
        '<span class="resume-go">Continue \u2192</span>' +
      '</a>' +
      (next ? '<a class="resume-side" href="#/session/' + next.id + '/dialogue"><small>Next lesson</small>Week ' + next.week + ' \u00b7 ' + ui.esc(next.day.slice(0, 3)) + ' S' + next.number + ' \u2192</a>' : '') +
    '</div>';
  }

  function render(parts) {
    var arg = parts[1];
    var levelId = 'beginner';
    var weekNo = 0;

    if (arg && /^\d+$/.test(arg)) {
      weekNo = Number(arg);                       // #/course/3 — beginner week (unchanged)
    } else if (arg && hasLevel(arg)) {
      levelId = arg;
      if (parts[2] && /^\d+$/.test(parts[2])) weekNo = Number(parts[2]);
    } else {
      var pos = core.lastPosition();
      var posSession = pos ? core.session(pos.id) : null;
      if (posSession) weekNo = posSession.week;
    }

    var level = levelById(levelId);
    var week = null;
    var list = '';
    var detail = '';

    if (levelId === 'beginner') {
      week = core.data.curriculum.filter(function (w) { return w.week === weekNo; })[0] || null;
      list = beginnerWeekList(week ? week.week : 0);
      if (week) detail = weekDetail(week);
    } else {
      var weeks = studyWeeks(levelId);
      week = weeks.filter(function (w) { return w.week === weekNo; })[0] || null;
      list = studyWeekList(levelId, week ? week.week : 0);
      if (week) detail = studyWeekDetail(levelId, week);
      else detail = studyLevelIntro(levelId);
    }

    return '<div class="view-narrow">' +
      '<h1>Course</h1>' +
      '<p class="lead">Twelve weeks to a first full conversation, then an intermediate and an advanced track that keep going.</p>' +
      tabBar(levelId) +
      (levelId === 'beginner' ? resumeCard() : '') +
      (levelId === 'beginner' && !week
        ? '<section class="study-course-entry"><p class="section-eyebrow">Keep growing · Official Malagasy</p>' +
          '<h2>More situations. More ways to practise.</h2><p>26 beginner lessons, 27 intermediate lessons and 8 advanced-grammar lessons. Explore by level or by skill without losing your place in the 12-week course.</p>' +
          '<div class="btn-row"><a class="btn" href="#/learn">Explore learning levels →</a><a class="btn btn-secondary" href="#/skills">Choose a skill</a></div></section>'
        : '') +
      detail +
      '<h2>' + (week ? 'All weeks of ' + ui.esc(level.label.toLowerCase()) : (levelId === 'beginner' ? 'Weeks' : 'Weeks of the ' + ui.esc(level.label.toLowerCase()) + ' track')) + '</h2>' +
      list +
      '</div>';
  }

  function mount(root) {
    // Selecting a week scrolls the outline into view so the detail is visible.
    if (root && root.querySelector('[aria-current="true"]')) {
      var el = root.querySelector('#weekTitle');
      if (el && window.innerWidth < 760) el.scrollIntoView({ block: 'start' });
    }
  }

  S.views = S.views || {};
  S.views.course = { render: render, mount: mount, nav: 'course' };
})(window.Salama);
