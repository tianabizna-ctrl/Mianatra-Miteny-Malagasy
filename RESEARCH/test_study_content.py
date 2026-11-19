#!/usr/bin/env python3
"""Content gates for the new course; no dependencies or mutations."""
import json
import re
import unittest
from collections import Counter
from pathlib import Path

from study_curriculum import LESSONS

ROOT = Path(__file__).resolve().parents[1]


def payload(name):
    return json.loads((ROOT / "APP/data" / name).read_text().split("=", 1)[1].strip().removesuffix(";"))


class StudyContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = payload("study.js")
        cls.existing = payload("content.js")
        cls.sources = json.loads((ROOT / "RESEARCH/BAKO_SOURCE_MANIFEST.json").read_text())

    def test_every_pdf_has_exactly_one_course_lesson(self):
        lessons = self.data["lessons"]
        self.assertEqual(len(lessons), 61)
        self.assertEqual(len({l["id"] for l in lessons}), 61)
        self.assertEqual({row[0] for row in LESSONS}, {d["id"] for d in self.sources["documents"]})
        self.assertEqual({row[1] for row in LESSONS}, {l["id"] for l in lessons})
        self.assertEqual(sum(d["pageCount"] for d in self.sources["documents"]), 206)
        for source in self.sources["documents"]:
            self.assertRegex(source["sha256"], r"^[a-f0-9]{64}$")

    def test_level_assignments_and_advanced_dependencies(self):
        counts = Counter(l["level"] for l in self.data["lessons"])
        self.assertEqual(counts, {"beginner": 26, "intermediate": 27, "advanced": 8})
        ids = [l["id"] for l in self.data["lessons"]]
        self.assertLess(ids.index("gram_16a"), ids.index("gram_16b"))
        self.assertLess(ids.index("gram_16b"), ids.index("gram_16d"))
        self.assertLess(ids.index("theme_11a"), ids.index("theme_11b"))
        self.assertLess(ids.index("theme_11b"), ids.index("theme_11d"))

    def test_only_official_forms_are_taught(self):
        forbidden = re.compile(r"\b(?:tsimihety|tsm|ino|akory|manakory|dadilahy|zaho|zahay|zareo|fontsy|ndreky|ndraiky|tsitoko|tragno|geda|hely|migiaka|manintsy|misoma|magnofy|tôho|nihinahy|nihinao|nihinazy)\b", re.I)
        for lesson in self.data["lessons"]:
            visible = {k: v for k, v in lesson.items() if k not in {"source", "id", "listeningWords"}}
            # Stable legacy dictionary IDs are not teaching text. Keep them so
            # the owner's existing recordings and corrections still resolve.
            visible["vocabulary"] = [{"mg": w["mg"], "en": w["en"]} for w in lesson["vocabulary"]]
            self.assertIsNone(forbidden.search(json.dumps(visible, ensure_ascii=False)), lesson["id"])
        family = next(l for l in self.data["lessons"] if l["id"] == "theme_1")
        self.assertIn("dadabe", [w["mg"] for w in family["vocabulary"]])
        greetings = next(l for l in self.data["lessons"] if l["id"] == "intro_1a")
        self.assertIn("Inona ny vaovao?", [e["mg"] for e in greetings["examples"]])

    def test_lessons_are_substantive_and_practice_is_traceable(self):
        skill_ids = {s["id"] for s in self.data["skills"]}
        self.assertEqual(len(skill_ids), 7)
        for lesson in self.data["lessons"]:
            self.assertGreaterEqual(len(lesson["notes"]), 2)
            self.assertGreaterEqual(len(lesson["vocabulary"]), 5)
            self.assertGreaterEqual(len(lesson["examples"]), 4)
            self.assertGreaterEqual(len(lesson["drills"]), 3)
            self.assertTrue(lesson["task"])
            self.assertTrue(set(lesson["skills"]) <= skill_ids)
            for drill in lesson["drills"]:
                self.assertTrue(drill["prompt"])
                self.assertTrue(drill["answers"][0])

    def test_existing_course_crosslinks_and_recorded_words(self):
        vocabulary = {w["id"]: w for w in self.existing["vocabulary"]}
        themes = {t["id"] for t in self.existing["themeMap"]}
        self.assertEqual(len(self.existing["sessions"]), 36)
        for lesson in self.data["lessons"]:
            self.assertIn(lesson["theme"], themes)
            self.assertTrue(all(1 <= w <= 12 for w in lesson["relatedWeeks"]))
            for word_id in lesson["listeningWords"]:
                self.assertIn(word_id, vocabulary)
                file = self.existing["wordAudio"][word_id]
                self.assertTrue((ROOT / "APP" / file).is_file(), file)
            for word in lesson["vocabulary"]:
                if word.get("wordId"):
                    self.assertIn(word["wordId"], vocabulary)

    def test_original_contexts_and_all_source_pages_extracted(self):
        lessons = {l["id"]: l for l in self.data["lessons"]}
        self.assertEqual(len(lessons["theme_14b"]["reading"]), 9)
        self.assertIn("Rakoto", lessons["theme_14b"]["reading"][0])
        self.assertIn("Tsia", " ".join(lessons["theme_11d"]["reading"]))
        self.assertIn("Eny", " ".join(lessons["theme_11d"]["reading"]))
        self.assertIn("Asiana sira ny lasopy.", [e["mg"] for e in lessons["gram_16b"]["examples"]])
        raw = ROOT / "RESEARCH/BAKO_EXTRACTED.json"
        if raw.exists():
            extracted = json.loads(raw.read_text())
            self.assertEqual(extracted["documentCount"], 61)
            self.assertEqual(sum(len(d["pages"]) for d in extracted["documents"]), 206)
            self.assertTrue(all(p["text"] for d in extracted["documents"] for p in d["pages"]))

    def test_no_public_originals_and_static_assets_are_cached(self):
        self.assertFalse((ROOT / "APP/data/BAKO_EXTRACTED.json").exists())
        self.assertFalse((ROOT / "APP/media/bako").exists())
        sw = (ROOT / "APP/sw.js").read_text()
        for file in ["fresh.html", "study.css", "data/study.js", "js/study-core.js", "js/views/study-hub.js", "js/views/study-lesson.js"]:
            self.assertIn("'./" + file + "'", sw)
        self.assertIn("ignoreSearch: true", sw)

    def test_course_is_product_branded_without_public_source_labels(self):
        self.assertNotIn("sourceCount", self.data)
        self.assertNotIn("sourcePages", self.data)
        for lesson in self.data["lessons"]:
            self.assertNotIn("source", lesson)
            self.assertNotRegex(json.dumps(lesson, ensure_ascii=False), r"(?i)\bbako\b|\badapted\b|\binspired\b|source pages|source's")
        for name in ["index.html", "fresh.html"]:
            html = (ROOT / "APP" / name).read_text()
            self.assertNotRegex(html, r"(?i)\bbako\b|adapted|inspired")
            self.assertIn("your Official Malagasy learning companion", html)
            self.assertLess(html.index('src="data/study.js'), html.index('src="js/core.js'))
            self.assertLess(html.index('src="js/views/study-lesson.js'), html.index('src="app.js'))
            self.assertIn("salama-v4.6.6", html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
