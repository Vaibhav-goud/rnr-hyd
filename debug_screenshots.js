const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const fileUrl = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Navigate to slide 32
  await page.evaluate(() => window.goToSlide(32));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'slide32.png' });

  // Navigate to slide 33
  await page.evaluate(() => window.goToSlide(33));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'slide33_at_800ms.png' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'slide33_at_2800ms.png' });

  // Navigate to slide 34
  await page.evaluate(() => window.goToSlide(34));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'slide34_at_800ms.png' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'slide34_at_2800ms.png' });

  console.log('Screenshots taken!');
  await browser.close();
})();
