import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    suite: { type: 'string', short: 's' },
    case: { type: 'string', short: 'c' },
  },
});

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Укажите ${name} в файле .env`);
  }
  return value;
}

const API_URL = requireEnvironment('TESTY_API_URL');
const USERNAME = requireEnvironment('TESTY_USERNAME');
const PASSWORD = requireEnvironment('TESTY_PASSWORD');
const PROJECT_ID = '2';
const BASE_OUTPUT_DIR = path.join(process.cwd(), 'docs');

interface Suite {
  id: number;
  name: string;
  description?: string;
  suite_path?: string;
  path?: string;
}

interface TestStep {
  scenario?: string;
  action?: string;
  step?: string;
  description?: string;
  expected?: string;
  expected_result?: string;
  reaction?: string;
}

interface TestCase {
  id: number;
  name: string;
  description?: string;
  scenario?: string;
  steps?: TestStep[];
  expected?: string;
  expected_result?: string;
  labels?: unknown;
  tags?: unknown;
  suite?: number | { id: number };
  suite_path?: string;
}

function resolveSuiteDirPath(rawPath: string): string {
  if (!rawPath) return '';
  const segments = rawPath
    .split(/\s*(?:\/|->|=>|\.|>)\s*/)
    .map((segment) => segment.trim().replace(/[/\\?%*:|"<>]/g, '_'))
    .filter(Boolean);
  return path.join(...segments);
}

async function getAuthHeaders() {
  const hostUrl = API_URL.replace(/\/api\/v1\/?$/, '');
  const response = await fetch(`${hostUrl}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`❌ Ошибка авторизации (${response.status}): проверьте логин и пароль.`);
  }

  const data = (await response.json()) as { access: string };
  return {
    Authorization: `Bearer ${data.access}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function getSuiteMap(headers: Record<string, string>, projectId: string): Promise<Map<number, Suite>> {
  const baseUrl = API_URL.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/suites/?project=${projectId}&page_size=1000`, { headers });

  if (!res.ok) {
    console.warn('⚠️ Не удалось загрузить список сьютов.');
    return new Map();
  }

  const data = (await res.json()) as Suite[] | { results: Suite[] };
  const suites: Suite[] = Array.isArray(data) ? data : data.results || [];
  const suiteMap = new Map<number, Suite>();
  suites.forEach((suite) => suiteMap.set(suite.id, suite));
  return suiteMap;
}

function formatTestCaseToMarkdown(test: TestCase): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push(`id: TESTY-${test.id}`);
  const cleanTitle = (test.name || '').replace(/"/g, '\\"');
  lines.push(`title: "${cleanTitle}"`);

  const rawLabels = test.labels || test.tags;
  let labelsList: string[] = [];

  if (Array.isArray(rawLabels)) {
    labelsList = rawLabels.map((l) => {
      if (typeof l === 'object' && l !== null && 'name' in l) return String((l as { name: string }).name);
      return String(l);
    });
  } else if (typeof rawLabels === 'string' && rawLabels.trim()) {
    labelsList = rawLabels
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
  }

  if (labelsList.length > 0) {
    lines.push('labels:');
    labelsList.forEach((label) => lines.push(`  - ${label}`));
  }
  lines.push('---');
  lines.push('');

  lines.push(`# TESTY-${test.id}: ${test.name}\n`);

  if (test.description?.trim()) {
    lines.push('## Описание');
    lines.push(test.description.trim());
    lines.push('');
  }

  lines.push('## Сценарий');
  const parsedSteps: Array<{ action: string; expected?: string }> = [];

  if (typeof test.scenario === 'string' && test.scenario.trim()) {
    const scenarioLines = test.scenario
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    scenarioLines.forEach((line) => {
      // 1. Отрезаем "Шаг N.", "Шаг N:", "**Шаг 1.**" и любые вариации со звездочками
      const stepRegex = /^\**\s*(?:шаг\s*)?\d+\s*(?:\.|:|-)?\s*\**\s*(?:->|=>)?\s*/i;
      const cleanLine = line.replace(stepRegex, '').trim();
      if (!cleanLine) return;

      // 2. Разбиваем оставшуюся строку по стрелкам ->
      const parts = cleanLine
        .split(/\s*(?:->|=>)\s*/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length >= 2) {
        parsedSteps.push({
          action: parts[0],
          expected: parts.slice(1).join(' -> ').trim(),
        });
      } else if (parts.length === 1) {
        parsedSteps.push({ action: parts[0] });
      }
    });
  } else if (Array.isArray(test.steps) && test.steps.length > 0) {
    test.steps.forEach((step) => {
      const action = step.scenario || step.action || step.step || step.description || '';
      const expected = step.expected || step.expected_result || step.reaction || '';
      if (action) {
        parsedSteps.push({ action: action.trim(), expected: expected.trim() || undefined });
      }
    });
  }

  if (parsedSteps.length > 0) {
    parsedSteps.forEach((step, index) => {
      lines.push(`### Шаг ${index + 1}`);
      lines.push(`* **Действие:** ${step.action}`);
      if (step.expected) lines.push(`* **Ожидаемый результат:** ${step.expected}`);
      lines.push('');
    });
  } else {
    lines.push('_Шаги не указаны_\n');
  }

  const expectedResult = test.expected || test.expected_result;
  if (expectedResult?.trim()) {
    lines.push('## Итоговый ожидаемый результат');
    lines.push(expectedResult.trim());
    lines.push('');
  }

  return lines.join('\n');
}

async function syncTests(): Promise<void> {
  const headers = await getAuthHeaders();
  const baseUrl = API_URL.replace(/\/$/, '');
  const projectId = PROJECT_ID;

  console.log(`🔄 Загрузка списка сьютов...`);
  const suiteMap = await getSuiteMap(headers, projectId);

  let rawTestCases: TestCase[];

  if (values.case) {
    console.log(`🔄 Загрузка тест-кейса ID: ${values.case}...`);
    const res = await fetch(`${baseUrl}/cases/${values.case}/`, { headers });
    if (!res.ok) throw new Error(`Ошибка API: ${res.status} ${res.statusText}`);
    rawTestCases = [(await res.json()) as TestCase];
  } else {
    let url = `${baseUrl}/cases/?project=${projectId}&page_size=500`;
    if (values.suite) {
      console.log(`🔄 Загрузка сьюта ID ${values.suite}...`);
      url += `&suite=${values.suite}`;
    } else {
      console.log(`🔄 Загрузка всех тестов проекта ID ${projectId}...`);
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Ошибка API: ${res.status} ${res.statusText}`);
    const data = (await res.json()) as TestCase[] | { results: TestCase[] };
    rawTestCases = Array.isArray(data) ? data : data.results || [];
  }

  const casesBySuite = new Map<number, TestCase[]>();

  for (const item of rawTestCases) {
    let test = item;
    // Фича 4: Дозапрос деталей. Если качаем массово, идем за деталями.
    if (!values.case && item.id) {
      const detailRes = await fetch(`${baseUrl}/cases/${item.id}/`, { headers });
      if (detailRes.ok) {
        test = (await detailRes.json()) as TestCase;
      }
    }

    const suiteId = typeof test.suite === 'object' ? test.suite?.id : Number(test.suite);
    if (suiteId) {
      if (!casesBySuite.has(suiteId)) {
        casesBySuite.set(suiteId, []);
      }
      casesBySuite.get(suiteId)!.push(test);
    }
    console.log(`✅ Подготовлен тест-кейс: TESTY-${test.id}`);
  }

  // Запись файлов по сьютам
  for (const [suiteId, cases] of casesBySuite.entries()) {
    const suite = suiteMap.get(suiteId);
    const rawPath = suite ? suite.suite_path || suite.path || suite.name : `suite-${suiteId}`;
    const dirPath = resolveSuiteDirPath(rawPath);
    const targetDir = path.join(BASE_OUTPUT_DIR, dirPath);

    await fs.mkdir(targetDir, { recursive: true });

    // Фича 6: Создание README.md
    if (suite?.description?.trim()) {
      const readmeContent = [
        '---',
        'type: suite_requirements',
        `suite_id: ${suite.id}`,
        `title: "${suite.name.replace(/"/g, '\\"')}"`,
        '---',
        '',
        `# Требования и преднастройки: ${suite.name}`,
        '',
        suite.description.trim(),
        '',
      ].join('\n');

      const readmePath = path.join(targetDir, 'README.md');
      await fs.writeFile(readmePath, readmeContent, 'utf-8');
      console.log(`📄 README.md -> ${path.relative(process.cwd(), readmePath)}`);
    }

    // Фича 7: Генерация TEST-CASES.md (с сортировкой по ID)
    const sortedCases = [...cases].sort((a, b) => (a.id || 0) - (b.id || 0));
    const mdContent = sortedCases.map(formatTestCaseToMarkdown).join('\n---\n\n');
    const casesFilePath = path.join(targetDir, 'TEST-CASES.md');
    await fs.writeFile(casesFilePath, mdContent, 'utf-8');
    console.log(`📄 TEST-CASES.md -> ${path.relative(process.cwd(), casesFilePath)} (${sortedCases.length} шт.)`);
  }

  console.log(`\n🎉 Успешно обработано тест-кейсов: ${rawTestCases.length}`);
}

syncTests().catch((error: unknown) => {
  console.error('❌ Ошибка:', error);
  process.exitCode = 1;
});
