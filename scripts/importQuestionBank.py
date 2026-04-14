from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

from python_calamine import CalamineWorkbook


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = REPO_ROOT.parent / '题目列表2026-04-14.xls'
DEFAULT_OUTPUT = REPO_ROOT / 'services' / 'importedQuestionBank.ts'

OPTION_RE = re.compile(r'^([A-H])[\.\．、:\s]*(.*)$')


def normalize_text(value: object) -> str:
    return str(value or '').replace('\r\n', '\n').replace('\r', '\n').strip()


def build_index(header: list[object]) -> dict[str, int]:
    return {str(value).strip(): index for index, value in enumerate(header)}


def cell(row: list[object], index_map: dict[str, int], key: str) -> str:
    index = index_map[key]
    return normalize_text(row[index] if index < len(row) else '')


def parse_options(raw: str) -> list[dict[str, str]]:
    options: list[dict[str, str]] = []

    for line in raw.split('\n'):
      normalized = line.strip()
      if not normalized:
        continue

      match = OPTION_RE.match(normalized)
      if match:
        key = match.group(1)
        text = match.group(2).strip()
      else:
        key = chr(65 + len(options))
        text = normalized

      if text:
        options.append({'key': key, 'text': text})

    return options


def parse_correct_key(raw: str) -> str | None:
    keys: list[str] = []

    for line in raw.split('\n'):
      normalized = line.strip()
      if not normalized or ':' not in normalized:
        continue

      key, score = normalized.split(':', 1)
      if score.strip() == '1':
        keys.append(key.strip())

    return keys[0] if len(keys) == 1 else None


def infer_modality(text: str) -> str:
    modality_rules = [
      ('MRI', ['MRI', 'MR', '磁共振', 'T1WI', 'T2WI', 'DWI']),
      ('CT', ['CT', '平扫', '增强扫描']),
      ('超声', ['超声', 'B超', '彩超']),
      ('钼靶', ['钼靶', '乳腺摄影']),
      ('组织病理学', ['病理', '镜下', '切片', '组织学']),
      ('X 光', ['X线', 'X 光', '胸片', '摄片', '平片']),
    ]

    for modality, keywords in modality_rules:
      if any(keyword in text for keyword in keywords):
        return modality

    return '影像综合'


def infer_specialty(text: str) -> str:
    specialty_rules = [
      ('胸部', ['肺', '胸', '纵隔', '支气管']),
      ('神经', ['脑', '颅', '垂体', '鞍区', '神经', '脑膜']),
      ('消化', ['肝', '胆', '胰', '脾', '胃', '肠', '阑尾', '贲门']),
      ('泌尿', ['肾', '膀胱', '输尿管', '前列腺']),
      ('妇科', ['子宫', '卵巢', '盆腔', '宫颈']),
      ('乳腺', ['乳腺', '乳房']),
      ('骨科', ['骨', '关节', '脊柱', '肩', '膝', '肘', '腕']),
      ('儿科', ['小儿', '儿童', '新生儿', '胎儿']),
      ('眼科', ['眼', '视网膜', '眼底']),
    ]

    for specialty, keywords in specialty_rules:
      if any(keyword in text for keyword in keywords):
        return specialty

    return '影像基础'


def infer_difficulty(stem: str, explanation: str, options: list[str]) -> str:
    complexity_score = len(stem) + min(len(explanation), 200) + sum(min(len(option), 18) for option in options)

    if complexity_score >= 220 or any(keyword in stem for keyword in ['最可能', '鉴别', '不正确', '错误的是', '不符合', '除外']):
      return 'Hard'

    if complexity_score >= 110:
      return 'Medium'

    return 'Easy'


def build_category(specialty: str, modality: str) -> str:
    if specialty == '影像基础':
      if modality == 'X 光':
        return 'X 线基础'
      return '影像基础知识'

    return f'{specialty} {modality}'


def select_evenly(items: list[dict[str, object]], limit: int) -> list[dict[str, object]]:
    if len(items) <= limit:
      return items

    result: list[dict[str, object]] = []
    step = len(items) / limit

    for index in range(limit):
      source_index = min(math.floor(index * step), len(items) - 1)
      result.append(items[source_index])

    deduped: list[dict[str, object]] = []
    seen_questions: set[str] = set()
    for item in result:
      description = str(item['description'])
      if description in seen_questions:
        continue
      deduped.append(item)
      seen_questions.add(description)

    if len(deduped) < limit:
      for item in items:
        description = str(item['description'])
        if description in seen_questions:
          continue
        deduped.append(item)
        seen_questions.add(description)
        if len(deduped) >= limit:
          break

    return deduped


def main() -> None:
    parser = argparse.ArgumentParser(description='Import question bank from legacy xls workbook.')
    parser.add_argument('--source', default=str(DEFAULT_SOURCE), help='Path to workbook file')
    parser.add_argument('--output', default=str(DEFAULT_OUTPUT), help='Path to generated TypeScript file')
    parser.add_argument('--limit', type=int, default=240, help='How many questions to evenly sample into the app bundle')
    args = parser.parse_args()

    workbook = CalamineWorkbook.from_path(args.source)
    sheet = workbook.get_sheet_by_name(workbook.sheet_names[0])
    rows = sheet.to_python()
    index_map = build_index(rows[0])

    imported: list[dict[str, object]] = []

    for row in rows[1:]:
      stem = cell(row, index_map, '题干文字')
      stem_image = cell(row, index_map, '题干图片')
      options_raw = cell(row, index_map, '答题选项')
      answer_raw = cell(row, index_map, '答案和分数')
      explanation = cell(row, index_map, '解析文字')
      question_type = cell(row, index_map, '题型')

      if not stem or stem_image:
        continue

      if question_type and question_type != '1':
        continue

      parsed_options = parse_options(options_raw)
      correct_key = parse_correct_key(answer_raw)

      if len(parsed_options) < 4 or correct_key is None:
        continue

      option_map = {item['key']: item['text'] for item in parsed_options}
      correct_answer = option_map.get(correct_key)
      if not correct_answer:
        continue

      combined_text = f'{stem}\n{explanation}'
      modality = infer_modality(combined_text)
      specialty = infer_specialty(combined_text)
      options = [item['text'] for item in parsed_options]

      imported.append({
        'category': build_category(specialty, modality),
        'specialty': specialty,
        'modality': modality,
        'description': stem,
        'correctAnswer': correct_answer,
        'options': options,
        'explanation': explanation or '原始题库暂未提供详细解析。',
        'difficulty': infer_difficulty(stem, explanation, options),
        'sourceName': Path(args.source).name,
        'sourceUrl': None,
        'reviewStatus': 'approved',
        'reviewerName': '题库导入初筛',
        'updatedAt': '2026-04-14T00:00:00.000Z',
      })

    selected = select_evenly(imported, args.limit)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    output = (
      '// Generated by scripts/importQuestionBank.py. Do not edit manually.\n'
      'export interface ImportedQuestionBankEntry {\n'
      '  category: string;\n'
      '  specialty: string;\n'
      '  modality: string;\n'
      '  description: string;\n'
      '  correctAnswer: string;\n'
      '  options: string[];\n'
      '  explanation: string;\n'
      "  difficulty: 'Easy' | 'Medium' | 'Hard';\n"
      '  sourceName: string;\n'
      '  sourceUrl: string | null;\n'
      "  reviewStatus: 'approved';\n"
      '  reviewerName: string;\n'
      '  updatedAt: string;\n'
      '}\n\n'
      f'export const IMPORTED_QUESTION_BANK: ImportedQuestionBankEntry[] = {json.dumps(selected, ensure_ascii=False, indent=2)};\n'
    )
    output_path.write_text(output, encoding='utf-8')

    print(f'imported_candidates={len(imported)}')
    print(f'generated_count={len(selected)}')
    print(f'output={output_path}')


if __name__ == '__main__':
    main()
