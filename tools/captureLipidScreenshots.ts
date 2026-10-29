import { preview } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Đang khởi động preview server...');
  const server = await preview({
    preview: {
      port: 5195,
      host: true
    }
  });

  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5195';
  console.log(`Server preview đang chạy tại: ${baseUrl}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true
  });

  try {
    // 1. Desktop Kế hoạch điều trị
    console.log('Đang chụp ảnh Desktop Kế hoạch điều trị (lipid_desktop_plan.png)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 850 }
    });
    await desktopPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(1000);

    // Mở modal preset bằng text
    await desktopPage.click('text=BN mẫu');
    await desktopPage.waitForTimeout(500);

    // Click chọn preset ACS
    await desktopPage.click('text=Hội chứng vành cấp');
    await desktopPage.waitForTimeout(800);

    // Mở rộng dòng khuyến cáo đầu tiên
    const planRow = await desktopPage.$('.plan-row-header');
    if (planRow) {
      await planRow.click();
      await desktopPage.waitForTimeout(400);
    }

    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'lipid_desktop_plan.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu lipid_desktop_plan.png');

    // 2. Desktop Ma trận (1280x850)
    console.log('Đang chụp ảnh Ma trận (lipid_desktop_matrix.png)...');
    await desktopPage.click('text=Bằng chứng');
    await desktopPage.waitForTimeout(600);
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'lipid_desktop_matrix.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu lipid_desktop_matrix.png');

    // 3. Desktop Lộ trình (1280x850)
    console.log('Đang chụp ảnh Lộ trình (lipid_pathway.png)...');
    await desktopPage.click('text=Lộ trình');
    await desktopPage.waitForTimeout(600);
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'lipid_pathway.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu lipid_pathway.png');

    await desktopPage.close();

    // 4. Mobile Kế hoạch điều trị (390x844)
    console.log('Đang chụp ảnh Mobile Kế hoạch điều trị (lipid_mobile_plan.png)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.click('text=BN mẫu');
    await mobilePage.waitForTimeout(500);

    await mobilePage.click('text=Hội chứng vành cấp');
    await mobilePage.waitForTimeout(800);

    // Bấm xem Kế hoạch trên mobile
    const floatingBtn = await mobilePage.$('.floating-plan-btn') || await mobilePage.$('button:has-text("Kế hoạch")');
    if (floatingBtn) {
      await floatingBtn.click();
      await mobilePage.waitForTimeout(400);
    }

    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'lipid_mobile_plan.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu lipid_mobile_plan.png');

    await mobilePage.close();

    console.log('🎉 ĐÃ CHỤP THÀNH CÔNG TẤT CẢ 4 ẢNH MÀN HÌNH MODULE LIPID!');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

main().catch(err => {
  console.error('Lỗi khi chụp ảnh màn hình:', err);
  process.exit(1);
});
