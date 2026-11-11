# Salama! v3.4 — Official Malagasy & Manual Inline Editing (Malagasy + Phonetics)

## 1. Full Conversion from Tsimihety Dialect to Official Malagasy (`RESEARCH/official_malagasy.py`)
All Tsimihety dialect items, slash-paired dialect entries, dialogue lines, grammar tables, and cultural notes have been converted to **Official Malagasy (*Tenim-pirenena ofisialy*)**:
- **Vocabulary (`2,237` entries):**
  - Dropped **242** pure-Tsimihety and duplicate entries whose Official Malagasy equivalents already exist in the dictionary (`tsm:tragno`, `tsm:zama`, `tsm:angovavy`, `tsm:zahay`, `tsm:areo`, `amarainy`, `manintsy`, `mahamay`, `ino_vaovao`, `koà`, etc.), merging their topic shelves onto the primary Official Malagasy entries so no lesson loses vocabulary.
  - Rewrote **76** Tsimihety or slash-paired entries into clean Official Malagasy (e.g., `Manakory` → `Manao ahoana`, `Akory aby` → `Manao ahoana daholo`, `Homana (tsm) / Mihinana (off)` → `mihinana`, `Tomaty / Voatabia` → `Voatabia`, `Fontsy / Akondro` → `Akondro`, `Zagnahary / Andriamanitra` → `Andriamanitra`, `tsm:iadabe` → `rahalahin-dray zokiny`, `tsm:ninibe` → `rahavavin-dreny zokiny`, `tsm:mitsabo_tragno` → `manorina trano`, `tsm:tsy_mahazo_onon-draha` → `tsy mahatsiaro tena`, `tsm:azon'ny_tontona` → `mandeha ra ny orona`).
  - Removed all `mg_tsm` fields and rewrote **18** Tsimihety comparison notes into Official Malagasy usage notes.
- **Phrases (`714` entries):**
  - Rewrote all Tsimihety phrases into Official Malagasy (`Manakory ianao?` → `Manao ahoana ianao?`, `Ia, misy.` → `Eny, misy.`, `Tsisy.` → `Tsy misy.`, `Tsisy fisaorana.` → `Tsy misy fisaorana.`, `Mananjanaka telo zahay` → `Manana zanaka telo izahay`, `Anarako Ruth.` → `Ruth no anarako.`).
- **Dialogues (`33` dialogues, `196` lines):**
  - Rewrote **49** dialogue lines across 18 dialogues from Tsimihety (`Akory`, `Manakory`, `Ia`, `Ehe`, `Zaho`, `Zahay`, `Zareo`, `Ino ny vaovao`, `Tsisy la monnaie`, `Kômpania`, `frais`, `mandigny`) and fill-in-the-blank templates into natural, speakable Official Malagasy (`Manao ahoana`, `Eny`, `Tsia`, `Izaho / aho`, `Izahay`, `Izy ireo`, `Inona ny vaovao?`, `Tsy misy madinika`, `Orinasa`, `saran-dàlana`, `miandry`).
- **Grammar (`27` topics) & Culture (`157` notes):**
  - Converted Tsimihety pronoun paradigms, question words (`MANAKORY` → `MANAHOANA`, `INO` → `INONA`, `ZOVY` → `IZA`, `MOA` → `VE`), and example sentences to Official Malagasy, and removed Tsimihety-specific phonology notes.

## 2. 100% Audio Coverage Re-rendered with Abidi (`3,147 / 3,147` clips)
- Re-rendered all **77** newly rewritten Official Malagasy words, phrases, and dialogue lines with Artifisialy's **Abidi** Malagasy TTS voice (`RESEARCH/abidi_render.py`).
- Every single speakable entry in the course now has a native Malagasy recording:
  - **2,237 / 2,237** vocabulary words (`2,236` Abidi + `veloma` pinned to MMS via `RESEARCH/VOICE_MAP.json`)
  - **714 / 714** phrases (`713` Abidi + `rpb_veloma` pinned to MMS via `RESEARCH/VOICE_MAP.json`)
  - **196 / 196** dialogue lines (`100%` Abidi)

## 3. Manual Inline Editing of Malagasy & Phonetics
Both the **Malagasy text (`mg`)** and the **Phonetic guide (`pron`)** are now directly editable by you in two places:
1. **Directly inside the Salama! App (`APP/js/core.js`, `APP/js/ui.js`, `APP/js/views/settings.js`):**
   - Every word, phrase, and dialogue line now has an **✎ Edit** button next to **Listen** and **Syllables** (or you can simply click/tap directly on the Malagasy text or phonetic line).
   - Clicking **✎ Edit** opens an inline editor with two input boxes: **Malagasy** and **Phonetics / pronunciation**, plus **Save**, **Reset original**, and **Cancel**.
   - Pressing **Enter** or clicking **Save** immediately updates the card on screen and saves your edit in the browser (`localStorage['salama_edits_v1']`, synced with `salama_proofread_v1`).
   - In **Settings → Manual edits (Malagasy & phonetics)**, you can view how many manual edits you have saved, open the full proofread sheet, **Export edits (`.tsv`)**, or **Reset all manual edits**.
2. **In the Full-Course Proofread & Edit Sheet (`PROOFREAD.html` / `APP/PROOFREAD.html`):**
   - Every row now has side-by-side live-editable input boxes for **Malagasy (`mg`)** and **Phonetics (`pron`)** right next to the **▶ Play** audio button and **✔ / ✘** buttons, plus a collapsible **English translation & reviewer note** drawer and **Reset original**.
   - Clicking **Export corrections (`.tsv`)** downloads `salama_corrections.tsv` with `original_mg`, `corrected_mg`, `original_pron`, `corrected_pron`, `original_en`, and `corrected_en`, which `python3 RESEARCH/apply_corrections.py salama_corrections.tsv` imports directly into `RESEARCH/CORRECTIONS.json`.
