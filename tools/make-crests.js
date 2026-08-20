/**
 * 生成统一风格的院校徽记占位 SVG（assets/img/logos/*.svg）
 *
 * 说明：真实校徽为各校注册商标，需获授权后使用。
 * 拿到授权素材后，用同名文件直接覆盖即可，无需改动任何 HTML。
 *
 *   node tools/make-crests.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'img', 'logos');
fs.mkdirSync(OUT, { recursive: true });

const INK = '#12203A';

/* ---------- 外框：六种学院徽记轮廓 ---------- */
const frames = {
  shield: `<path d="M48 9 L83 21 V49c0 19-15 31-35 38C28 80 13 68 13 49V21Z"/>`,
  roundel: `<circle cx="48" cy="48" r="39"/><circle cx="48" cy="48" r="33.5" stroke-opacity=".45"/>`,
  arch: `<path d="M13 87V40a35 35 0 0 1 70 0v47Z"/>`,
  hexagon: `<path d="M48 8 84 28v40L48 88 12 68V28Z"/>`,
  octagon: `<path d="M32 9h32l23 23v32L64 87H32L9 64V32Z"/>`,
  tablet: `<path d="M20 9h56a11 11 0 0 1 11 11v56a11 11 0 0 1-11 11H20A11 11 0 0 1 9 76V20A11 11 0 0 1 20 9Z"/>`,
};

/* ---------- 下方小纹章 ---------- */
const star = (x, y, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.44 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(x + rad * Math.cos(a)).toFixed(2)},${(y + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="currentColor" stroke="none"/>`;
};

const ornaments = {
  stars: `${star(38, 68, 3.4)}${star(48, 68, 3.4)}${star(58, 68, 3.4)}`,
  laurel: `<path d="M40 71c-5-1.5-8-5-8.5-9.5 4.5.5 8 3 9.5 7.5M56 71c5-1.5 8-5 8.5-9.5-4.5.5-8 3-9.5 7.5M48 73v-9" stroke-linecap="round"/>`,
  diamond: `<path d="M48 62.5 53.5 68 48 73.5 42.5 68Z"/><path d="M36 68h-6M66 68h-6" stroke-linecap="round"/>`,
  dots: `<circle cx="40" cy="68" r="2.1" fill="currentColor" stroke="none"/><circle cx="48" cy="68" r="2.1" fill="currentColor" stroke="none"/><circle cx="56" cy="68" r="2.1" fill="currentColor" stroke="none"/>`,
  book: `<path d="M48 65.5c-3-2.5-7-3.5-11-3v9c4-.5 8 .5 11 3 3-2.5 7-3.5 11-3v-9c-4-.5-8 .5-11 3Z"/><path d="M48 65.5V74.5"/>`,
  compass: `<path d="M48 61 41 74M48 61l7 13M43.6 70.5h8.8" stroke-linecap="round"/>`,
};

const frameKeys = Object.keys(frames);
const ornKeys = Object.keys(ornaments);

function crest(monogram, i) {
  const frame = frames[frameKeys[i % frameKeys.length]];
  const orn = ornaments[ornKeys[i % ornKeys.length]];
  const size = monogram.length >= 5 ? 15 : monogram.length >= 4 ? 17 : monogram.length >= 3 ? 20 : 27;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="${monogram}">
  <g fill="none" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round" color="${INK}">
    ${frame}
    <path d="M30 54.5h36" stroke-opacity=".55"/>
    ${orn}
  </g>
  <text x="48" y="45" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia, 'Times New Roman', 'Songti SC', serif"
        font-size="${size}" letter-spacing="${monogram.length > 2 ? 0.5 : 1.5}"
        fill="${INK}">${monogram}</text>
</svg>
`;
}

const schools = [
  ['harvard', 'H'], ['yale', 'Y'], ['mit', 'MIT'], ['princeton', 'P'],
  ['stanford', 'S'], ['columbia', 'CU'], ['berkeley', 'CAL'], ['cornell', 'CN'],
  ['johns-hopkins', 'JHU'], ['emory', 'EU'], ['usc', 'USC'], ['florida', 'UF'],
  ['hku', 'HKU'], ['cuhk', 'CUHK'], ['hkust', 'HKUST'], ['polyu', 'PolyU'],
  ['cityu', 'CityU'], ['nus', 'NUS'], ['ntu', 'NTU'],
  ['washington', 'UW'], ['buffalo', 'UB'], ['george-mason', 'GMU'],
];

schools.forEach(([slug, mono], i) => {
  fs.writeFileSync(path.join(OUT, `${slug}.svg`), crest(mono, i), 'utf8');
});

console.log(`已生成 ${schools.length} 个徽记 → assets/img/logos/`);
