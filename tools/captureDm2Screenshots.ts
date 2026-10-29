import { createServer } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const gdmtRoot = path.resolve(__dirname, '..');
  const screenshotsDir = path.resolve(gdmtRoot, 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Starting vite dev server for DM2 screenshots...');
  const server = await createServer({
    root: gdmtRoot,
    configFile: path.resolve(gdmtRoot, 'vite.config.ts'),
    server: { port: 5188 }
  });
  await server.listen();

  const baseUrl = 'http://localhost:5188';
  console.log(`Server running at ${baseUrl}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Click on disease chip for ĐTĐ (dm2)
    // Find chip with text 'ĐTĐ' or 'Đái tháo đường'
    const chips = await page.$$('.disease-chip');
    for (const chip of chips) {
      const text = await chip.textContent();
      if (text && (text.includes('ĐTĐ') || text.includes('Đái tháo đường'))) {
        await chip.click();
        break;
      }
    }
    await page.waitForTimeout(400);

    // Click floating plan button to view plan on mobile
    const planBtn = await page.$('.floating-plan-btn');
    if (planBtn) {
      await planBtn.click();
      await page.waitForTimeout(500);
    } else {
      // or click segment
      const segmentBtn = await page.$('button:has-text("Kế hoạch")');
      if (segmentBtn) await segmentBtn.click();
    }
    await page.waitForTimeout(500);

    // Expand first plan row
    const firstRowHeader = await page.$('.plan-row-header');
    if (firstRowHeader) {
      await firstRowHeader.click();
      await page.waitForTimeout(300);
    }

    // Capture dm2_mobile_390_plan.png
    const planScreenshotPath = path.join(screenshotsDir, 'dm2_mobile_390_plan.png');
    await page.screenshot({ path: planScreenshotPath, fullPage: false });
    console.log(`✓ Saved ${planScreenshotPath}`);

    // Click on tab 'Bằng chứng' (Evidence / Matrix)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.mobile-tab-btn, .tab-item'));
      const evBtn = btns.find((b) => b.textContent?.includes('Bằng chứng')) as HTMLElement;
      if (evBtn) evBtn.click();
    });
    await page.waitForTimeout(600);
    const matrixScreenshotPath = path.join(screenshotsDir, 'dm2_mobile_390_matrix.png');
    await page.screenshot({ path: matrixScreenshotPath, fullPage: false });
    console.log(`✓ Saved ${matrixScreenshotPath}`);

    await page.close();
  } catch (err) {
    console.error('Error capturing DM2 screenshots:', err);
  } finally {
    await browser.close();
    await server.close();
  }
}

main();
