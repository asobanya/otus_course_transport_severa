/// <reference types="node" />
import type { Reporter, FullConfig, Suite, TestCase, TestResult } from '@playwright/test/reporter';

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Укажите ${name} в файле .env`);
  }
  return value;
}

export default class TmsReporter implements Reporter {
  private token = '';
  private baseUrl = '';
  private planId = '';
  private projectId = '';
  private caseMap = new Map<string, number>();
  private pending: Promise<unknown>[] = [];
  private sentCount = 0; // Считаем, сколько статусов успешно отправилось

  async onBegin(_: FullConfig, __: Suite) {
    const apiUrl = requireEnvironment('TESTY_API_URL');
    requireEnvironment('TESTY_USERNAME');
    requireEnvironment('TESTY_PASSWORD');
    this.projectId = requireEnvironment('TESTY_PROJECT_ID');
    this.planId = requireEnvironment('TESTY_PLAN_ID');

    this.baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

    await this.login();
    await this.fetchTestCases();
  }

  private async login() {
    const res = await fetch(`${this.baseUrl}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: requireEnvironment('TESTY_USERNAME'),
        password: requireEnvironment('TESTY_PASSWORD'),
      }),
    });

    if (!res.ok) throw new Error(`Auth failed (${res.status})`);
    const data = await res.json();
    this.token = data.access || data.token;
  }

  private async fetchTestCases() {
    const queue = [this.planId];
    const visited = new Set<string>();

    while (queue.length) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const res = await fetch(
        `${this.baseUrl}/api/v2/testplans/union/?project=${this.projectId}&parent=${currentId}&page_size=500`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      if (!res.ok) continue;

      const { results = [] } = await res.json();
      for (const item of results) {
        const caseId = typeof item.case === 'object' ? item.case?.id : item.case || item.case_id;

        if (caseId && item.id) {
          this.caseMap.set(String(caseId), item.id);
        } else if (item.id && item.union_count !== 0) {
          queue.push(item.id);
        }
      }
    }
    console.log(`✅ TMS: Загружено ${this.caseMap.size} тестов из плана #${this.planId}`);
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    if (!this.planId || !this.caseMap.size) return;

    const match = test.title.match(/\[(?:TESTY-)?(\d+)\]/i);
    if (!match) return;

    const caseId = match[1];
    const instanceId = this.caseMap.get(caseId);
    if (!instanceId) return;

    this.pending.push(this.sendResult(caseId, instanceId, result));
  }

  private async sendResult(caseId: string, instanceId: number, result: TestResult) {
    const status = result.status === 'passed' ? 2 : result.status === 'skipped' ? 3 : 1;

    const payload = {
      test: instanceId,
      status,
      execution_time: Math.round(result.duration / 1000),
      attachments: [],
      attributes: {},
      steps_results: [],
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/v2/results/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        this.sentCount++; // Увеличиваем счетчик без вывода в консоль
      } else {
        console.error(`🚨 [TESTY-${caseId}] Ошибка ${res.status}: ${await res.text()}`);
      }
    } catch (e) {
      console.error(`🚨 [TESTY-${caseId}] Network error:`, e);
    }
  }

  async onEnd() {
    if (this.pending.length) {
      await Promise.allSettled(this.pending);
    }

    // Выводим итоговую строку только если что-то реально отправилось
    if (this.sentCount > 0) {
      console.log(
        `\n✅ Статусы по тестам плана [${this.planId}] отправлены в TMS (успешно обновлено ${this.sentCount} записей).\n`,
      );
    }
  }
}
