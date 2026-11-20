#!/usr/bin/env node
/* Course state, handlers, import/reset and source-only-language regressions. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const APP = path.join(__dirname, '..', 'APP');

function node(value = '') {
  const listeners = {};
  return {
    value, hidden: false, textContent: '', innerHTML: '', className: '', listeners,
    attrs: {}, setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type) { (listeners[type] || []).forEach(fn => fn({ preventDefault() {}, target: this })); }
  };
}

function boot(saved) {
  const storage = { salama_state_v3: saved ? JSON.stringify(saved) : null };
  const sandbox = {
    console, Date, Object, Number, String, Array, JSON, Math, isFinite,
    document: { documentElement: {}, addEventListener() {}, getElementById() { return node(); } },
    setTimeout() { return 0; }, clearTimeout() {},
    localStorage: { getItem(k) { return storage[k] || null; }, setItem(k, v) { storage[k] = v; }, removeItem(k) { delete storage[k]; } }
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  ['data/content.js', 'data/study.js', 'js/core.js', 'js/study-core.js', 'js/ui.js', 'js/views/study-hub.js', 'js/views/study-lesson.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(APP, file), 'utf8'), context, { filename: file });
  });
  sandbox.Salama.speech = { speakWordId() { return true; }, hasCustomAudio() { return false; } };
  return { S: sandbox.Salama, storage, sandbox };
}

function rootFor(lesson) {
  const elements = {};
  elements['.study-content'] = node();
  ['studyComplete', 'studyDoneLabel', 'studyDraft', 'studyDraftStatus', 'studyDrills', 'studyScore', 'studyAudioStatus'].forEach(id => { elements['#' + id] = node(); });
  lesson.drills.forEach((drill, i) => {
    elements['#studyAnswer' + i] = node(drill.answers[0]);
    elements['#studyFeedback' + i] = node();
  });
  const root = node();
  root.querySelector = selector => elements[selector] || null;
  root.querySelectorAll = () => [];
  return { root, elements };
}

const { S, storage } = boot({ version: 3, cards: { salama: { box: 2 } }, sessions: { w1s1: 123 }, quizzes: [], prefs: {} });
assert.equal(S.study.data.lessons.length, 61);
assert.equal(S.study.count(), 0);
const learnHome = S.views.learn.render(['learn']);
assert(learnHome.includes('study-quick-start'));
assert(learnHome.includes('Continue 12-week course'));
assert(learnHome.includes('role="progressbar"'));
const lessonStart = S.views.study.render(['study', 'intro_1a', 'read']);
assert(lessonStart.includes('Activity 1 of'));
assert(lessonStart.includes('study-activity-nav'));
const sourceLabels = /\bbako\b|adapted from|\badaptations?\b|\binspired\b|source pages|source material/i;
assert(!sourceLabels.test(S.views.learn.render(['learn'])));
assert(!sourceLabels.test(S.views.skills.render(['skills'])));
S.study.data.lessons.forEach(item => {
  ['read', 'words', 'write', 'drills', 'listen', 'speak'].forEach(step => {
    assert(!sourceLabels.test(S.views.study.render(['study', item.id, step])), item.id + '/' + step);
  });
});
assert.equal(S.core.state.sessions.w1s1, 123);
assert.equal(S.core.state.cards.salama.box, 2);
assert(S.study.matches('  INONA  ny vaovao! ', ['Inona ny vaovao?']));
assert(S.study.matches('Amin’ny enina.', ["Amin'ny enina."]));
assert(!S.study.matches('', ['Salama.']));
assert(!S.study.matches('Ino vaovao?', ['Inona ny vaovao?']));

const lesson = S.study.lesson('gram_16d');
const { root, elements } = rootFor(lesson);
S.views.study.mount(root, ['study', lesson.id, 'drills']);
assert.equal(root.listeners.click, undefined, 'Speech must not bind to persistent main');
assert.equal(elements['.study-content'].listeners.click.length, 1);
elements['#studyDrills'].fire('submit');
assert.equal(S.core.state.study.checks[lesson.id].correct, lesson.drills.length);
assert.equal(S.core.state.study.checks[lesson.id].total, lesson.drills.length);
assert.equal(S.core.state.sessions[lesson.id], undefined);
elements['#studyComplete'].fire('click');
assert(S.study.isDone(lesson.id));
assert.equal(S.core.sessionDoneCount(), 1);
assert.equal(elements['#studyComplete'].attrs['aria-pressed'], 'true');
elements['#studyDraft'].value = '<script>alert(1)</script> Ataoko ny lasopy.';
elements['#studyDraft'].fire('input');
assert.equal(S.study.draft(lesson.id), elements['#studyDraft'].value);
assert(S.views.study.render(['study', lesson.id, 'write']).includes('&lt;script&gt;'));
const reloaded = boot(JSON.parse(storage.salama_state_v3));
assert(reloaded.S.study.isDone(lesson.id));
assert.equal(reloaded.S.study.draft(lesson.id), elements['#studyDraft'].value);
assert.equal(reloaded.S.core.state.study.checks[lesson.id].correct, lesson.drills.length);

const backup = JSON.stringify({ app: 'Salama!', state: S.core.state });
S.core.resetData();
assert.equal(S.study.count(), 0);
assert.equal(S.study.draft(lesson.id), '');
assert.equal(Object.keys(S.core.state.study.checks).length, 0);
S.core.importData(backup);
assert.equal(S.study.count('advanced'), 1);
assert(S.study.draft(lesson.id).includes('Ataoko'));
assert.equal(S.core.state.sessions.w1s1, 123);

const poisoned = JSON.parse(backup);
poisoned.state.study.completed.not_a_lesson = 100;
poisoned.state.study.checks.gram_16d.correct = 999;
poisoned.state.study.drafts.gram_16d = 'x'.repeat(10000);
S.core.importData(JSON.stringify(poisoned));
assert.equal(S.core.state.study.completed.not_a_lesson, undefined);
assert.equal(S.core.state.study.checks.gram_16d, undefined);
assert.equal(S.study.draft(lesson.id).length, 8000);
S.core.importData(JSON.stringify({ cards: {}, sessions: { w2s1: 4 } }));
assert.equal(S.study.count(), 0);
assert.equal(S.core.state.sessions.w2s1, 4);

// Incomplete practice cannot save a misleading new result.
const incomplete = rootFor(lesson);
incomplete.elements['#studyAnswer0'].value = '';
S.views.study.mount(incomplete.root, ['study', lesson.id, 'drills']);
incomplete.elements['#studyDrills'].fire('submit');
assert.equal(S.core.state.study.checks[lesson.id], undefined);
assert(incomplete.elements['#studyScore'].textContent.includes('Answer all'));

// New hub filters work together and search both languages.
const filterNodes = {
  '#studySearch': node('dadabe'), '#studyLevel': node('beginner'),
  '#studyType': node('everyday'), '#studyResults': node(), '#studyCount': node()
};
const filters = node();
filters.querySelector = selector => filterNodes[selector] || null;
S.views.skills.mount(filters, ['skills', 'reading']);
filterNodes['#studySearch'].fire('input');
assert.equal(filterNodes['#studyCount'].textContent, '1 lesson');
assert(filterNodes['#studyResults'].innerHTML.includes('theme_1/read'));
filterNodes['#studySearch'].value = 'what is new';
filterNodes['#studySearch'].fire('input');
assert.equal(filterNodes['#studyCount'].textContent, '1 lesson');
assert(filterNodes['#studyResults'].innerHTML.includes('intro_1a/read'), 'Search should include example translations');
filterNodes['#studyLevel'].value = 'advanced';
filterNodes['#studyLevel'].fire('change');
assert.equal(filterNodes['#studyCount'].textContent, '0 lessons');
assert(filterNodes['#studyResults'].innerHTML.includes('No lessons match'));
assert(S.views.study.render(['study', 'not_a_lesson']).includes('Lesson not found'));

console.log('PASS: additive course state, exercise and filter handlers, safe drafts, persistence, import/reset and legacy backups');
