const fs = require('node:fs');
const path = require('node:path');
require('./scripts/sync-icon-purposes.cjs');
require('./scripts/package-icon-library.cjs');
const iconPurposes = require('./public/healing/custom-icons/icon-purposes.json');

const classes = [
  ['Warrior', '#C79C6E'], ['Paladin', '#F58CBA'], ['Hunter', '#ABD473'],
  ['Rogue', '#FFF569'], ['Priest', '#FFFFFF'], ['Shaman', '#0070DE'],
  ['Mage', '#69CCF0'], ['Warlock', '#9482C9'], ['Druid', '#FF7D0A']
];

const output = path.join(__dirname, 'dist');
fs.cpSync(path.join(__dirname, 'public'), output, {recursive: true});

function classButton(depth, slug, label, color, href, active, spec, spellIcon, healer) {
  const badge = spellIcon ? `<img class="class-spec-icon" src="${depth}healing/icons/${spellIcon}.jpg" alt="" width="18" height="18">` : '';
  const classMarker = healer ? ` data-healbot-class="${healer}"` : '';
  const marker = spec ? ` data-healbot-spec="${spec}"` : '';
  return `<a class="class-pick" href="${depth}${href}" style="--class-color:${color}"${classMarker}${marker}${active ? ' aria-current="page"' : ''}><span class="class-art"><img src="${depth}assets/${slug}.jpg" alt="" width="40" height="40">${badge}</span><span>${label}</span></a>`;
}

function page(title, depth, current, content) {
  const links = classes.map(([name, color]) => {
    const slug = name.toLowerCase();
    return classButton(depth, slug, name, color, slug + '/', current === slug);
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="Class calculators and simulations for World of Warcraft: Forever.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya&family=Alegreya+Sans:wght@400;700&family=Metamorphous&display=swap">
<link rel="stylesheet" href="${depth}assets/theme.css">
</head>
<body>
<header class="site-header"><div class="container">
<a class="brand" href="${depth}"><span class="sigil" aria-hidden="true">∞</span><span>WoW Forever Sims<small>Class tools for World of Warcraft: Forever</small></span></a>
<nav aria-label="Main navigation"><a class="nav-link" href="${depth}">Class sims</a> <a class="nav-link" href="${depth}healbot/">Healbot</a> <a class="nav-link" href="${depth}icons/">Icon library</a></nav>
</div></header>
<main class="container">
<section class="hero">
<img class="hero-art" src="${depth}assets/horde.webp" alt="">
<img class="hero-logo" src="${depth}assets/forever.webp" alt="World of Warcraft: Forever" width="190" height="155">
<div><h1>${title}</h1><p>${title === 'Icon library' ? 'Browse original artwork and your custom spell and equipment collections.' : current ? 'Calculators and simulations for World of Warcraft: Forever.' : 'Pick a class to explore its calculators and simulations. Compare weapons, test ability tradeoffs, and see how your choices change the numbers.'}</p></div>
</section>
<nav class="class-picker" aria-label="Choose a class">${links}</nav>
${content}
</main>
<footer class="container">Unofficial fan site for World of Warcraft: Forever. World of Warcraft artwork and class icons belong to Blizzard Entertainment.</footer>
</body>
</html>`;
}

const cleave = fs.readFileSync(path.join(__dirname, 'sims', 'cleave.html'), 'utf8');
const healing = fs.readFileSync(path.join(__dirname, 'sims', 'healing.html'), 'utf8').replace(/<img data-purpose-icon="([^"]+)"[^>]*>/g, (tag,key) => {
  const entry = iconPurposes.rows.find(row => row.key === key);
  if (!entry) throw new Error('Unknown template icon purpose: ' + key);
  return tag.replace(/src="[^"]*"/, 'src="../healing/' + entry.current.path + '"');
});
const healers = ['shaman', 'druid', 'paladin', 'priest'];

function healbotPath(slug) {
  return slug === 'shaman' ? 'healbot/' : `healbot/${slug}/`;
}

function healbotPage(slug, content, depth) {
  const links = classes.filter(([name]) => healers.includes(name.toLowerCase())).flatMap(([name, color]) => {
    const key = name.toLowerCase();
    const href = healbotPath(key);
    if (key !== 'priest') return classButton(depth, key, name, color, href, key === slug, null, null, key);
    return [
      classButton(depth, key, 'Discipline', color, href + '?spec=discipline', key === slug, 'discipline', 'spell_holy_penance', key),
      classButton(depth, key, 'Holy', color, href + '?spec=holy', false, 'holy', 'spell_holy_prayerofmendingtga', key)
    ];
  }).join('\n');
  const current = classes.find(([name]) => name.toLowerCase() === slug)[0];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Healbot · ${current}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya&family=Alegreya+Sans:wght@400;700&family=Metamorphous&display=swap">
<link rel="stylesheet" href="${depth}assets/theme.css">
</head>
<body class="healbot-page" data-healer="${slug}">
<header class="healbot-header">
  <div class="healbot-brand"><a class="healbot-home sigil" href="${depth}" aria-label="Main menu" title="Main menu"><span aria-hidden="true">∞</span></a><h1>Healbot</h1></div>
  <nav class="class-picker" aria-label="Healer class">${links}</nav>
</header>
<main>${content.replaceAll('="../', '="' + depth).replace('class="panel healing"', 'class="healing"').replace('  <h2>Healing practice</h2>', '')}</main>
</body>
</html>`;
}

for (const slug of healers) {
  const directory = path.join(output, healbotPath(slug));
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, 'index.html'), healbotPage(slug, healing, slug === 'shaman' ? '../' : '../../'));
}

fs.writeFileSync(path.join(output, 'index.html'), page('WoW Forever Sims', './', '', '<section class="panel"><h2>Available now</h2><p><a href="./warrior/#cleave-efficiency">Warrior · Cleave rage efficiency</a></p><p><a href="./healbot/">Shaman · Healing practice</a></p><p><a href="./healbot/druid/">Druid · Healing practice</a></p><p><a href="./healbot/paladin/">Paladin · Healing practice</a></p><p><a href="./healbot/priest/">Priest · Healing practice</a></p></section>'));
for (const [name] of classes) {
  const slug = name.toLowerCase();
  const directory = path.join(output, slug);
  fs.mkdirSync(directory, {recursive: true});
  if (healers.includes(slug)) {
    const destination = '../' + healbotPath(slug);
    fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Healbot</title><meta http-equiv="refresh" content="0;url=${destination}"></head><body><a href="${destination}">Open Healbot</a></body></html>`);
    continue;
  }
  const content = slug === 'warrior' ? cleave : `<section class="panel"><h2>${name} calculators</h2><p>Coming soon.</p></section>`;
  fs.writeFileSync(path.join(directory, 'index.html'), page(`${name} Sims`, '../', slug, content));
}

// Read the existing reviewed catalogs; do not duplicate or remap game icons.
const escapeHtml = text => String(text).replace(/[&<>"']/g, character =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const originalIcons = fs.readdirSync(path.join(__dirname, 'public/healing/icons'))
  .filter(name => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)).sort()
  .map(name => ({name, id:name, path:'icons/' + name, tags:[]}));
const customCatalog = require('./public/healing/custom-icons/catalog.json');
const iconSections = [
  {id:'original', title:'Bundled original icons', icons:originalIcons, description:'The original World of Warcraft spell, ability, and item icons included with Healbot.'},
  {id:'spells', title:'New spell, healing & mana icons', icons:customCatalog.icons.filter(icon => icon.category === 'spells'), description:'Your custom spell, healing, mana, and combat-effect artwork.', library:'../healing/custom-icons/'},
  {id:'equipment', title:'New equipment icons', icons:customCatalog.icons.filter(icon => icon.category === 'equipment'), description:'Your custom weapons, armor, relics, and accessories.', library:'../healing/custom-icons/equipment/'}
];
let iconCount = 0;
const iconGroups = iconSections.map(section => {
  iconCount += section.icons.length;
  const cards = section.icons.map(icon => {
    const localPath = section.id === 'original' ? icon.path : 'custom-icons/' + icon.path;
    const url = '../healing/' + localPath.split('/').map(encodeURIComponent).join('/');
    const search = [icon.name, icon.id, icon.path, icon.set, icon.equipmentType, ...icon.tags].filter(Boolean).join(' ').toLowerCase();
    return `<a class="icon-card" href="${url}" data-name="${escapeHtml(search)}"><img src="${url}" alt="" width="56" height="56" loading="lazy"><span>${escapeHtml(icon.name)}</span><small>${escapeHtml(icon.id)}</small></a>`;
  }).join('\n');
  const downloads = section.library ? `<p><a href="${section.library}">Browse sets, contact sheets &amp; downloads</a></p>` : '';
  return `<section class="icon-section" id="${section.id}" aria-labelledby="${section.id}-title"><h2 id="${section.id}-title">${escapeHtml(section.title)}</h2><p>${section.description}</p>${downloads}<p data-section-count>${section.icons.length} icons</p><p data-section-empty hidden>No matching icons in this library.</p><div class="icon-grid">${cards}</div></section>`;
}).join('\n');
const iconTemplate = fs.readFileSync(path.join(__dirname, 'sims/icons.html'), 'utf8');
fs.mkdirSync(path.join(output, 'icons'), {recursive:true});
fs.writeFileSync(path.join(output, 'icons/index.html'), page('Icon library', '../', '',
  iconTemplate.replace('<!-- ICONS -->', iconGroups).replaceAll('{{COUNT}}', String(iconCount))));

// Pages opts in through its build environment; ordinary/Sites builds stay untagged.
require('./scripts/google-tag-manager.cjs').installGoogleTagManager(output, process.env.GOOGLE_TAG_MANAGER_ID || '');
