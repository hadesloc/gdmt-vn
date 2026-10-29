/**
 * Repeatable, synthetic-only browser trial for the internal GDMT-VN app.
 * Run with: npx tsx tools/e2e/internalTrial.ts
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

const BASE_URL = process.env.GDMT_E2E_BASE_URL ?? 'http://127.0.0.1:5180';
const OUTPUT_DIR = path.resolve('output/playwright/internal-trial-20261029');
const MODULES = [
  { label: 'Bệnh thận mạn', presetPrefix: 'ckd_preset_' },
  { label: 'ĐTĐ típ 2', presetPrefix: 'dm2_preset_' },
  { label: 'Tăng huyết áp', presetPrefix: 'htn_preset_' },
  { label: 'COPD', presetPrefix: 'copd_preset_' },
  { label: 'Hen phế quản', presetPrefix: 'preset_asthma_' },
  { label: 'Gút', presetPrefix: 'gout_preset_' },
  { label: 'Suy tim', presetPrefix: 'hf_preset_' },
  { label: 'Lipid máu', presetPrefix: 'lipid_preset_' },
  { label: 'Rung nhĩ', presetPrefix: 'af_preset_' }
];
type Outcome = { name: string; status: 'passed' | 'failed' | 'skipped'; detail?: string };
type SkippedStep = { skip: string };
const outcomes: Outcome[] = [];
const browserErrors: string[] = [];
let trialPage: Page | undefined;

function chromiumLaunchOptions() {
  if (process.env.GDMT_E2E_BROWSER_PATH) return { headless: true, executablePath: process.env.GDMT_E2E_BROWSER_PATH };
  const knownChrome = process.platform === 'win32'
    ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const executablePath = knownChrome.find((candidate) => existsSync(candidate));
  return executablePath ? { headless: true, executablePath } : { headless: true };
}

async function step(name: string, action: () => Promise<string | void | SkippedStep>): Promise<void> {
  process.stdout.write(`RUN ${name}\n`);
  try {
    const detail = await action();
    if (detail && typeof detail === 'object' && 'skip' in detail) {
      outcomes.push({ name, status: 'skipped', detail: detail.skip });
      process.stdout.write(`SKIP ${name} — ${detail.skip}\n`);
      return;
    }
    outcomes.push({ name, status: 'passed', detail: typeof detail === 'string' ? detail || undefined : undefined });
    process.stdout.write(`DONE ${name}\n`);
  } catch (error) {
    const detail = error instanceof Error ? error.stack || error.message : String(error);
    if (trialPage) {
      const slug = name.toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      try { await snap(trialPage, `failure-${slug}.png`); } catch { /* Keep the step's original failure. */ }
    }
    outcomes.push({ name, status: 'failed', detail });
    process.stdout.write(`FAIL ${name}\n`);
  }
}

async function snap(page: Page, filename: string): Promise<void> {
  await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: true, animations: 'disabled' });
}

async function expectPanel(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).waitFor({ state: 'visible', timeout: 10_000 });
}

async function selectModule(page: Page, label: string): Promise<void> {
  const chip = page.locator('.disease-chip').filter({ hasText: label }).first();
  await chip.waitFor({ state: 'visible' });
  if ((await chip.getAttribute('class'))?.includes('selected')) await chip.click();
  await chip.click();
}

async function fillField(page: Page, label: string, value: string): Promise<void> {
  const group = page.locator('.form-group').filter({ hasText: label }).first();
  await group.locator('input').fill(value);
}

async function clickDesktopTab(page: Page, label: string): Promise<void> {
  await page.locator('.nav-tabs .tab-item').filter({ hasText: label }).first().click();
}

function decodedUrlState(url: string): unknown {
  const hash = new URL(url).hash.replace(/^#v\d+=/, '');
  const value = JSON.parse(Buffer.from(hash, 'base64url').toString('utf8')) as Record<string, unknown>;
  const stripEmptyObjects = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(stripEmptyObjects);
    if (entry && typeof entry === 'object') {
      return Object.fromEntries(Object.entries(entry as Record<string, unknown>)
        .filter(([, child]) => !(child && typeof child === 'object' && !Array.isArray(child) && Object.keys(child).length === 0))
        .map(([key, child]) => [key, stripEmptyObjects(child)]));
    }
    return entry;
  };
  return stripEmptyObjects(value);
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch(chromiumLaunchOptions());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  trialPage = page;
  page.setDefaultTimeout(8_000);
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (msg) => { if (msg.type() === 'error') browserErrors.push(`console: ${msg.text()}`); });

  try {
    await step('Open local app and verify trial banner', async () => {
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      assert(response && response.ok(), `App returned ${response?.status()}`);
      await expectPanel(page, 'app-shell');
      assert.equal(await page.getByTestId('module-inputs-_demo').count(), 0,
        'A demo-only module must not appear in the default internal trial');
      const banner = page.getByTestId('trial-banner');
      await banner.waitFor({ state: 'visible', timeout: 8_000 });
      assert.match((await banner.innerText()).toLowerCase(), /thử nghiệm nội bộ|internal trial/);
      await snap(page, '01-desktop-home.png');
      return `Opened ${BASE_URL}; banner is visible.`;
    });

    await step('Smoke all 9 registered disease modules and their preset dialogs', async () => {
      await clickDesktopTab(page, 'Phác đồ');
      await expectPanel(page, 'patient-form-panel');
      const chips = page.locator('.chips-container .disease-chip');
      assert.equal(await chips.count(), 9, 'Expected the 9 visible clinical modules');
      const moduleResults: string[] = [];
      for (const { label, presetPrefix } of MODULES) {
        await selectModule(page, label);
        await expectPanel(page, 'plan-list-panel');
        const rows = await page.locator('[data-testid^="plan-row-"]').count();
        assert(rows > 0, `${label} did not produce a plan row`);
        await page.getByRole('button', { name: '📋 BN mẫu' }).click();
        const presetItems = page.locator('[data-testid^="preset-item-"]');
        const count = await presetItems.count();
        assert(count > 0, `${label}: no preset is available in the production registry`);
        const modulePreset = page.locator(`[data-testid^="preset-item-${presetPrefix}"]`).first();
        await modulePreset.waitFor({ state: 'visible' });
        const presetId = (await modulePreset.getAttribute('data-testid'))?.replace('preset-item-', '');
        await modulePreset.click();
        await expectPanel(page, 'plan-list-panel');
        assert((await page.locator('[data-testid^="plan-row-"]').count()) > 0, `${presetId} did not produce a plan`);
        moduleResults.push(`${label}: ${rows} rows before preset; applied ${presetId} (${count} registry presets)`);
      }
      await snap(page, '02-modules-smoke.png');
      return moduleResults.join('; ');
    });

    await step('Manually enter synthetic patient and a recorded medication dose', async () => {
      await page.getByRole('button', { name: 'Hồ sơ mới', exact: true }).click();
      const newCaseDialog = page.getByRole('dialog', { name: 'Bắt đầu hồ sơ mới' });
      await newCaseDialog.waitFor({ state: 'visible' });
      await newCaseDialog.getByRole('button', { name: 'Tạo hồ sơ trống', exact: true }).click();
      await selectModule(page, 'Suy tim');
      await fillField(page, 'Tuổi', '58');
      await fillField(page, 'Cân nặng', '72');
      await fillField(page, 'Chiều cao', '170');
      await fillField(page, 'HA tâm thu', '126');
      await fillField(page, 'HA tâm trương', '78');
      await fillField(page, 'Nhịp tim', '72');
      await fillField(page, 'Creatinin', '88.4');
      await fillField(page, 'Kali máu', '4.3');
      await page.getByRole('button', { name: 'Nam', exact: true }).click();
      await page.getByLabel('Phân suất tống máu thất trái hiện tại (LVEF)').fill('30');
      await page.getByLabel('Phân độ cơ năng NYHA').selectOption('2');
      const medChip = page.getByRole('button', { name: 'Bisoprolol', exact: true });
      await medChip.waitFor({ state: 'visible' });
      await medChip.click();
      const recordedDose = page.locator('.current-meds__dose-choices button[aria-label*="3.75 mg"]').first();
      await recordedDose.waitFor({ state: 'visible' });
      await recordedDose.click();
      assert((await recordedDose.getAttribute('aria-pressed')) === 'true', 'Bisoprolol 3.75 mg was not selected');
      assert(await page.locator('.current-meds__recorded').count(), 'Recorded dose feedback was not shown');
      assert.match(await page.locator('.current-meds__recorded').first().innerText(), /3\.75\s*mg/,
        'Selected Bisoprolol dose does not show 3.75 mg');
      assert.equal(await page.locator('.current-meds__recorded').count(), 1, 'Expected exactly one medication in the blank case');
      await expectPanel(page, 'plan-list-panel');
      await snap(page, '03-manual-patient-dose.png');
      return 'Started from a confirmed blank case; entered synthetic HF HFrEF inputs and exactly one Bisoprolol 3.75 mg dose.';
    });

    await step('Expand recommendations and verify source evidence and dose detail', async () => {
      await page.locator('.plan-row-header').first().click();
      const expandedBodies = page.locator('[data-testid^="plan-row-body-"]');
      assert((await expandedBodies.count()) === 1, 'Expected one recommendation detail to expand');
      const sources = page.locator('.evidence-quote-box');
      assert((await sources.count()) > 0, 'No source citations are rendered after expansion');
      const doseText = await page.locator('.plan-row-dose').allInnerTexts();
      assert(doseText.length > 0, 'No drug dose text was present in the generated plan');
      await snap(page, '04-expanded-sources-doses.png');
      return `${await expandedBodies.count()} details expanded; ${await sources.count()} cited source blocks; dose text present.`;
    });

    await step('Toggle reviewed-only filtering and keep safety alerts visible', async () => {
      const allRows = await page.locator('.plan-row-card').count();
      const allNames = await page.locator('.plan-row-name').allInnerTexts();
      const allStartNames = await page.locator('.plan-row-card').evaluateAll((rows) => rows.flatMap((row) => {
        const action = row.querySelector('.badge-action')?.textContent?.trim();
        const name = row.querySelector('.plan-row-name')?.textContent?.trim();
        return action === 'BẮT ĐẦU' && name ? [name] : [];
      }));
      const allAlerts = await page.locator('[data-testid="safety-alerts-box"]').count();
      await clickDesktopTab(page, 'Cài đặt');
      const reviewedOnly = page.getByRole('checkbox', { name: /Chỉ hiển thị các khuyến cáo đã qua kiểm duyệt/ });
      await reviewedOnly.check();
      await clickDesktopTab(page, 'Phác đồ');
      const filteredRows = await page.locator('.plan-row-card').count();
      const filteredNames = await page.locator('.plan-row-name').allInnerTexts();
      const filteredAlerts = await page.locator('[data-testid="safety-alerts-box"]').count();
      assert(filteredRows <= allRows, 'Reviewed-only filter increased the visible recommendations');
      assert.equal(filteredAlerts, allAlerts, 'Safety alerts disappeared when recommendations were filtered');
      const filteredNameSet = new Set(filteredNames);
      const hiddenStarts = allStartNames.filter((name) => !filteredNameSet.has(name));
      await page.getByRole('button', { name: /Ghi chú/ }).first().click();
      const noteDialog = page.getByRole('dialog', { name: 'Ghi chú kế hoạch' });
      const filteredNote = await noteDialog.getByRole('textbox', { name: 'Nội dung ghi chú', exact: true }).inputValue();
      for (const hiddenName of hiddenStarts) assert(!filteredNote.includes(hiddenName), `Filtered note includes hidden recommendation: ${hiddenName}`);
      await noteDialog.getByRole('button', { name: 'Đóng Ghi chú kế hoạch', exact: true }).click();
      await clickDesktopTab(page, 'Cài đặt');
      await page.getByRole('checkbox', { name: /Chỉ hiển thị các khuyến cáo đã qua kiểm duyệt/ }).uncheck();
      await clickDesktopTab(page, 'Phác đồ');
      assert.equal(await page.locator('.plan-row-card').count(), allRows, 'Disabling reviewed-only did not restore recommendations');
      await snap(page, '04-reviewed-only-filter.png');
      return `Filtered ${allRows} recommendations to ${filteredRows}; safety alerts remained ${allAlerts}; note excluded ${hiddenStarts.length} hidden start recommendation(s).`;
    });

    await step('Switch profile and settings, then confirm URL state survives reload', async () => {
      await page.getByRole('button', { name: 'Bộ Y tế', exact: true }).first().click();
      await clickDesktopTab(page, 'Cài đặt');
      await expectPanel(page, 'settings-view-panel');
      await page.getByRole('button', { name: 'Hoa Kỳ (US)', exact: true }).click();
      await page.getByRole('button', { name: 'Tối', exact: true }).click();
      await clickDesktopTab(page, 'Phác đồ');
      await page.getByRole('button', { name: 'Hoa Kỳ', exact: true }).click();
      const beforeHash = new URL(page.url()).hash;
      assert(beforeHash.length > 1, 'Expected encoded patient/settings state in URL hash');
      await page.reload({ waitUntil: 'networkidle' });
      await expectPanel(page, 'plan-list-panel');
      assert.deepEqual(decodedUrlState(page.url()), decodedUrlState(`${BASE_URL}${beforeHash}`),
        'Patient or settings values changed after URL reload');
      await clickDesktopTab(page, 'Cài đặt');
      assert(await page.getByRole('button', { name: 'Hoa Kỳ (US)', exact: true }).getAttribute('class')?.then((c) => c?.includes('active')),
        'US profile did not persist after reload');
      await snap(page, '05-profile-settings-reload.png');
      return 'US profile, dark theme, and URL hash persisted across reload.';
    });

    await step('Exercise local case export and import', async () => {
      await clickDesktopTab(page, 'Phác đồ');
      const save = page.getByRole('button', { name: 'Lưu hồ sơ', exact: true });
      const open = page.getByRole('button', { name: 'Mở hồ sơ', exact: true });
      await save.waitFor({ state: 'visible' });
      await open.waitFor({ state: 'visible' });
      const downloadPromise = page.waitForEvent('download');
      await save.click();
      const download = await downloadPromise;
      const casePath = path.join(OUTPUT_DIR, 'synthetic-case.json');
      await download.saveAs(casePath);
      const exported = JSON.parse(await (await import('node:fs/promises')).readFile(casePath, 'utf8')) as {
        format: string; version: number; patient: { age?: number; currentMeds?: unknown[]; [key: string]: unknown };
        settings: { units?: Record<string, unknown>; profile?: string; theme?: string; [key: string]: unknown };
      };
      assert.equal(exported.format, 'gdmt-vn-case', 'Unexpected case export format');
      assert.equal(exported.version, 1, 'Unexpected case export version');
      assert.equal(exported.patient.age, 58, 'Export did not preserve synthetic patient state');
      assert.deepEqual((exported.patient.currentMeds ?? []).map((med) => {
        const record = med as Record<string, unknown>;
        return { drugId: record.drugId, dose: String(record.dose), unit: record.unit };
      }), [{ drugId: 'bisoprolol', dose: '3.75', unit: 'mg' }], 'Export did not preserve exactly one Bisoprolol 3.75 mg medication record');
      assert.equal(exported.settings.profile, 'US', 'Export did not preserve selected guideline profile');
      assert.equal(exported.settings.theme, 'dark', 'Export did not preserve selected theme');
      assert(exported.settings.units?.cr, 'Export did not preserve clinical measurement units');
      await fillField(page, 'Tuổi', '67');
      await page.getByTestId('case-file-input').setInputFiles({
        name: 'invalid-case.json', mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ format: 'wrong-format', version: 1, patient: {}, settings: {} }))
      });
      await page.getByRole('alert').filter({ hasText: 'Không đúng định dạng' }).waitFor({ state: 'visible' });
      assert.equal(await page.locator('.form-group').filter({ hasText: 'Tuổi' }).locator('input').inputValue(), '67',
        'Rejected import changed the open patient');
      const chooserPromise = page.waitForEvent('filechooser');
      await open.click();
      const chooser = await chooserPromise;
      await chooser.setFiles(casePath);
      const importDialog = page.getByRole('dialog', { name: 'Mở hồ sơ đã lưu' });
      await importDialog.waitFor({ state: 'visible' });
      await importDialog.getByRole('button', { name: 'Dùng hồ sơ này', exact: true }).click();
      assert.equal(await page.locator('.form-group').filter({ hasText: 'Tuổi' }).locator('input').inputValue(), '58',
        'Imported case did not restore the saved synthetic patient');
      await page.reload({ waitUntil: 'networkidle' });
      await expectPanel(page, 'plan-list-panel');
      assert.equal(await page.locator('.form-group').filter({ hasText: 'Tuổi' }).locator('input').inputValue(), '58',
        'Imported case patient state did not persist on reload');
      const reloadedState = decodedUrlState(page.url()) as { patient: { currentMeds?: unknown[] }; settings: Record<string, unknown> };
      assert.deepEqual(reloadedState.patient.currentMeds, exported.patient.currentMeds,
        'Imported medication records changed after reload');
      assert.deepEqual(reloadedState.settings, exported.settings, 'Imported settings or measurement units changed after reload');
      await clickDesktopTab(page, 'Cài đặt');
      const usProfileActive = (await page.getByRole('button', { name: 'Hoa Kỳ (US)', exact: true }).getAttribute('class'))?.includes('active');
      assert(usProfileActive, 'Imported guideline profile did not persist on reload');
      await clickDesktopTab(page, 'Phác đồ');
      assert((await page.locator('.current-meds__recorded').first().innerText()).includes('Đã ghi nhận:'),
        'Imported recorded medication dose is not visible');
      await snap(page, '06-case-export-import.png');
      return `Exported exactly one Bisoprolol 3.75 mg record, rejected malformed import without changing age 67, then restored valid ${download.suggestedFilename()} and verified exact medication/settings state after reload.`;
    });

    await step('Preview plan note and copy-link fallback', async () => {
      await page.evaluate(`Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: function() { return Promise.reject(new Error('Internal trial forced clipboard denial')); } }
      })`);
      const noteAction = page.getByRole('button', { name: /Ghi chú/ }).first();
      await noteAction.click();
      const noteDialog = page.getByRole('dialog', { name: 'Ghi chú kế hoạch' });
      await noteDialog.waitFor({ state: 'visible' });
      const note = noteDialog.getByLabel('Nội dung ghi chú');
      assert((await note.inputValue()).trim().length > 0, 'Note preview is empty');
      await noteDialog.getByRole('button', { name: 'Sao chép', exact: true }).click();
      await noteDialog.getByRole('alert').waitFor({ state: 'visible' });
      await noteDialog.getByRole('button', { name: 'Đóng Ghi chú kế hoạch', exact: true }).click();

      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
      await page.getByRole('button', { name: 'Link', exact: false }).first().click();
      const linkDialog = page.getByRole('dialog', { name: 'Liên kết hồ sơ' });
      await linkDialog.waitFor({ state: 'visible' });
      assert((await linkDialog.getByRole('textbox', { name: 'Liên kết hồ sơ', exact: true }).inputValue()).includes('#v1='),
        'Link fallback does not show the share URL');
      await linkDialog.getByRole('button', { name: 'Sao chép', exact: true }).click();
      await linkDialog.getByRole('alert').waitFor({ state: 'visible' });
      await snap(page, '07-note-link-fallbacks.png');
      await linkDialog.getByRole('button', { name: 'Đóng Liên kết hồ sơ', exact: true }).click();
      return 'Note preview and clipboard-failure share-link fallback both opened with content.';
    });

    await step('Check phone layouts at 390×844 and 360×780', async () => {
      for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 780 }]) {
        await page.setViewportSize(viewport);
        const patientSegment = page.locator('.mobile-only-segmented button').filter({ hasText: 'Bệnh nhân' });
        const planSegment = page.locator('.mobile-only-segmented button').filter({ hasText: 'Kế hoạch' });
        await patientSegment.waitFor({ state: 'visible' });
        const dimensions = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }));
        assert(dimensions.scrollWidth <= dimensions.width, `Horizontal overflow at ${viewport.width}px: ${JSON.stringify(dimensions)}`);
        await planSegment.click();
        await expectPanel(page, 'plan-list-panel');
        assert.equal(await page.getByTestId('patient-form-panel').isVisible(), false, 'Patient view should be hidden on plan segment');
        await patientSegment.click();
        await expectPanel(page, 'patient-form-panel');
        assert.equal(await page.getByTestId('plan-list-panel').isVisible(), false, 'Plan view should be hidden on patient segment');
        await snap(page, `07-mobile-${viewport.width}x${viewport.height}.png`);
      }
      return 'Both target viewports fit without horizontal overflow and segment switching works.';
    });

    await step('Attempt warmed service-worker offline reload on localhost', async () => {
      const local = new URL(BASE_URL).hostname.match(/^(localhost|127\.0\.0\.1)$/);
      if (!local) return { skip: 'Offline service-worker trial is scoped to localhost.' };
      const swReady = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        try {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3_000))
          ]);
          return Boolean(navigator.serviceWorker.controller);
        } catch { return false; }
      });
      if (!swReady) {
        assert(swReady, 'No controlling service worker is active for localhost offline reload.');
      }
      await context.setOffline(true);
      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
        await expectPanel(page, 'app-shell');
        await snap(page, '08-offline-warmed-reload.png');
      } finally { await context.setOffline(false); }
      return 'Warmed service worker served the app after network was disabled.';
    });

    await step('Print the clinical plan to PDF', async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ media: 'print' });
      const printState = await page.evaluate(() => {
        const selectors = ['html', 'body', '#root', '.app-shell', '.print-document'];
        const backgrounds: Record<string, string> = {};
        for (const selector of selectors) {
          backgrounds[selector] = getComputedStyle(document.querySelector(selector) ?? document.documentElement).backgroundColor;
        }
        const appShell = document.querySelector('.app-shell');
        const printDocument = document.querySelector<HTMLElement>('.print-document');
        const main = document.querySelector<HTMLElement>('.app-shell > main');
        const header = document.querySelector<HTMLElement>('.app-shell > header');
        const hiddenPanes = document.querySelectorAll<HTMLElement>('.col-patient, .col-plan');
        let interactivePanesVisible = false;
        for (const pane of hiddenPanes) if (pane.checkVisibility()) interactivePanesVisible = true;
        return {
          backgrounds,
          appShellMinHeight: appShell ? getComputedStyle(appShell).minHeight : null,
          printDocumentDisplay: printDocument ? getComputedStyle(printDocument).display : null,
          appMainDisplay: main ? getComputedStyle(main).display : null,
          appHeaderDisplay: header ? getComputedStyle(header).display : null,
          interactivePanesVisible,
          documentText: printDocument?.innerText ?? '',
          noteText: printDocument?.querySelector('pre')?.textContent ?? ''
        };
      });
      for (const [selector, background] of Object.entries(printState.backgrounds)) {
        assert.equal(background, 'rgb(255, 255, 255)', `${selector} does not have a white print background`);
      }
      assert.equal(printState.appShellMinHeight, '0px', 'App shell keeps a viewport-height minimum when printing');
      assert.equal(printState.printDocumentDisplay, 'block', 'Dedicated print document is hidden in print media');
      assert.equal(printState.appMainDisplay, 'none', 'Interactive app content is visible in print media');
      assert.equal(printState.appHeaderDisplay, 'none', 'Interactive header is visible in print media');
      assert.equal(printState.interactivePanesVisible, false, 'Hidden patient or plan panes remain visible in print media');
      assert(printState.noteText.trim().length > 500, 'Final visible plan note is unexpectedly empty or incomplete');
      assert.match(printState.documentText, /Bản thử nghiệm nội bộ/);
      assert.match(printState.documentText, /Tuổi: 58/);
      assert.match(printState.documentText, /3\.75 mg/);
      await page.pdf({ path: path.join(OUTPUT_DIR, 'internal-trial-plan.pdf'), format: 'A4', printBackground: true });
      await page.emulateMedia({ media: 'screen' });
      const { stat } = await import('node:fs/promises');
      const pdf = await stat(path.join(OUTPUT_DIR, 'internal-trial-plan.pdf'));
      assert(pdf.size > 2_000, `PDF is unexpectedly small (${pdf.size} bytes)`);
      return `A4 PDF saved (${pdf.size} bytes).`;
    });

    outcomes.push({
      name: 'Browser runtime errors',
      status: browserErrors.length ? 'failed' : 'passed',
      detail: browserErrors.length ? browserErrors.join('\n') : 'No page errors or console errors observed.'
    });
  } finally {
    await context.close();
    await browser.close();
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      syntheticDataOnly: true,
      outcomes,
      artifactsDirectory: OUTPUT_DIR
    };
    await writeFile(path.join(OUTPUT_DIR, 'results.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    const summary = outcomes.map((result) => `${result.status.toUpperCase()} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`).join('\n');
    process.stdout.write(`${summary}\nResults: ${path.join(OUTPUT_DIR, 'results.json')}\n`);
    if (outcomes.some(({ status }) => status === 'failed')) process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
