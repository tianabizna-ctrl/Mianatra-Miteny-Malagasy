#!/usr/bin/env python3
"""Build the additive, Official-Malagasy course without rebuilding content.js."""
import json
import re
from pathlib import Path

from study_curriculum import LESSONS, READINGS, TRANSFORMATIONS

ROOT = Path(__file__).resolve().parents[1]
LEVELS = [
    {"id": "beginner", "title": "Beginner", "subtitle": "Build a confident foundation", "description": "Short, practical extensions to your existing 12-week course. Start with greetings, everyday words and simple sentences.", "prerequisite": "No previous Malagasy needed."},
    {"id": "intermediate", "title": "Intermediate", "subtitle": "Bring everyday situations to life", "description": "Connect ideas, handle travel and daily routines, and use tenses, possessives and questions in longer conversations.", "prerequisite": "Comfortable with greetings, simple sentences and the beginner course."},
    {"id": "advanced", "title": "Advanced grammar", "subtitle": "Choose your words, shape your meaning", "description": "An advanced-grammar extension: patient voice, ownership chains, precise time and place, and a multi-step directions dialogue. Not a complete proficiency certification.", "prerequisite": "Work through intermediate verb, possession, time and place patterns first."},
]
SKILLS = [
    {"id": "grammar", "title": "Grammar", "mg": "Fitsipi-pitenenana", "icon": "📖", "description": "Learn the patterns behind a sentence, then put them to work."},
    {"id": "verbs", "title": "Verb forms", "mg": "Endriky ny matoanteny", "icon": "↔", "description": "Practise active verbs, tenses and patient voice. Malagasy verbs do not follow English irregular-verb lists."},
    {"id": "reading", "title": "Reading", "mg": "Famakiana", "icon": "📰", "description": "Read the lesson examples and longer everyday accounts in Official Malagasy."},
    {"id": "writing", "title": "Writing", "mg": "Fanoratana", "icon": "✏️", "description": "Translate a pattern, then write something of your own. Your drafts stay on this device."},
    {"id": "drills", "title": "Drills", "mg": "Fanazaran-tena", "icon": "🧩", "description": "Recall vocabulary and sentence meaning with immediate answer feedback."},
    {"id": "listening", "title": "Listening", "mg": "Fihainoana", "icon": "🎧", "description": "Listen to Official Malagasy words, then reveal each word and its meaning."},
    {"id": "speaking", "title": "Speaking", "mg": "Fitenenana", "icon": "💬", "description": "Put everyday Malagasy into practice with roleplays, retelling and conversation."},
]
WEEKS = {
    "greetings": [1, 2], "family": [2, 7], "food": [3, 5], "grammar": [4, 9],
    "home": [4], "weather": [11], "clothing": [11], "health": [10],
    "animals": [7], "time": [8], "directions": [6], "school": [4],
    "routine": [8, 9], "transport": [12],
}
VERBS = {"gram_2", "gram_3", "gram_4a", "gram_4b", "gram_5", "gram_16a", "gram_16b", "gram_16d", "theme_13", "theme_14a", "theme_15d"}
THEMES = {
    "greetings": "greetings_courtesies", "family": "people_family", "food": "food_drink",
    "grammar": "verbs_grammar", "home": "house_objects", "weather": "weather_nature",
    "health": "body_health", "time": "time_calendar", "directions": "directions_places",
    "routine": "daily_routine", "animals": "animals", "school": "school",
    "clothing": "clothing", "transport": "transport",
}


def norm(value):
    return re.sub(r"[^\w' ]", "", value.lower()).strip()


def pairs(values):
    return [dict(zip(["mg", "en"], value.split("|", 1))) for value in values]


def build():
    extracted = json.loads((ROOT / "RESEARCH/BAKO_SOURCE_MANIFEST.json").read_text())
    documents = {d["id"]: d for d in extracted["documents"]}
    # Read-only: current custom recordings, session IDs and manual edits stay intact.
    existing = (ROOT / "APP/data/content.js").read_text()
    existing = json.loads(existing.split("=", 1)[1].strip().removesuffix(";"))
    word_index = {}
    for word in existing["vocabulary"]:
        word_index.setdefault(norm(word["mg"]), []).append(word)
    lessons = []
    for order, row in enumerate(LESSONS, 1):
        source, identifier, title, level, topic, notes, words, examples, task = row
        vocabulary = pairs(words)
        for word in vocabulary:
            candidates = word_index.get(norm(word["mg"]), [])
            matching = [c for c in candidates if any(p.strip() in c["en"].lower() for p in word["en"].lower().split("/"))]
            # Avoid homographs such as manga (blue) versus manga (mango).
            if matching:
                word["wordId"] = matching[0]["id"]
        sample = pairs(examples)
        drills = [
            {"prompt": "Write in Official Malagasy: " + item["en"], "answers": [item["mg"]], "explanation": item["en"]}
            for item in sample[:3]
        ]
        for prompt, answer, explanation in TRANSFORMATIONS.get(identifier, []):
            drills.append({"prompt": prompt, "answers": [answer], "explanation": explanation})
        skill_ids = ["reading", "writing", "drills", "speaking"]
        if topic == "grammar":
            skill_ids.insert(0, "grammar")
        if identifier in VERBS:
            skill_ids.append("verbs")
        # Only offer recorded listening when an existing word has a hosted clip.
        listening = [w["wordId"] for w in vocabulary if w.get("wordId") in existing.get("wordAudio", {})]
        if listening:
            skill_ids.append("listening")
        lessons.append({
            "id": identifier, "order": order, "title": title, "level": level,
            "topic": topic, "theme": THEMES[topic], "skills": skill_ids, "minutes": 25 if level == "advanced" else 15,
            "notes": notes, "vocabulary": vocabulary, "examples": sample,
            "reading": READINGS.get(identifier, [p["mg"] for p in sample]),
            "longReading": identifier in READINGS,
            "task": task, "drills": drills, "listeningWords": listening,
            "relatedWeeks": WEEKS[topic],
        })
    used = {row[0] for row in LESSONS}
    assert used == set(documents), f"Unmapped sources: {set(documents) ^ used}"
    result = {
        "version": "1.0.1", "language": "Official Malagasy", "levels": LEVELS,
        "skills": SKILLS, "lessons": lessons,
    }
    target = ROOT / "APP/data/study.js"
    target.write_text("// Generated by RESEARCH/build_study_data.py; edit study_curriculum.py.\nwindow.STUDY_CONTENT = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n")
    rows = ["# Course-to-source map", "", "Generated by `build_study_data.py`; edit `study_curriculum.py`.", "", "| Lesson | Level | Skills | Source PDF | Pages |", "|---|---|---|---|---:|"]
    for lesson, row in zip(lessons, LESSONS):
        document = documents[row[0]]
        rows.append(f"| {lesson['title']} (`{lesson['id']}`) | {lesson['level']} | {', '.join(lesson['skills'])} | `{document['file']}` | {document['pageCount']} |")
    (ROOT / "RESEARCH/COURSE_CURRICULUM_MAP.md").write_text("\n".join(rows) + "\n")
    print(f"Built {len(lessons)} Official Malagasy lessons from {len(documents)} PDFs / {extracted['pageCount']} pages")


if __name__ == "__main__":
    build()
