import { preview } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Khởi động server preview từ build dist
  console.log('Đang khởi động preview server...');
  const server = await preview({
    preview: {
      port: 5180,
      host: true
    }
  });

  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5180';
  const urlWithDemo = `${baseUrl}?demo=1`;
  console.log(`Server preview đang chạy tại: ${urlWithDemo}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true
  });

  try {
    // 1. Tạo PNG Icon cho PWA từ favicon.svg
    const iconPage = await browser.newPage();
    const svgContent = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf-8');
    await iconPage.setContent(`
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: transparent;">
          <div style="width: 100vw; height: 100vh;">${svgContent}</div>
        </body>
      </html>
    `);

    await iconPage.setViewportSize({ width: 192, height: 192 });
    await iconPage.screenshot({ path: path.join(publicDir, 'pwa-192x192.png') });
    console.log('✓ Đã tạo pwa-192x192.png');

    await iconPage.setViewportSize({ width: 512, height: 512 });
    await iconPage.screenshot({ path: path.join(publicDir, 'pwa-512x512.png') });
    console.log('✓ Đã tạo pwa-512x512.png');

    await iconPage.close();

    // 2. Chụp ảnh màn hình Desktop (1280x800)
    console.log('Đang chụp ảnh màn hình Desktop (1280x800)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    });
    await desktopPage.goto(urlWithDemo, { waitUntil: 'networkidle' });

    // Mở 1 dòng trong Kế hoạch (dòng đầu tiên)
    const firstRowHeader = await desktopPage.$('.plan-row-header');
    if (firstRowHeader) {
      await firstRowHeader.click();
      await desktopPage.waitForTimeout(300);
    }

    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop_plan.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu desktop_plan.png');

    // Chuyển sang tab Bằng chứng (Ma trận)
    const evidenceTab = await desktopPage.$('button.tab-item:has-text("Bằng chứng")');
    if (evidenceTab) {
      await evidenceTab.click();
      await desktopPage.waitForTimeout(400);
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'desktop_matrix.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu desktop_matrix.png');
    }

    await desktopPage.close();

    // 3. Chụp ảnh màn hình Mobile Standard (390x844 - iPhone 14/15/16)
    console.log('Đang chụp ảnh màn hình Mobile Standard (390x844)...');
    const mobile390Page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    await mobile390Page.goto(urlWithDemo, { waitUntil: 'networkidle' });

    // Bấm xem Kế hoạch trên mobile
    const floatingBtn390 = await mobile390Page.$('.floating-plan-btn');
    if (floatingBtn390) {
      await floatingBtn390.click();
      await mobile390Page.waitForTimeout(300);

      const mobRow = await mobile390Page.$('.plan-row-header');
      if (mobRow) {
        await mobRow.click();
        await mobile390Page.waitForTimeout(300);
      }

      await mobile390Page.screenshot({
        path: path.join(screenshotsDir, 'mobile_plan.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu mobile_plan.png');
    }

    const mob390EvidenceBtn = await mobile390Page.$('button.mobile-tab-btn:has-text("Bằng chứng")');
    if (mob390EvidenceBtn) {
      await mob390EvidenceBtn.click();
      await mobile390Page.waitForTimeout(400);
      await mobile390Page.screenshot({
        path: path.join(screenshotsDir, 'mobile_matrix.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu mobile_matrix.png');
    }

    await mobile390Page.close();

    // 4. Kiểm tra Responsive & Overflow trên Mobile nhỏ (360x780 - Galaxy S8/S9 / màn hình hẹp)
    console.log('Đang kiểm tra không có horizontal overflow ở 360px trên mọi tab...');
    const mobile360Page = await browser.newPage({
      viewport: { width: 360, height: 780 },
      isMobile: true,
      hasTouch: true
    });
    await mobile360Page.goto(urlWithDemo, { waitUntil: 'networkidle' });

    // Chụp Bệnh nhân 360px
    await mobile360Page.screenshot({
      path: path.join(screenshotsDir, 'mobile_360_patient.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu mobile_360_patient.png');

    // Chuyển sang Kế hoạch và mở 1 dòng
    const floatingBtn360 = await mobile360Page.$('.floating-plan-btn');
    if (floatingBtn360) {
      await floatingBtn360.click();
      await mobile360Page.waitForTimeout(300);

      const mobRow = await mobile360Page.$('.plan-row-header');
      if (mobRow) {
        await mobRow.click();
        await mobile360Page.waitForTimeout(300);
      }

      await mobile360Page.screenshot({
        path: path.join(screenshotsDir, 'mobile_360_plan.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu mobile_360_plan.png');
    }

    // Chuyển sang tab Bằng chứng
    const mob360EvidenceBtn = await mobile360Page.$('button.mobile-tab-btn:has-text("Bằng chứng")');
    if (mob360EvidenceBtn) {
      await mob360EvidenceBtn.click();
      await mobile360Page.waitForTimeout(400);
      await mobile360Page.screenshot({
        path: path.join(screenshotsDir, 'mobile_360_matrix.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu mobile_360_matrix.png');
    }

    // Kiểm tra tràn ngang scrollWidth <= innerWidth trên toàn bộ 5 tab mobile
    const tabNames = ['Lộ trình', 'Phác đồ', 'Bằng chứng', 'Học', 'Cài đặt'];
    for (const tabName of tabNames) {
      const tabBtn = await mobile360Page.$(`button.mobile-tab-btn:has-text("${tabName}")`);
      if (tabBtn) {
        await tabBtn.click();
        await mobile360Page.waitForTimeout(250);

        const overflowCheck = await mobile360Page.evaluate(() => {
          const scrollW = document.documentElement.scrollWidth;
          const innerW = window.innerWidth;
          return {
            scrollWidth: scrollW,
            innerWidth: innerW,
            isOverflowing: scrollW > innerW
          };
        });

        if (overflowCheck.isOverflowing) {
          throw new Error(
            `PHÁT HIỆN LỖI TRÀN NGANG tại 360px trên tab "${tabName}": scrollWidth (${overflowCheck.scrollWidth}) > innerWidth (${overflowCheck.innerWidth})`
          );
        } else {
          console.log(`✓ Tab "${tabName}" đạt chuẩn 360px: scrollWidth (${overflowCheck.scrollWidth}) <= innerWidth (${overflowCheck.innerWidth})`);
        }
      }
    }

    await mobile360Page.close();
    console.log('🎉 Hoàn tất kiểm định toàn diện và chụp màn hình!');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

main().catch((err) => {
  console.error('Lỗi khi chụp màn hình hoặc kiểm định:', err);
  process.exit(1);
});
