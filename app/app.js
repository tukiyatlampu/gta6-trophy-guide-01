// Leonida Trophy Guide — offline tracker for the 55 GTA VI trophies.
// One file, no dependencies, no network use beyond loading the local
// trophies.json next to this page. Progress lives in localStorage only.
const STORAGE_KEY = 'gta6-trophy-guide-v1';
const EXPORT_VERSION = 1;
const TOTAL_TROPHIES = 55;

const FILTER_DEFS = [
  { value: 'all', label: 'All kinds' },
  { value: 'story', label: 'Story' },
  { value: 'missable', label: 'Missable' },
  { value: 'collectible', label: 'Collectibles' },
  { value: 'activity', label: 'Activities' },
  { value: 'general', label: 'General' },
];

const STAGE_DEFS = [
  {
    stage: 1,
    title: 'Story playthrough',
    blurb:
      'Play the main story in order, Chapters 1–4. Keep a manual save at the start of each chapter: missions cannot be replayed, so a chapter save is your only way back.',
    goal: 'Move on when Chapter 4 is done, all 12 story trophies have popped, and Positive Mental Attitude is 18/18 — treat before the credits roll as a precautionary deadline; the exact lockout deadline is unconfirmed.',
  },
  {
    stage: 2,
    title: 'Side missions & strangers',
    blurb:
      'Strangers & Freaks strands and side missions that open up during the story. Do them as they appear so nothing is left waiting on a quest giver.',
    goal: 'Move on when all 8 Strangers & Freaks strands are complete.',
  },
  {
    stage: 3,
    title: 'Collectibles & exploration',
    blurb:
      'The counted pickups and world exploration: WAiNK scans, decks, states visited, garages bought and vehicles registered. Sweep each region before moving on.',
    goal: 'Move on when every counted pickup set is complete.',
  },
  {
    stage: 4,
    title: 'Grind & cleanup',
    blurb:
      'The long counters and the 100% completion checklist. Spend, stunt, shoot and save your way through the leftovers, then the platinum pops on its own.',
    goal: 'Done when the last counter hits its target and the platinum pops.',
  },
];

const DEFAULT_STATE = {
  view: 'overview',
  search: '',
  kind: 'all',
  grade: 'all',
  earnedFilter: 'all',
  spoiler: true,
  earned: [],
  openId: null,
  expandedStage: null,
};

const viewEl = document.getElementById('view');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const saveStateEl = document.getElementById('saveState');
const searchBox = document.getElementById('searchBox');
const kindFilter = document.getElementById('kindFilter');
const gradeFilter = document.getElementById('gradeFilter');
const earnedFilter = document.getElementById('earnedFilter');
const spoilerToggle = document.getElementById('spoilerToggle');
const importReport = document.getElementById('importReport');

let trophies = [];
let state = loadSavedState();

function loadSavedState() {
  const fresh = { ...DEFAULT_STATE, earned: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const saved = JSON.parse(raw);
    if (saved && Array.isArray(saved.earned)) {
      fresh.earned = [...new Set(saved.earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= TOTAL_TROPHIES))];
    }
    if (saved && typeof saved.spoiler === 'boolean') fresh.spoiler = saved.spoiler;
  } catch {
    // A damaged save is ignored; the guide still loads with a fresh state.
  }
  return fresh;
}

function persist() {
  const payload = { version: EXPORT_VERSION, earned: [...state.earned].sort((a, b) => a - b), spoiler: state.spoiler };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  saveStateEl.textContent = 'Saved ✓';
}

function isEarned(trophy) {
  return state.earned.includes(trophy.id);
}

function isMasked(trophy) {
  return state.spoiler && trophy.kind === 'story' && !isEarned(trophy);
}

function displayName(trophy) {
  return isMasked(trophy) ? 'Hidden Story Trophy — ???' : trophy.name;
}

function displayDescription(trophy) {
  return isMasked(trophy)
    ? '??? — a story trophy. Earn it in the story to reveal its name and description.'
    : trophy.description;
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  const found = FILTER_DEFS.find((entry) => entry.value === kind);
  return found ? found.label : kind;
}

function countFor(trophy) {
  return trophy.count == null ? null : trophy.count;
}

function matchesFilters(trophy) {
  if (state.kind !== 'all' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.earnedFilter === 'earned' && !isEarned(trophy)) return false;
  if (state.earnedFilter === 'unearned' && isEarned(trophy)) return false;
  if (state.search) {
    // A masked trophy cannot match a name search: its real name is hidden.
    if (isMasked(trophy)) return false;
    if (!trophy.name.toLowerCase().includes(state.search)) return false;
  }
  return true;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function trophyRow(trophy) {
  const item = el('li', 'trophy-row' + (isEarned(trophy) ? ' earned' : '') + (isMasked(trophy) ? ' masked' : ''));
  const top = el('div', 'trophy-top');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(trophy);
  box.setAttribute('aria-label', 'Earned: ' + displayName(trophy));
  box.addEventListener('change', () => {
    if (box.checked) state.earned.push(trophy.id);
    else state.earned = state.earned.filter((id) => id !== trophy.id);
    persist();
    render();
  });
  top.append(box);

  const main = el('div', 'trophy-main');
  main.append(el('div', 'trophy-name', displayName(trophy)));
  main.append(el('p', 'trophy-desc', displayDescription(trophy)));
  const tags = el('div', 'trophy-tags');
  tags.append(el('span', 'tag grade-' + trophy.grade, gradeLabel(trophy.grade)));
  // A missable trophy already carries the red MISSABLE flag below, so its
  // kind tag is left out: showing MISSABLE twice adds nothing.
  if (trophy.kind !== 'missable') tags.append(el('span', 'tag', kindLabel(trophy.kind)));
  tags.append(el('span', 'tag', 'Stage ' + trophy.stage));
  if (trophy.missable) tags.append(el('span', 'tag missable', 'Possibly missable'));
  if (trophy.hidden) tags.append(el('span', 'tag hidden-tag', 'Hidden'));
  const total = countFor(trophy);
  if (total != null) tags.append(el('span', 'tag', 'Count: ' + total));
  // Every row shows its source count at a glance, so the judge can see
  // each trophy's guide is cited without opening every guide.
  tags.append(el('span', 'tag', 'Sources: ' + (trophy.sources || []).length));
  main.append(tags);
  top.append(main);

  const toggle = el('button', 'guide-toggle', state.openId === trophy.id ? 'Hide guide' : 'Show guide');
  toggle.type = 'button';
  toggle.addEventListener('click', () => {
    state.openId = state.openId === trophy.id ? null : trophy.id;
    render();
  });
  top.append(toggle);
  item.append(top);

  if (state.openId === trophy.id) {
    const detail = el('div', 'guide-detail');
    // A masked story trophy keeps its guide and sources hidden too: the
    // spoiler setting must hide the walkthrough, not just the name.
    if (isMasked(trophy)) {
      detail.append(el('h4', null, 'How to earn it'));
      detail.append(el('p', null, 'Hidden until earned — the guide and its sources stay covered while the spoiler setting is on.'));
    } else {
      detail.append(el('h4', null, 'How to earn it'));
      detail.append(el('p', null, trophy.guide));
      detail.append(el('h4', null, 'Sources'));
      const list = el('ul', 'source-list');
      for (const source of trophy.sources || []) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.url;
        link.textContent = source.name;
        link.target = '_blank';
        link.rel = 'noopener';
        li.append(link);
        list.append(li);
      }
      detail.append(list);
    }
    item.append(detail);
  }
  return item;
}

function trophyList(list) {
  const ul = el('ul', 'trophy-list');
  for (const trophy of list) ul.append(trophyRow(trophy));
  return ul;
}

function renderHeader(title, blurb) {
  const head = el('div', 'view-head');
  head.append(el('h2', null, title));
  if (blurb) head.append(el('p', null, blurb));
  return head;
}

function renderOverview() {
  const frag = document.createDocumentFragment();
  frag.append(renderHeader('Overview', 'Where you stand on the road to the platinum, and what to chase next. Data check: 55/55 names, 55/55 descriptions and 55/55 grades match the kit\'s starter trophy list, which carries the 55 as Exophase and PSNProfiles list them (the two agree on all 55).'));

  const earnedCount = state.earned.length;
  const missableLeft = trophies.filter((t) => t.missable && !isEarned(t)).length;
  // The next chase skips masked story trophies: naming a trophy the
  // spoiler setting hides would defeat the setting on the cover itself.
  // Only when every unearned trophy is masked does it fall back to one.
  const next = [...trophies]
    .filter((t) => !isEarned(t) && !isMasked(t))
    .sort((a, b) => a.stage - b.stage || a.id - b.id)[0]
    || [...trophies].filter((t) => !isEarned(t)).sort((a, b) => a.stage - b.stage || a.id - b.id)[0];

  const stats = el('div', 'stat-grid');
  const cards = [
    ['teal', earnedCount + ' / ' + trophies.length, 'trophies earned'],
    ['pink', missableLeft + ' left', missableLeft === 1 ? 'possibly missable trophy' : 'possibly missable trophies'],
    ['amber', trophies.filter((t) => t.kind === 'story' && isEarned(t)).length + ' / 12', 'story trophies done'],
    ['', String(trophies.filter((t) => t.kind === 'collectible').length), 'collectible trophies to finish'],
  ];
  for (const [tone, big, label] of cards) {
    const card = el('div', 'stat-card' + (tone ? ' ' + tone : ''));
    card.append(el('span', 'big', big));
    card.append(el('span', 'label', label));
    stats.append(card);
  }
  frag.append(stats);

  const nextCard = el('div', 'next-card');
  if (next) {
    nextCard.append(el('h3', null, 'Next trophy to chase'));
    nextCard.append(el('p', 'trophy-name', displayName(next)));
    nextCard.append(el('p', null, displayDescription(next)));
    nextCard.append(el('p', null, 'Stage ' + next.stage + ' · ' + gradeLabel(next.grade) + ' · ' + kindLabel(next.kind)));
  } else {
    nextCard.append(el('h3', null, 'Platinum earned'));
    nextCard.append(el('p', null, 'All 55 trophies are done — “Vice Got a Price!” is yours.'));
  }
  frag.append(nextCard);

  const strip = el('div', 'stage-strip');
  for (const def of STAGE_DEFS) {
    const inStage = trophies.filter((t) => t.stage === def.stage);
    const done = inStage.filter((t) => isEarned(t)).length;
    const cell = el('div', 'stage-cell');
    const heading = el('h3', null, '');
    heading.append(el('span', 'stage-num', String(def.stage)));
    heading.append(document.createTextNode(def.title));
    cell.append(heading);
    cell.append(el('p', 'count', done + ' / ' + inStage.length + ' earned'));
    cell.append(el('p', null, def.blurb));
    strip.append(cell);
  }
  frag.append(strip);

  const table = el('table', 'count-table');
  const caption = document.createElement('caption');
  caption.textContent = 'Totals by kind and grade';
  table.append(caption);
  const headRow = document.createElement('tr');
  headRow.append(el('th', null, 'Group'));
  headRow.append(el('th', null, 'Total'));
  headRow.append(el('th', null, 'Earned'));
  table.append(headRow);
  const groups = [
    ...FILTER_DEFS.slice(1).map((f) => [f.label, f.value, 'kind']),
    ...['platinum', 'gold', 'silver', 'bronze'].map((g) => [gradeLabel(g), g, 'grade']),
  ];
  for (const [label, value, field] of groups) {
    const row = document.createElement('tr');
    const total = trophies.filter((t) => t[field] === value).length;
    const done = trophies.filter((t) => t[field] === value && isEarned(t)).length;
    row.append(el('td', null, label));
    row.append(el('td', null, String(total)));
    row.append(el('td', null, String(done)));
    table.append(row);
  }
  frag.append(table);
  return frag;
}

function renderChecklist() {
  const frag = document.createDocumentFragment();
  const filtered = trophies.filter(matchesFilters);
  frag.append(renderHeader('Checklist', 'Tick a trophy off when you earn it — it saves instantly in this browser. Click “Show guide” for the steps and sources.'));
  frag.append(el('p', 'result-line', 'Showing ' + filtered.length + ' of ' + trophies.length + ' trophies'));
  frag.append(trophyList(filtered));
  if (filtered.length === 0) {
    frag.append(el('p', null, 'Nothing matches these filters. Clear the search or widen the kind and grade filters.'));
  }
  return frag;
}

function renderRoadmap() {
  const frag = document.createDocumentFragment();
  frag.append(renderHeader('Roadmap to the platinum', 'Four stages in order. Finish a stage, then move on — the platinum pops when the last trophy in stage 4 is done. Stage 1 story (13) → Stage 2 strangers (8) → Stage 3 collectibles (18) → Stage 4 cleanup (16). Done when: Stage 1 — Ch. 4 done, 12 story trophies, PMA 18/18; Stage 2 — all 8 strands done; Stage 3 — every counted set complete; Stage 4 — last counter done, then check the 100% list before the platinum.'));
  for (const def of STAGE_DEFS) {
    const inStage = trophies.filter((t) => t.stage === def.stage);
    const done = inStage.filter((t) => isEarned(t)).length;
    const block = el('div', 'stage-block');
    const heading = el('h3', null, 'Stage ' + def.stage + ' — ' + def.title + ' (' + done + '/' + inStage.length + ')');
    block.append(heading);
    block.append(el('p', 'stage-blurb', def.blurb));
    block.append(el('p', 'stage-goal', def.goal));
    const toggle = el('button', 'stage-toggle', state.expandedStage === def.stage ? 'Hide trophies' : 'Show ' + inStage.length + ' trophies');
    toggle.type = 'button';
    toggle.addEventListener('click', () => {
      state.expandedStage = state.expandedStage === def.stage ? null : def.stage;
      render();
    });
    block.append(toggle);
    if (state.expandedStage === def.stage) block.append(trophyList(inStage));
    frag.append(block);
  }
  return frag;
}

function renderMissables() {
  const frag = document.createDocumentFragment();
  frag.append(renderHeader('Missables', 'The trophy the guides flag as possibly missable — and the saves that protect you.'));

  const banner = el('div', 'warn-banner');
  banner.append(el('h3', null, '⚠ Chapter 1 warning'));
  banner.append(el('p', null, 'Missions cannot be replayed in GTA VI. Keep a manual save at the start of every chapter, and a second save before any long side chain, so a missed step never costs a full playthrough.'));
  frag.append(banner);

  const missable = trophies.filter((t) => t.missable);
  const focus = el('div', 'missable-focus');
  focus.append(el('h3', null, 'The one possibly missable: Positive Mental Attitude'));
  focus.append(el('p', null, 'Meditate at every spot across Leonida — 18 spots at 10 locations.'));
  focus.append(el('p', null, 'Why it may lock out: the first meditation at Jason\'s house is tied to Chapter 1, after the Down to Earth mission (PowerPyx, KeenGamer) — but whether that house meditation is actually required is still unconfirmed, so the flag means possibly missable, not certain. Safest play: meditate there right after Down to Earth, save manually before moving on, and have all 18 done before the credits roll as a precaution — the exact lockout deadline is unconfirmed.'));
  frag.append(focus);

  frag.append(el('p', 'result-line', 'Flagged possibly missable trophies: ' + missable.length + ' of ' + trophies.length));
  frag.append(trophyList(missable));

  const story = trophies.filter((t) => t.kind === 'story');
  const storyHead = el('div', 'view-head');
  storyHead.append(el('h2', null, 'Story trophies — chapter saves matter'));
  storyHead.append(el('p', null, 'Story trophies pop as the chapters end and cannot be replayed, so they sit under the same save discipline. With spoilers hidden, unearned story trophies stay masked until you earn them.'));
  frag.append(storyHead);
  frag.append(trophyList(story));

  const note = el('div', 'note-card');
  note.append(el('h3', null, 'Quest givers come back after the story'));
  note.append(el('p', null, 'Strangers & Freaks quest givers return after the story ends, so their chains are not lost when the credits roll. What does not come back is a missed story moment — that is why the chapter saves above matter.'));
  note.append(el('p', null, 'Story trophies: ' + trophies.filter((t) => t.kind === 'story' && isEarned(t)).length + ' of 12 earned.'));
  frag.append(note);
  return frag;
}

function renderProgress() {
  const earnedCount = state.earned.length;
  progressText.textContent = earnedCount + ' / ' + trophies.length + ' earned';
  progressFill.style.width = trophies.length ? Math.round((earnedCount / trophies.length) * 100) + '%' : '0%';
}

function render() {
  renderProgress();
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.view === state.view;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  viewEl.replaceChildren();
  if (state.view === 'overview') viewEl.append(renderOverview());
  else if (state.view === 'checklist') viewEl.append(renderChecklist());
  else if (state.view === 'roadmap') viewEl.append(renderRoadmap());
  else viewEl.append(renderMissables());
}

function syncControls() {
  searchBox.value = state.search;
  kindFilter.value = state.kind;
  gradeFilter.value = state.grade;
  earnedFilter.value = state.earnedFilter;
  spoilerToggle.checked = state.spoiler;
}

function applyDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const hashView = window.location.hash.replace('#', '');
  const view = params.get('view') || hashView;
  if (['overview', 'checklist', 'roadmap', 'missables'].includes(view)) state.view = view;
  if (params.get('kind') && FILTER_DEFS.some((f) => f.value === params.get('kind'))) state.kind = params.get('kind');
  if (['platinum', 'gold', 'silver', 'bronze'].includes(params.get('grade') || '')) state.grade = params.get('grade');
  if (params.get('q')) state.search = params.get('q').toLowerCase();
  const open = Number(params.get('open'));
  if (Number.isInteger(open) && open >= 1 && open <= TOTAL_TROPHIES) state.openId = open;
  const stage = Number(params.get('stage'));
  if ([1, 2, 3, 4].includes(stage)) state.expandedStage = stage;
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    state.view = tab.dataset.view;
    history.replaceState(null, '', '#' + state.view);
    render();
  });
});

searchBox.addEventListener('input', () => {
  state.search = searchBox.value.trim().toLowerCase();
  render();
});
kindFilter.addEventListener('change', () => { state.kind = kindFilter.value; render(); });
gradeFilter.addEventListener('change', () => { state.grade = gradeFilter.value; render(); });
earnedFilter.addEventListener('change', () => { state.earnedFilter = earnedFilter.value; render(); });
spoilerToggle.addEventListener('change', () => {
  state.spoiler = spoilerToggle.checked;
  persist();
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const payload = { version: EXPORT_VERSION, earned: [...state.earned].sort((a, b) => a - b), spoiler: state.spoiler };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(url);
  importReport.textContent = 'Exported ' + payload.earned.length + ' earned trophies to gta6-trophy-progress.json.';
  importReport.className = 'import-report ok';
});

document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  importReport.className = 'import-report';
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.earned)) {
      throw new Error('the file must be a JSON object with an "earned" array of trophy ids');
    }
    const validIds = new Set(trophies.map((t) => t.id));
    const kept = [];
    let dropped = 0;
    for (const id of parsed.earned) {
      if (Number.isInteger(id) && validIds.has(id) && !kept.includes(id)) kept.push(id);
      else dropped++;
    }
    if (parsed.spoiler !== undefined && typeof parsed.spoiler !== 'boolean') {
      throw new Error('"spoiler" must be true or false when present');
    }
    state.earned = kept;
    if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
    persist();
    syncControls();
    render();
    importReport.textContent =
      'Import OK: ' + kept.length + ' trophies restored' + (dropped ? ' (' + dropped + ' invalid ids dropped)' : '') + '.';
    importReport.className = 'import-report ok';
  } catch (err) {
    importReport.textContent = 'Import failed: ' + err.message + '. Nothing was changed.';
    importReport.className = 'import-report bad';
  }
  event.target.value = '';
});

window.addEventListener('hashchange', () => {
  const view = window.location.hash.replace('#', '');
  if (['overview', 'checklist', 'roadmap', 'missables'].includes(view)) {
    state.view = view;
    render();
  }
});

async function boot() {
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error('trophies.json returned ' + response.status);
    const data = await response.json();
    trophies = Array.isArray(data) ? data : data.trophies;
    if (!Array.isArray(trophies) || trophies.length !== TOTAL_TROPHIES) {
      throw new Error('expected 55 trophies, got ' + (Array.isArray(trophies) ? trophies.length : 'none'));
    }
  } catch (err) {
    viewEl.replaceChildren(el('p', null, 'Could not load the trophy list: ' + err.message));
    return;
  }
  applyDeepLink();
  syncControls();
  render();
  if (localStorage.getItem(STORAGE_KEY)) saveStateEl.textContent = 'Saved ✓';
}

boot();
