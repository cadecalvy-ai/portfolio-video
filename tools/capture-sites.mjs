// Screenshots each portfolio project so the video uses the portfolio's own visuals.
// Live sites are captured from their public URLs; Tax Scan (its live site is behind a
// Netlify login) is captured from the demo pages in the public GitHub repo (snapshots/taxscan).
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const local = (p) => pathToFileURL(path.join(root, 'snapshots', 'taxscan', p)).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Scroll so the first heading containing `text` sits near the top of the viewport.
const toHeading = (text, offset = 90) => async (page) => {
  await page.evaluate(
    (text, offset) => {
      const h = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.innerText.includes(text));
      if (h) window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - offset);
    },
    text,
    offset,
  );
};

const HIDE = '#nl-badge-frame, .sugg-fab { display: none !important; }';

const jobs = [
  {
    url: 'https://sk-league.netlify.app/',
    // The score ticker and banner are hidden so the hero reads cleanly at thumbnail size.
    css: HIDE + '.construct, .ticker { display: none !important; }',
    shots: [
      { name: 'skleague-memory', prep: async (p) => { await p.click('#tab-memory'); } },
    ],
  },
  {
    url: 'https://thelawnwrangler.netlify.app',
    css: HIDE,
    shots: [
      { name: 'lawnwrangler-hero' },
      { name: 'lawnwrangler-mowcast', prep: toHeading('Mow-cast') },
      { name: 'lawnwrangler-lights', prep: toHeading('Stress-free') },
    ],
  },
  {
    url: 'https://why-advisor-launch.netlify.app/',
    css: HIDE,
    shots: [
      { name: 'advisorlaunch-hero' },
      { name: 'advisorlaunch-chart', prep: toHeading('Every launch', 140) },
      { name: 'advisorlaunch-first', prep: toHeading('First case', 140) },
    ],
  },
  {
    url: local('index.html'),
    shots: [{ name: 'taxscan-home' }],
  },
  {
    url: local('demo/index.html'),
    shots: [{ name: 'taxscan-demo' }],
  },
  {
    url: local('demo/clients/C12_Reinholt_Thomas.html'),
    shots: [{ name: 'taxscan-client' }],
  },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
for (const job of jobs) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  try {
    await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 45000 });
  } catch (e) {
    console.log('load warning:', job.url, e.message);
  }
  if (job.css) await page.addStyleTag({ content: job.css });
  await sleep(2500);
  for (const shot of job.shots) {
    if (shot.prep) {
      await shot.prep(page);
      await sleep(2200);
    }
    await page.screenshot({ path: path.join(out, `${shot.name}.png`) });
    console.log('saved', shot.name);
  }
  await page.close();
}
await browser.close();
