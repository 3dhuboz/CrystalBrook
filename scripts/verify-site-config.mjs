import { readFileSync } from 'node:fs';

const expectedMeasurementId = 'G-QNF1LQEJNL';
const retiredMeasurementId = 'G-3QYH8PSQR5';
const analyticsFiles = [
  '404.html',
  'about.html',
  'index.html',
  'order.html',
  'policies.html',
  'product.html',
  'shop.html',
  'admin/index.html',
  'assets/admin.js',
];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const wrangler = readFileSync('wrangler.toml', 'utf8');
const worker = readFileSync('src/index.js', 'utf8');
check(
  /html_handling\s*=\s*["']auto-trailing-slash["']/.test(wrangler),
  'Cloudflare HTML handling must map the site root to index.html',
);
check(
  !/html_handling\s*=\s*["']none["']/.test(wrangler),
  'Cloudflare HTML handling must not be disabled',
);
check(
  !/path\s*===\s*['"]\/['"][\s\S]{0,500}assetUrl\.pathname\s*=\s*['"]\/index\.html['"]/.test(worker),
  'The Worker must not rewrite / to /index.html when automatic HTML routing is enabled',
);

for (const file of analyticsFiles) {
  const source = readFileSync(file, 'utf8');
  check(!source.includes(retiredMeasurementId), `${file} still references the retired Analytics ID`);
}

for (const file of analyticsFiles.filter((file) => file.endsWith('.html') && file !== 'admin/index.html')) {
  const source = readFileSync(file, 'utf8');
  check(
    source.includes(`gtag/js?id=${expectedMeasurementId}`),
    `${file} does not load the requested Analytics tag`,
  );
  check(
    source.includes(`gtag('config', '${expectedMeasurementId}')`),
    `${file} does not configure the requested Analytics property`,
  );
}

const homepage = readFileSync('index.html', 'utf8');
for (const placeholder of [
  'Placeholder reviews',
  'Real review will go here',
  'first pieces ship',
  'tm-placeholder',
  'data-content-key="home_stories_note"',
]) {
  check(!homepage.includes(placeholder), `Homepage still exposes placeholder review content: ${placeholder}`);
}

check(
  homepage.includes('<section class="stories" id="stories">'),
  'Homepage is missing the Stories from the wall section',
);

for (const contentKey of [
  'home_stories_eyebrow',
  'home_stories_h2',
  'home_stories_q1',
  'home_stories_q1_attribution',
  'home_stories_q2',
  'home_stories_q2_attribution',
  'home_stories_q3',
  'home_stories_q3_attribution',
]) {
  check(
    homepage.includes(`data-content-key="${contentKey}"`),
    `Homepage is missing customer story content key: ${contentKey}`,
  );
}

if (failures.length) {
  console.error(`Site verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Site verification passed: root routing, customer stories, and Analytics configuration are correct.');
