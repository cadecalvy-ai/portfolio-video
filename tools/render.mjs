// Renders index.html to an MP4, one exact frame at a time.
//   node tools/render.mjs                -> portfolio-video.mp4 (1920x1080, 30fps, 20s)
//   node tools/render.mjs --stills 1,4.5 -> PNG stills at those seconds (for checking)
import puppeteer from 'puppeteer-core';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FPS = 30;
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
await page.goto(pathToFileURL(path.join(root, 'index.html')).href + '?render', { waitUntil: 'networkidle0' });
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);
const fontOk = await page.evaluate(() => document.fonts.check('600 20px Inter'));
console.log('Inter loaded:', fontOk);

const shoot = async (t) => {
  await page.evaluate((t) => { window.renderAt(t); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
  return page.screenshot({ type: 'png' });
};

if (stillsArg) {
  const dir = path.join(root, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of stillsArg.split(',')) {
    fs.writeFileSync(path.join(dir, `t${(+s).toFixed(2).padStart(5, '0')}.png`), await shoot(+s));
  }
  console.log('stills written');
} else {
  const ffmpeg = execFileSync('python', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
  const out = path.join(root, 'portfolio-video.mp4');
  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'pipe'] });
  let err = '';
  ff.stderr.on('data', (d) => (err += d));
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    const png = await shoot(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${total}`);
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  console.log(code === 0 ? `done: ${out}` : `ffmpeg failed (${code})\n${err.slice(-1500)}`);
}
await browser.close();
