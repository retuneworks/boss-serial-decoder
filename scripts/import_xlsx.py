#!/usr/bin/env python3
"""Dependency-free XLSX importer for the RETUNE WORKS model database."""
from __future__ import annotations

import json
import re
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"


def q(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


def column_index(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref).group(0)
    value = 0
    for char in letters:
        value = value * 26 + ord(char) - 64
    return value - 1


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings = []
    for item in root.findall(q(NS_MAIN, "si")):
        strings.append("".join(node.text or "" for node in item.iter(q(NS_MAIN, "t"))))
    return strings


def sheet_path(archive: zipfile.ZipFile, sheet_name: str) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rel_id = None
    for sheet in workbook.find(q(NS_MAIN, "sheets")):
        if sheet.attrib.get("name") == sheet_name:
            rel_id = sheet.attrib.get(q(NS_REL, "id"))
            break
    if not rel_id:
        raise ValueError(f'Sheet "{sheet_name}" was not found.')

    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.findall(q(NS_PKG_REL, "Relationship")):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib["Target"].lstrip("/")
            if target.startswith("xl/"):
                return target
            return f"xl/{target}"
    raise ValueError(f"Relationship for sheet {sheet_name} was not found.")


def cell_value(cell: ET.Element, shared: list[str]):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        inline = cell.find(q(NS_MAIN, "is"))
        return "".join(node.text or "" for node in inline.iter(q(NS_MAIN, "t"))) if inline is not None else ""
    value_node = cell.find(q(NS_MAIN, "v"))
    if value_node is None:
        return None
    raw = value_node.text or ""
    if cell_type == "s":
        return shared[int(raw)]
    if cell_type == "b":
        return raw == "1"
    if cell_type in {"str", "e"}:
        return raw
    try:
        number = float(raw)
        return int(number) if number.is_integer() else number
    except ValueError:
        return raw


def read_sheet_rows(xlsx_path: Path, name: str) -> list[list[object]]:
    with zipfile.ZipFile(xlsx_path) as archive:
        shared = load_shared_strings(archive)
        path = sheet_path(archive, name)
        root = ET.fromstring(archive.read(path))
        sheet_data = root.find(q(NS_MAIN, "sheetData"))
        rows: list[list[object]] = []
        max_col = 0
        staged: list[dict[int, object]] = []
        for row in sheet_data.findall(q(NS_MAIN, "row")):
            values: dict[int, object] = {}
            for cell in row.findall(q(NS_MAIN, "c")):
                ref = cell.attrib.get("r", "A1")
                idx = column_index(ref)
                max_col = max(max_col, idx)
                values[idx] = cell_value(cell, shared)
            staged.append(values)
        for values in staged:
            rows.append([values.get(i) for i in range(max_col + 1)])
        return rows


def text(value):
    return None if value is None else str(value).strip()


def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: python scripts/import_xlsx.py "C:\\path\\to\\database.xlsx"', file=sys.stderr)
        return 1
    input_path = Path(sys.argv[1]).expanduser().resolve()
    if not input_path.exists():
        print(f"File not found: {input_path}", file=sys.stderr)
        return 1

    rows = read_sheet_rows(input_path, "全データ")
    headers = [text(value) or "" for value in rows[0]]
    raw_records = []
    for row in rows[1:]:
        if not row or row[0] is None:
            continue
        raw_records.append({header: row[index] if index < len(row) else None for index, header in enumerate(headers)})

    mapped = []
    for r in raw_records:
        mapped.append({
            "id": text(r.get("ID")),
            "model": text(r.get("型式")),
            "name": text(r.get("機種名")),
            "effectType": text(r.get("エフェクト種別")),
            "releaseDate": text(r.get("発売日")),
            "originalSalePeriod": text(r.get("販売期間_原文")),
            "saleStart": text(r.get("販売開始日")),
            "saleEnd": text(r.get("販売終了日")),
            "saleEndYear": text(r.get("販売終了年")),
            "salePeriod": text(r.get("販売期間")),
            "updatedAt": text(r.get("最終更新日")),
        })

    updated_values = sorted(record["updatedAt"] for record in mapped if record["updatedAt"])
    payload = {
        "meta": {
            "title": "BOSSコンパクトエフェクター 型式期間データ",
            "recordCount": len(mapped),
            "sourceUpdatedAt": updated_values[-1] if updated_values else None,
            "generatedAt": datetime.now().date().isoformat(),
            "notice": "製造年月候補を型式の販売期間で選ぶための最小データです。",
        },
        "models": mapped,
    }
    output = Path("docs/data/models.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(mapped)} records to {output}")
    print("Next: npm run generate-pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
