/**
 * 机构总表 —— 徽记、去向墙、导师任职、「工作发生的地方」都从这里取。
 * slug 对应 assets/img/logos/<slug>.svg；拿到授权素材后同名覆盖即可。
 */
module.exports = [
  /* ---------- 美国 ---------- */
  { slug: 'harvard',       mono: 'H',    en: 'Harvard University',                       zh: '哈佛大学',                 region: 'us', city: 'Cambridge, MA' },
  { slug: 'yale',          mono: 'Y',    en: 'Yale University',                          zh: '耶鲁大学',                 region: 'us', city: 'New Haven, CT' },
  { slug: 'mit',           mono: 'MIT',  en: 'Massachusetts Institute of Technology',    zh: '麻省理工学院',             region: 'us', city: 'Cambridge, MA', short: 'MIT' },
  { slug: 'princeton',     mono: 'P',    en: 'Princeton University',                     zh: '普林斯顿大学',             region: 'us', city: 'Princeton, NJ' },
  { slug: 'stanford',      mono: 'S',    en: 'Stanford University',                      zh: '斯坦福大学',               region: 'us', city: 'Stanford, CA' },
  { slug: 'berkeley',      mono: 'CAL',  en: 'University of California, Berkeley',       zh: '加州大学伯克利分校',       region: 'us', city: 'Berkeley, CA', short: 'UC Berkeley' },
  { slug: 'ucla',          mono: 'UCLA', en: 'University of California, Los Angeles',    zh: '加州大学洛杉矶分校',       region: 'us', city: 'Los Angeles, CA', short: 'UCLA' },
  { slug: 'ucsd',          mono: 'UCSD', en: 'University of California, San Diego',      zh: '加州大学圣地亚哥分校',     region: 'us', city: 'La Jolla, CA', short: 'UC San Diego' },
  { slug: 'columbia',      mono: 'CU',   en: 'Columbia University',                      zh: '哥伦比亚大学',             region: 'us', city: 'New York, NY' },
  { slug: 'cornell',       mono: 'CN',   en: 'Cornell University',                       zh: '康奈尔大学',               region: 'us', city: 'Ithaca, NY' },
  { slug: 'upenn',         mono: 'UP',   en: 'University of Pennsylvania',               zh: '宾夕法尼亚大学',           region: 'us', city: 'Philadelphia, PA', short: 'UPenn' },
  { slug: 'johns-hopkins', mono: 'JHU',  en: 'Johns Hopkins University',                 zh: '约翰霍普金斯大学',         region: 'us', city: 'Baltimore, MD', short: 'Johns Hopkins' },
  { slug: 'chicago',       mono: 'UC',   en: 'University of Chicago',                    zh: '芝加哥大学',               region: 'us', city: 'Chicago, IL' },
  { slug: 'duke',          mono: 'D',    en: 'Duke University',                          zh: '杜克大学',                 region: 'us', city: 'Durham, NC' },
  { slug: 'northwestern',  mono: 'NU',   en: 'Northwestern University',                  zh: '西北大学',                 region: 'us', city: 'Evanston, IL' },
  { slug: 'cmu',           mono: 'CMU',  en: 'Carnegie Mellon University',               zh: '卡内基梅隆大学',           region: 'us', city: 'Pittsburgh, PA', short: 'Carnegie Mellon' },
  { slug: 'michigan',      mono: 'M',    en: 'University of Michigan',                   zh: '密歇根大学',               region: 'us', city: 'Ann Arbor, MI' },
  { slug: 'nyu',           mono: 'NYU',  en: 'New York University',                      zh: '纽约大学',                 region: 'us', city: 'New York, NY', short: 'NYU' },
  { slug: 'brown',         mono: 'B',    en: 'Brown University',                         zh: '布朗大学',                 region: 'us', city: 'Providence, RI' },
  { slug: 'rice',          mono: 'R',    en: 'Rice University',                          zh: '莱斯大学',                 region: 'us', city: 'Houston, TX' },
  { slug: 'vanderbilt',    mono: 'V',    en: 'Vanderbilt University',                    zh: '范德堡大学',               region: 'us', city: 'Nashville, TN' },
  { slug: 'emory',         mono: 'EU',   en: 'Emory University',                         zh: '埃默里大学',               region: 'us', city: 'Atlanta, GA' },
  { slug: 'georgia-tech',  mono: 'GT',   en: 'Georgia Institute of Technology',          zh: '佐治亚理工学院',           region: 'us', city: 'Atlanta, GA', short: 'Georgia Tech' },
  { slug: 'usc',           mono: 'USC',  en: 'University of Southern California',        zh: '南加州大学',               region: 'us', city: 'Los Angeles, CA', short: 'USC' },
  { slug: 'washington',    mono: 'UW',   en: 'University of Washington',                 zh: '华盛顿大学',               region: 'us', city: 'Seattle, WA' },
  { slug: 'ut-austin',     mono: 'UT',   en: 'University of Texas at Austin',            zh: '德克萨斯大学奥斯汀分校',   region: 'us', city: 'Austin, TX', short: 'UT Austin' },
  { slug: 'wisconsin',     mono: 'W',    en: 'University of Wisconsin–Madison',          zh: '威斯康星大学麦迪逊分校',   region: 'us', city: 'Madison, WI', short: 'UW–Madison' },
  { slug: 'illinois',      mono: 'I',    en: 'University of Illinois Urbana-Champaign',  zh: '伊利诺伊大学厄巴纳-香槟分校', region: 'us', city: 'Urbana, IL', short: 'UIUC' },
  { slug: 'unc',           mono: 'UNC',  en: 'University of North Carolina at Chapel Hill', zh: '北卡罗来纳大学教堂山分校', region: 'us', city: 'Chapel Hill, NC', short: 'UNC Chapel Hill' },
  { slug: 'purdue',        mono: 'PU',   en: 'Purdue University',                        zh: '普渡大学',                 region: 'us', city: 'West Lafayette, IN' },
  { slug: 'boston-u',      mono: 'BU',   en: 'Boston University',                        zh: '波士顿大学',               region: 'us', city: 'Boston, MA' },
  { slug: 'florida',       mono: 'UF',   en: 'University of Florida',                    zh: '佛罗里达大学',             region: 'us', city: 'Gainesville, FL' },
  { slug: 'buffalo',       mono: 'UB',   en: 'University at Buffalo',                    zh: '布法罗大学',               region: 'us', city: 'Buffalo, NY' },
  { slug: 'george-mason',  mono: 'GMU',  en: 'George Mason University',                  zh: '乔治梅森大学',             region: 'us', city: 'Fairfax, VA' },
  { slug: 'georgia-state', mono: 'GSU',  en: 'Georgia State University',                 zh: '佐治亚州立大学',           region: 'us', city: 'Atlanta, GA' },

  /* ---------- 加拿大 ---------- */
  { slug: 'toronto',       mono: 'UT',   en: 'University of Toronto',                    zh: '多伦多大学',               region: 'ca', city: 'Toronto' },
  { slug: 'ubc',           mono: 'UBC',  en: 'University of British Columbia',           zh: '英属哥伦比亚大学',         region: 'ca', city: 'Vancouver', short: 'UBC' },
  { slug: 'mcgill',        mono: 'McG',  en: 'McGill University',                        zh: '麦吉尔大学',               region: 'ca', city: 'Montreal' },

  /* ---------- 英国 ---------- */
  { slug: 'oxford',        mono: 'OX',   en: 'University of Oxford',                     zh: '牛津大学',                 region: 'uk', city: 'Oxford' },
  { slug: 'cambridge',     mono: 'CAM',  en: 'University of Cambridge',                  zh: '剑桥大学',                 region: 'uk', city: 'Cambridge' },
  { slug: 'imperial',      mono: 'ICL',  en: 'Imperial College London',                  zh: '帝国理工学院',             region: 'uk', city: 'London', short: 'Imperial' },
  { slug: 'ucl',           mono: 'UCL',  en: 'University College London',                zh: '伦敦大学学院',             region: 'uk', city: 'London', short: 'UCL' },
  { slug: 'edinburgh',     mono: 'ED',   en: 'University of Edinburgh',                  zh: '爱丁堡大学',               region: 'uk', city: 'Edinburgh' },
  { slug: 'lse',           mono: 'LSE',  en: 'London School of Economics',               zh: '伦敦政治经济学院',         region: 'uk', city: 'London', short: 'LSE' },

  /* ---------- 欧洲大陆 ---------- */
  { slug: 'eth',           mono: 'ETH',  en: 'ETH Zurich',                               zh: '苏黎世联邦理工学院',       region: 'eu', city: 'Zurich' },
  { slug: 'epfl',          mono: 'EPFL', en: 'EPFL',                                     zh: '洛桑联邦理工学院',         region: 'eu', city: 'Lausanne' },
  { slug: 'tu-delft',      mono: 'TUD',  en: 'Delft University of Technology',           zh: '代尔夫特理工大学',         region: 'eu', city: 'Delft', short: 'TU Delft' },

  /* ---------- 中国香港 ---------- */
  { slug: 'hku',           mono: 'HKU',  en: 'The University of Hong Kong',              zh: '香港大学',                 region: 'hk', city: 'Hong Kong', short: 'HKU' },
  { slug: 'cuhk',          mono: 'CUHK', en: 'The Chinese University of Hong Kong',      zh: '香港中文大学',             region: 'hk', city: 'Hong Kong', short: 'CUHK' },
  { slug: 'hkust',         mono: 'HKUST',en: 'The Hong Kong University of Science and Technology', zh: '香港科技大学',   region: 'hk', city: 'Hong Kong', short: 'HKUST' },
  { slug: 'polyu',         mono: 'PolyU',en: 'The Hong Kong Polytechnic University',     zh: '香港理工大学',             region: 'hk', city: 'Hong Kong', short: 'PolyU' },
  { slug: 'cityu',         mono: 'CityU',en: 'City University of Hong Kong',             zh: '香港城市大学',             region: 'hk', city: 'Hong Kong', short: 'CityU' },

  /* ---------- 新加坡 ---------- */
  { slug: 'nus',           mono: 'NUS',  en: 'National University of Singapore',         zh: '新加坡国立大学',           region: 'sg', city: 'Singapore', short: 'NUS' },
  { slug: 'ntu',           mono: 'NTU',  en: 'Nanyang Technological University',         zh: '南洋理工大学',             region: 'sg', city: 'Singapore', short: 'NTU' },

  /* ---------- 澳大利亚 / 东亚 ---------- */
  { slug: 'melbourne',     mono: 'UoM',  en: 'University of Melbourne',                  zh: '墨尔本大学',               region: 'au', city: 'Melbourne' },
  { slug: 'sydney',        mono: 'USYD', en: 'University of Sydney',                     zh: '悉尼大学',                 region: 'au', city: 'Sydney' },
  { slug: 'anu',           mono: 'ANU',  en: 'Australian National University',           zh: '澳大利亚国立大学',         region: 'au', city: 'Canberra', short: 'ANU' },
  { slug: 'tokyo',         mono: 'UT',   en: 'The University of Tokyo',                  zh: '东京大学',                 region: 'jp', city: 'Tokyo' },
  { slug: 'kaist',         mono: 'KAIST',en: 'KAIST',                                    zh: '韩国科学技术院',           region: 'kr', city: 'Daejeon' },
];

module.exports.regions = {
  us: { zh: '美国', en: 'United States' },
  ca: { zh: '加拿大', en: 'Canada' },
  uk: { zh: '英国', en: 'United Kingdom' },
  eu: { zh: '欧洲大陆', en: 'Continental Europe' },
  hk: { zh: '中国香港', en: 'Hong Kong SAR' },
  sg: { zh: '新加坡', en: 'Singapore' },
  au: { zh: '澳大利亚', en: 'Australia' },
  jp: { zh: '日本', en: 'Japan' },
  kr: { zh: '韩国', en: 'South Korea' },
};
