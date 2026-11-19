/* Progress: what has actually been done, with dates. */
(function (S) {
  'use strict';
  var core = S.core;
  var ui = S.ui;

  function weekRows() {
    var rows = core.data.curriculum.map(function (week) {
      var done = core.weekDoneCount(week.week);
      return { week: week.week, title: week.title, done: done, total: week.sessions.length };
    }).filter(function (row) { return row.done > 0; });

    if (!rows.length) {
      return '<p class="muted">No sessions completed yet. Today’s session is on the Today screen.</p>';
    }
    return '<div class="entry-list">' + rows.map(function (row) {
      return '<div class="entry" style="grid-template-columns:1fr auto">' +
        '<div><p class="mg-line" style="font-size:var(--fs-body);color:var(--ink)">Week ' + row.week + ' — ' +
        ui.esc(row.title) + '</p></div>' +
        '<div class="meta">' + row.done + ' of ' + row.total + ' sessions</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function quizRows() {
    if (!core.state.quizzes.length) return '<p class="meta">No quizzes taken yet.</p>';
    return '<table class="quiz-table"><thead><tr><th>Date</th><th>Topic</th><th>Score</th></tr></thead><tbody>' +
      core.state.quizzes.slice(-8).reverse().map(function (q) {
        return '<tr><td>' + ui.esc(core.shortDate(q.date)) + '</td>' +
          '<td>' + ui.esc(core.themeTitle(q.theme)) + '</td>' +
          '<td>' + q.score + ' / ' + q.total + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function render() {
    var total = core.totalCards();
    var known = core.knownCount();
    var learning = core.learningCount();
    var due = core.dueCount();
    var avg = core.quizAverage();
    var quizzes = core.state.quizzes.length;
    var doneSessions = core.sessionDoneCount();
    var weeks = core.completedWeeks();

    return '<div class="view-narrow">' +
      '<h1>Progress</h1>' +
      '<p class="lead">' + core.sessionDoneCount() + ' of ' + core.data.sessions.length + ' sessions, ' +
        core.completedWeeks() + ' of 12 weeks complete.</p>' +

      '<div class="stat-list">' +
        '<div class="stat"><span class="n">' + known + '</span><span class="k">words rated known</span>' +
          '<div class="sub">of ' + total + ' study words</div></div>' +
        '<div class="stat"><span class="n">' + learning + '</span><span class="k">words still learning</span>' +
          '<div class="sub">' + due + ' due today</div></div>' +
        '<div class="stat"><span class="n">' + (avg === null ? '—' : avg + '%') + '</span>' +
          '<span class="k">average quiz score</span>' +
          '<div class="sub">' + quizzes + ' ' + ui.plural(quizzes, 'quiz', 'quizzes') + ' taken</div></div>' +
        '<div class="stat"><span class="n">' + core.state.streak.days + '</span>' +
          '<span class="k">' + ui.plural(core.state.streak.days || 0, 'day') + ' in a row</span>' +
          '<div class="sub">' + ui.plural(doneSessions, 'session') + ', ' + ui.plural(weeks, 'week') + '</div></div>' +
      '</div>' +

      '<h2>Course</h2>' + weekRows() +

      (S.study ? '<h2>Extended learning pathways</h2><p class="meta">' + S.study.count() + ' of ' + S.study.data.lessons.length +
        ' lessons marked studied. Self-reported completion is separate from drill results and beginner sessions.</p><div class="study-progress-list">' +
        S.study.data.levels.map(function (level) {
          var total = S.study.data.lessons.filter(function (l) { return l.level === level.id; }).length;
          return '<a href="#/learn/' + level.id + '"><strong>' + ui.esc(level.title) + '</strong><span>' +
            S.study.count(level.id) + ' of ' + total + ' studied</span></a>';
        }).join('') + '</div><h3>Recent lesson drills</h3>' + studyChecks() : '') +

      '<h2>Quizzes</h2>' + quizRows() +

      '<div class="btn-row" style="margin-top:24px">' +
        '<a class="btn" href="#/today">Today</a>' +
        '<a class="btn btn-secondary" href="#/course">Course outline</a>' +
        '<a class="btn btn-quiet" href="#/settings">Export or reset data</a>' +
      '</div>' +
      '</div>';
  }

  function mount() { /* read-only screen */ }

  function studyChecks() {
    var checks = core.state.study.checks;
    var ids = Object.keys(checks).sort(function (a, b) { return checks[b].at - checks[a].at; }).slice(0, 8);
    if (!ids.length) return '<p class="meta">No extended-lesson drills checked yet.</p>';
    return '<div class="study-progress-list">' + ids.map(function (id) {
      var lesson = S.study.lesson(id);
      return '<a href="#/study/' + id + '/drills"><span>' + ui.esc(lesson.title) + '</span><span>' +
        checks[id].correct + '/' + checks[id].total + ' sample matches</span></a>';
    }).join('') + '</div>';
  }

  S.views = S.views || {};
  S.views.progress = { render: render, mount: mount, nav: 'progress' };
})(window.Salama);
