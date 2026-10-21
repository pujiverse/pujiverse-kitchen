/* Pujiverse Kitchen — tiny client-side app (no build step).
   Routes (hash-based, so it works on GitHub Pages or any folder):
            #/                          countries of the world
            #/:country                  regional cuisines of a country
            #/:country/:cuisine         dishes of a cuisine
            #/:country/:cuisine/:dish   recipe page
            #/search?q=...              search all dishes
   Old India links (#/:cuisine and #/:cuisine/:dish) still work.            */

const app = document.getElementById('app');
const cache = {};          // country id -> data
let countries = [];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dietCls = d => d.startsWith('Veg') ? 'v' : d.startsWith('Non') ? 'n' : 'e';
const dietLbl = d => d.startsWith('Veg') ? 'Veg' : d.startsWith('Non') ? 'Non-veg' : 'Egg';
const mins = m => m >= 2160 ? `${Math.round(m/1440)} days (mostly waiting)` : m >= 360 ? 'Overnight (mostly waiting)' : m >= 60 ? `${Math.floor(m/60)} h${m%60 ? ' ' + m%60 + ' min' : ''}` : `${m} min`;

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
  return r.json();
}
async function loadCountry(id) {
  if (cache[id]) return cache[id];
  const c = countries.find(x => x.id === id);
  if (!c) return null;
  const data = await getJSON(c.file);
  data.byCuisine = {};
  for (const d of data.dishes) (data.byCuisine[d.cuisine_id] ||= []).push(d);
  data.byId = Object.fromEntries(data.dishes.map(d => [d.id, d]));
  return (cache[id] = data);
}

function setTitle(t) { document.title = t ? `${t} · Pujiverse Kitchen` : 'Pujiverse Kitchen'; }

function picture(d, cls = 'thumb', lazy = true) {
  const im = d.image;
  if (im && im.url) return `<img class="${cls}" src="${esc(im.url)}" alt="${esc(d.name)}"${lazy ? ' loading="lazy"' : ''}>`;
  return `<div class="ph">Photo coming soon</div>`;
}

const isCountry = id => countries.some(c => c.id === id);
const cname = id => (countries.find(c => c.id === id) || {}).name || id;
const fmt = n => Number(n).toLocaleString();

function dishCard(country, d, showCuisine = false) {
  return `<a class="card" href="#/${country}/${d.cuisine_id}/${d.id}" data-link>
    ${picture(d)}
    <div class="body">
      <div class="name">${esc(d.name)}</div>
      ${showCuisine ? `<div class="sub">${esc(d.cuisine)}</div>` : ''}
      <div class="tags"><span class="tag">${esc(d.course)}</span><span class="tag diet ${dietCls(d.diet)}"><i></i>${dietLbl(d.diet)}</span></div>
      ${d.recipe ? '' : '<div class="soon">Recipe coming soon</div>'}
    </div></a>`;
}

/* ---------- pages ---------- */
async function pageHome() {
  setTitle('');
  const sum = k => countries.reduce((a, c) => a + (c[k] || 0), 0);
  const conts = [...new Set(countries.map(c => c.continent))].sort();
  app.innerHTML = `<p class="eyebrow">World cuisines · region by region</p>
    <h1>What does the world cook?</h1>
    <p class="lede">Pick a country to see its regional cuisines, every dish we've catalogued, and step-by-step recipes. More countries are added every week.</p>
    <div class="stats"><div><b>${countries.length}</b>countries</div><div><b>${fmt(sum('cuisines'))}</b>regional cuisines</div>
      <div><b>${fmt(sum('dishes'))}</b>dishes</div><div><b>${fmt(sum('recipes'))}</b>full recipes</div></div>
    ${conts.map(ct => `<div class="region"><p class="eyebrow">${esc(ct)}</p><div class="cuisines">
      ${countries.filter(c => c.continent === ct).map(c => `<a class="cuisine country" href="#/${c.id}" data-link>
        <span class="flag" aria-hidden="true">${c.flag || ''}</span>
        <span class="grow"><strong>${esc(c.name)}</strong><small>${c.cuisines} cuisines · ${fmt(c.recipes)} recipes</small></span>
        <span class="n">${fmt(c.dishes)}</span></a>`).join('')}</div></div>`).join('')}`;
}

async function pageCountry(cid) {
  const data = await loadCountry(cid);
  if (!data) return pageNotFound();
  const name = cname(cid);
  const recipes = data.dishes.filter(d => d.recipe).length;
  setTitle(`${name} cuisines`);
  app.innerHTML = `<nav class="crumbs"><a href="#/" data-link>World</a> / <span>${esc(name)}</span></nav>
    <p class="eyebrow">${esc(name)} · region by region</p>
    <h1>What does ${esc(name)} cook?</h1>
    <p class="lede">Browse ${esc(name)}'s regional cuisines, see every dish we've catalogued, and open a dish for its ingredients and step-by-step method.</p>
    <div class="stats"><div><b>${data.cuisines.length}</b>regional cuisines</div><div><b>${fmt(data.dishes.length)}</b>dishes</div><div><b>${fmt(recipes)}</b>full recipes</div></div>
    ${cuisineGroups(cid, data)}`;
}

function cuisineGroups(country, data) {
  const regions = [...new Set(data.cuisines.map(c => c.region))];
  return regions.map(r => `<div class="region"><p class="eyebrow">${esc(r)}</p><div class="cuisines">
    ${data.cuisines.filter(c => c.region === r).map(c => {
      const rec = (data.byCuisine[c.id] || []).filter(d => d.recipe).length;
      return `<a class="cuisine" href="#/${country}/${c.id}" data-link><span><strong>${esc(c.name)}</strong>
        <small>${esc(c.states.join(', '))}</small>${rec ? `<br><span class="badge">${rec} recipes</span>` : ''}</span>
        <span class="n">${c.dish_count}</span></a>`;
    }).join('')}</div></div>`).join('');
}

async function pageCuisine(cid, cuId) {
  const data = await loadCountry(cid);
  const cu = data && data.cuisines.find(c => c.id === cuId);
  if (!cu) return pageNotFound();
  const countryName = countries.find(x => x.id === cid).name;
  setTitle(`${cu.name} dishes`);
  const dishes = data.byCuisine[cuId] || [];
  const courses = ['All', ...new Set(dishes.map(d => d.course))];
  const diets = ['All', 'Veg', 'Non-veg', 'Egg'];
  let course = 'All', diet = 'All';
  app.innerHTML = `<nav class="crumbs"><a href="#/" data-link>World</a> / <a href="#/${cid}" data-link>${esc(countryName)}</a> / <span>${esc(cu.name)}</span></nav>
    <p class="eyebrow">${esc(cu.states.join(', '))}</p>
    <h1>${esc(cu.name)}</h1>
    <p class="lede">${dishes.length} dishes · ${dishes.filter(d => d.recipe).length} with full recipes</p>
    <div class="filters" id="fc">${courses.map(c => `<button class="chip" data-c="${esc(c)}" aria-pressed="${c === 'All'}">${esc(c)}</button>`).join('')}</div>
    <div class="filters" id="fd">${diets.map(c => `<button class="chip" data-d="${c}" aria-pressed="${c === 'All'}">${c}</button>`).join('')}</div>
    <div class="grid" id="grid"></div>`;
  const draw = () => {
    const shown = dishes.filter(d => (course === 'All' || d.course === course) && (diet === 'All' || dietLbl(d.diet) === diet));
    document.getElementById('grid').innerHTML = shown.map(d => dishCard(cid, d)).join('') || '<div class="empty">No dishes match these filters.</div>';
  };
  document.getElementById('fc').onclick = e => { const b = e.target.closest('button'); if (!b) return; course = b.dataset.c;
    document.querySelectorAll('#fc .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); };
  document.getElementById('fd').onclick = e => { const b = e.target.closest('button'); if (!b) return; diet = b.dataset.d;
    document.querySelectorAll('#fd .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); };
  draw();
}

async function pageDish(cid, cuId, dishId) {
  const data = await loadCountry(cid);
  const d = data && data.byId[dishId];
  if (!d) return pageNotFound();
  const countryName = countries.find(x => x.id === cid).name;
  setTitle(d.name);
  const im = d.image, r = d.recipe;
  let credit = '';
  if (im && im.ai_generated) credit = `<span class="ai-badge">AI-generated image</span>Not a photograph of the actual dish.`;
  else if (im) credit = `Photo: ${esc(im.author)} · <a href="${esc(im.page)}" target="_blank" rel="noopener">${esc(im.license)}</a>, via Wikimedia Commons`;
  app.innerHTML = `<nav class="crumbs"><a href="#/" data-link>World</a> / <a href="#/${cid}" data-link>${esc(countryName)}</a> /
      <a href="#/${cid}/${d.cuisine_id}" data-link>${esc(d.cuisine)}</a> / <span>${esc(d.name)}</span></nav>
    <div class="hero">
      <div>${picture(d, 'hero-img', false)}<div class="credit">${credit}</div></div>
      <div>
        <p class="eyebrow">${esc(d.cuisine)} · ${esc(d.states.join(', ') !== d.cuisine ? d.states.join(', ') : countryName)}</p>
        <h1>${esc(d.name)}</h1>
        <div class="tags"><span class="tag">${esc(d.course)}</span><span class="tag diet ${dietCls(d.diet)}"><i></i>${esc(d.diet)}</span></div>
        ${r ? `<div class="facts"><div><span>Serves</span>${r.serves}</div><div><span>Prep</span>${mins(r.prep_minutes)}</div>
          <div><span>Cook</span>${mins(r.cook_minutes)}</div><div><span>Ingredients</span>${r.ingredients.length}</div></div>` : ''}
      </div>
    </div>
    ${r ? `<div class="cols">
        <div><h3>Ingredients</h3><ul class="ing">${r.ingredients.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
        <div><h3>Method</h3><ol class="steps">${r.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>
      </div>
      <p class="disclaim">${esc(r.source)}. Quantities are a starting point; adjust spice and salt to taste.</p>`
      : `<p class="empty" style="margin-top:28px">The full recipe for ${esc(d.name)} is coming soon.</p>`}`;
  window.scrollTo(0, 0);
}

let searchIndex = null;
async function pageSearch(q) {
  setTitle(`Search: ${q}`);
  document.getElementById('q').value = q;
  const term = q.trim().toLowerCase();
  app.innerHTML = `<p class="loading">Searching…</p>`;
  searchIndex ||= await getJSON('data/search.json');
  // rows: [country, cuisine_id, id, name, cuisine, course, diet letter, has recipe, thumb]
  const hits = searchIndex.filter(r => r[3].toLowerCase().includes(term) || r[4].toLowerCase().includes(term) || cname(r[0]).toLowerCase().includes(term));
  hits.sort((a, b) => (b[3].toLowerCase().includes(term)) - (a[3].toLowerCase().includes(term)) || b[7] - a[7]);
  const card = r => {
    const d = {name: r[3], cuisine: `${r[4]} · ${cname(r[0])}`, cuisine_id: r[1], id: r[2], course: r[5],
               diet: {V: 'Vegetarian', N: 'Non-vegetarian', C: 'Contains egg'}[r[6]] || 'Vegetarian', recipe: r[7], image: r[8] ? {url: r[8]} : null};
    return dishCard(r[0], d, true);
  };
  app.innerHTML = `<nav class="crumbs"><a href="#/" data-link>World</a> / <span>Search</span></nav>
    <h1>“${esc(q)}”</h1><p class="lede">${fmt(hits.length)} dishes found${hits.length > 300 ? ' (showing the first 300)' : ''}.</p>
    <div class="grid">${hits.slice(0, 300).map(card).join('') || '<div class="empty">Nothing found. Try a shorter word.</div>'}</div>`;
}

function pageNotFound() {
  setTitle('Not found');
  app.innerHTML = `<h1>Page not found</h1><p class="lede">This page doesn't exist. <a href="#/" data-link>Go to the home page</a>.</p>`;
}

/* ---------- router ---------- */
async function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = hash.split('?');
  const url = { searchParams: new URLSearchParams(query) };
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  try {
    if (parts[0] === 'search') return await pageSearch(url.searchParams.get('q') || '');
    if (parts.length === 0) return await pageHome();
    if (isCountry(parts[0])) {
      if (parts.length === 1) return await pageCountry(parts[0]);
      if (parts.length === 2) return await pageCuisine(parts[0], parts[1]);
      if (parts.length === 3) return await pageDish(parts[0], parts[1], parts[2]);
    } else if (parts.length <= 2) {                      // old India links: #/:cuisine[/:dish]
      return go('#/india/' + parts.join('/'));
    }
    pageNotFound();
  } catch (err) {
    app.innerHTML = `<h1>Something went wrong</h1><p class="lede">${esc(err.message)}. Refresh the page to try again.</p>`;
  }
}
function go(href) { if (location.hash === href) route(); else location.hash = href; window.scrollTo(0, 0); }

document.addEventListener('click', e => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault(); go(a.getAttribute('href'));
});
window.addEventListener('hashchange', route);
document.getElementById('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim();
  if (q) go(`#/search?q=${encodeURIComponent(q)}`);
});
document.getElementById('yr').textContent = new Date().getFullYear();

getJSON('data/countries.json').then(list => { countries = list; route(); })
  .catch(err => { app.innerHTML = `<h1>Couldn't load recipes</h1><p class="lede">${esc(err.message)}</p>`; });
