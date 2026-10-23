const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const fileUrl = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Wait a second for initial GSAP
  await page.waitForTimeout(1000);

  // Function to inspect slide state
  async function inspectSlide(idx) {
    return await page.evaluate((idx) => {
      window.goToSlide(idx);
      const s = document.querySelectorAll('.slide')[idx];
      return {
        id: s.id,
        className: s.className,
        styleOpacity: s.style.opacity,
        computedOpacity: window.getComputedStyle(s).opacity,
        visibility: window.getComputedStyle(s).visibility,
        display: window.getComputedStyle(s).display,
        childrenCount: s.children.length,
        htmlSnippet: s.innerHTML.slice(0, 300)
      };
    }, idx);
  }

  // Go to slide 32
  console.log('--- Slide 32 ---');
  let info = await inspectSlide(32);
  console.log(JSON.stringify(info, null, 2));
  await page.waitForTimeout(1000);

  // Go to slide 33
  console.log('--- Slide 33 (Digital Marketing) ---');
  info = await inspectSlide(33);
  console.log(JSON.stringify(info, null, 2));
  await page.waitForTimeout(1200);

  // Check visibility of elements in slide 33
  const slide33Elements = await page.evaluate(() => {
    const s = document.getElementById('slide-recog-dm');
    const els = s.querySelectorAll('*');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      className: el.className,
      opacity: window.getComputedStyle(el).opacity,
      display: window.getComputedStyle(el).display,
      visibility: window.getComputedStyle(el).visibility,
      transform: window.getComputedStyle(el).transform,
    })).filter(x => x.opacity === '0' || x.display === 'none' || x.visibility === 'hidden');
  });
  console.log('Slide 33 hidden/zero opacity elements:', slide33Elements);

  // Go to slide 34
  console.log('--- Slide 34 (Finale) ---');
  info = await inspectSlide(34);
  console.log(JSON.stringify(info, null, 2));
  await page.waitForTimeout(1500);

  // Check visibility of elements in slide 34
  const slide34Elements = await page.evaluate(() => {
    const s = document.getElementById('slide-finale');
    const els = s.querySelectorAll('*');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: el.innerText ? el.innerText.slice(0, 30) : '',
      opacity: window.getComputedStyle(el).opacity,
      display: window.getComputedStyle(el).display,
      visibility: window.getComputedStyle(el).visibility,
      transform: window.getComputedStyle(el).transform,
    }));
  });
  console.log('Slide 34 all elements state:');
  console.log(JSON.stringify(slide34Elements, null, 2));

  await browser.close();
})();
