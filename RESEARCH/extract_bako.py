#!/usr/bin/env python3
"""Extract every Bako PDF, with optional page renders for diagram OCR.

Requires PyMuPDF. Originals are read only, never copied into the public app
(the 61 PDFs contain almost 484 MB of embedded media).
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]


def source_id(path):
    return re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-")


def extract(source, ocr_dir=None, ocr_json=None):
    fitz.TOOLS.mupdf_display_errors(False)
    files = sorted(source.rglob("*"))
    files = [p for p in files if p.is_file() and p.suffix.lower() == ".pdf"]
    if not files:
        raise ValueError(f"No PDFs found in {source}")
    documents = []
    ocr = json.loads(ocr_json.read_text()) if ocr_json else {}
    for path in files:
        identifier = source_id(path)
        pages = []
        with fitz.open(path) as pdf:
            for number, page in enumerate(pdf, 1):
                # Text keeps source spelling, dialect labels and exercise keys.
                text = page.get_text(sort=True).strip()
                if ocr_dir:
                    ocr_dir.mkdir(parents=True, exist_ok=True)
                    image = page.get_pixmap(matrix=fitz.Matrix(1.65, 1.65), alpha=False)
                    image.save(str(ocr_dir / f"{identifier}--{number}.png"))
                page_data = {
                    "number": number,
                    "text": text,
                }
                if ocr_json:
                    key = f"{identifier}--{number}"
                    if key not in ocr:
                        raise ValueError(f"Missing OCR page: {key}")
                    # OCR supplements the text layer, especially diagram labels;
                    # it is explicitly kept separate because it is not corrected.
                    page_data["ocrText"] = ocr[key]
                pages.append(page_data)
        documents.append({
            "id": identifier,
            "file": str(path.relative_to(source)),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "pages": pages,
        })
        print(f"{identifier}: {len(pages)} pages")
    result = {
        "author": "Malagasy–Tsimihety with Bako",
        "documentCount": len(documents),
        "pageCount": sum(len(d["pages"]) for d in documents),
        "documents": documents,
    }
    destination = ROOT / "RESEARCH/BAKO_EXTRACTED.json"
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    # Public provenance only; full mixed-dialect text and OCR are local research.
    manifest = {
        "documentCount": result["documentCount"], "pageCount": result["pageCount"],
        "documents": [{"id": d["id"], "file": d["file"], "sha256": d["sha256"], "pageCount": len(d["pages"])} for d in documents],
    }
    (ROOT / "RESEARCH/BAKO_SOURCE_MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Extracted {result['documentCount']} PDFs / {result['pageCount']} pages → {destination}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--ocr-dir", type=Path, help="Also render PNGs for Vision OCR")
    parser.add_argument("--ocr-json", type=Path, help="Merge Vision OCR alongside each page's text layer")
    args = parser.parse_args()
    extract(args.source, args.ocr_dir, args.ocr_json)
