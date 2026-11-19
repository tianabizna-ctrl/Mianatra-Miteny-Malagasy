/* Additive course progress. Existing beginner session and recording IDs stay intact. */
(function (S) {
  'use strict';
  var data = window.STUDY_CONTENT;
  var byId = {};
  data.lessons.forEach(function (lesson) { byId[lesson.id] = lesson; });

  function normalise(text) {
    return String(text || '').normalize('NFC').toLowerCase()
      .replace(/[’‘]/g, "'").replace(/[.,!?;:…]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  function progress() {
    return S.core.state.study;
  }

  function isDone(id) { return Boolean(progress().completed[id]); }

  function mark(id, done) {
    if (!byId[id]) return;
    if (done) progress().completed[id] = Date.now();
    else delete progress().completed[id];
    S.core.save();
  }

  function draft(id, value) {
    if (!byId[id]) return '';
    if (value !== undefined) {
      progress().drafts[id] = String(value).slice(0, 8000);
      S.core.save();
    }
    return progress().drafts[id] || '';
  }

  function record(id, correct, total) {
    if (!byId[id] || total !== byId[id].drills.length) return;
    progress().checks[id] = { correct: correct, total: total, at: Date.now() };
    S.core.save();
  }

  function matches(answer, choices) {
    var value = normalise(answer);
    return Boolean(value) && choices.some(function (choice) { return normalise(choice) === value; });
  }

  function count(level) {
    return data.lessons.filter(function (lesson) {
      return (!level || lesson.level === level) && isDone(lesson.id);
    }).length;
  }

  function next(id) {
    var lesson = byId[id];
    if (!lesson) return null;
    var list = data.lessons.filter(function (item) { return item.level === lesson.level; });
    return list[list.indexOf(lesson) + 1] || null;
  }

  S.study = {
    data: data, lesson: function (id) { return byId[id]; }, isDone: isDone,
    mark: mark, draft: draft, record: record, matches: matches, count: count, next: next
  };
})(window.Salama);
