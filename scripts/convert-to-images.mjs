/**
 * HTML → 이미지 변환 스크립트 (G.ANCE)
 * 사용법: node scripts/convert-to-images.mjs output/시술명.html
 *
 * 필요 패키지: npm install puppeteer
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const htmlFile = process.argv[2];
if (!htmlFile) {
  console.error('사용법: node scripts/convert-to-images.mjs output/시술명.html');
  process.exit(1);
}

const htmlPath = path.resolve(rootDir, htmlFile);
if (!fs.existsSync(htmlPath)) {
  console.error(`파일을 찾을 수 없습니다: ${htmlPath}`);
  process.exit(1);
}

const baseName = path.basename(htmlFile, '.html');
const outputDir = path.join(rootDir, 'output', `${baseName}-images`);
fs.mkdirSync(outputDir, { recursive: true });

const WIDTH = 860;
const MAX_SECTION_HEIGHT = 2000;

async function run() {
  console.log(`변환 시작: ${htmlFile}`);
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // 전체 스크린샷
  const fullHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: WIDTH, height: fullHeight, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  const fullPath = path.join(outputDir, 'full.jpg');
  await page.screenshot({ path: fullPath, type: 'jpeg', quality: 92, fullPage: true });
  console.log(`전체 이미지 저장: ${fullPath}`);

  // 섹션별 분할
  const sections = await page.evaluate(() => {
    const sectionEls = document.querySelectorAll('section');
    return Array.from(sectionEls).map((el, i) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top + window.scrollY, height: rect.height, index: i + 1 };
    });
  });

  for (const sec of sections) {
    const chunkCount = Math.ceil(sec.height / MAX_SECTION_HEIGHT);
    for (let c = 0; c < chunkCount; c++) {
      const clipY = sec.top + c * MAX_SECTION_HEIGHT;
      const clipH = Math.min(MAX_SECTION_HEIGHT, sec.height - c * MAX_SECTION_HEIGHT);
      const suffix = chunkCount > 1 ? `-${c + 1}` : '';
      const sectionPath = path.join(outputDir, `section-${String(sec.index).padStart(2, '0')}${suffix}.jpg`);
      await page.screenshot({
        path: sectionPath,
        type: 'jpeg',
        quality: 92,
        clip: { x: 0, y: clipY, width: WIDTH, height: clipH }
      });
      console.log(`섹션 이미지 저장: ${sectionPath}`);
    }
  }

  await browser.close();

  console.log('\n변환 완료!');
  console.log(`위치: output/${baseName}-images/`);
  console.log('네이버 예약/플레이스 업로드: section-01.jpg 부터 순서대로 올려주세요.');
}

run().catch(err => {
  console.error('오류 발생:', err.message);
  process.exit(1);
});
