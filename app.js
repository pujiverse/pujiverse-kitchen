/* Pujiverse Kitchen — tiny client-side app (no build step).
   Routes:  /                      countries + cuisines
            /:country              cuisines of a country, grouped by region
            /:country/:cuisine     dishes of a cuisine
            /:country/:cuisine/:dish  recipe page
            /search?q=...          search across all loaded dishes            */

const app = document.getElementById('app');
const cache = {};          // country id -> data
let countries = [];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dietCls = d => d.startsWith('Veg') ? 'v' : d.startsWith('Non') ? 'n' : 'e';
const dietLbl = d => d.startsWith('Veg') ? 'Veg' : d.startsWith('Non') ? 'Non-veg' : 'Egg';
const mins = m => m >= 360 ? 'Overnight soak' : m >= 60 ? `${Math.floor(m/60)} h${m%60 ? ' ' + m%60 + ' min' : ''}` : `${m} min`;

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

function dishCard(country, d, showCuisine = false) {
  return `<a class="card" href="/${country}/${d.cuisine_id}/${d.id}" data-link>
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
  const parts = [];
  for (const c of countries) {
    const data = await loadCountry(c.id);
    const recipes = data.dishes.filter(d => d.recipe).length;
    parts.push(`<section class="region">
      <h2><a href="/${c.id}" data-link>${esc(c.name)}</a></h2>
      <div class="stats"><div><b>${data.cuisines.length}</b>regional cuisines</div><div><b>${data.dishes.length.toLocaleString()}</b>dishes</div><div><b>${recipes}</b>full recipes</div></div>
      ${cuisineGroups(c.id, data)}
    </section>`);
  }
  app.innerHTML = `<p class="eyebrow">World cuisines · state by state</p>
    <h1>What does each state cook?</h1>
    <p class="lede">Browse regional cuisines, see every dish we've catalogued, and open a dish for its ingredients and step-by-step method. India is first; more countries are on the way.</p>
    ${parts.join('')}`;
}

function cuisineGroups(country, data) {
  const regions = [...new Set(data.cuisines.map(c => c.region))];
  return regions.map(r => `<div class="region"><p class="eyebrow">${esc(r)}</p><div class="cuisines">
    ${data.cuisines.filter(c => c.region === r).map(c => {
      const rec = (data.byCuisine[c.id] || []).filter(d => d.recipe).length;
      return `<a class="cuisine" href="/${country}/${c.id}" data-link><span><strong>${esc(c.name)}</strong>
        <small>${esc(c.states.join(', '))}</small>${rec ? `<br><span class="badge">${rec} recipes</span>` : ''}</span>
        <span class="n">${c.dish_count}</span></a>`;
    }).join('')}</div></div>`).join('');
}

async function pageCountry(cid) {
  const data = await loadCountry(cid);
  if (!data) return pageNotFound();
  const name = countries.find(x => x.id === cid).name;
  setTitle(`${name} cuisines`);
  app.innerHTML = `<nav class="crumbs"><a href="/" data-link>Home</a> / <span>${esc(name)}</span></nav>
    <h1>Cuisines of ${esc(name)}</h1>
    <p class="lede">${data.cuisines.length} regional cuisines and ${data.dishes.length.toLocaleString()} dishes. Pick a cuisine to see its dishes.</p>
    ${cuisineGroups(cid, data)}`;
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
  app.innerHTML = `<nav class="crumbs"><a href="/" data-link>Home</a> / <a href="/${cid}" data-link>${esc(countryName)}</a> / <span>${esc(cu.name)}</span></nav>
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
  app.innerHTML = `<nav class="crumbs"><a href="/" data-link>Home</a> / <a href="/${cid}" data-link>${esc(countryName)}</a> /
      <a href="/${cid}/${d.cuisine_id}" data-link>${esc(d.cuisine)}</a> / <span>${esc(d.name)}</span></nav>
    <div class="hero">
      <div>${picture(d, 'hero-img', false)}<div class="credit">${credit}</div></div>
      <div>
        <p class="eyebrow">${esc(d.cuisine)}${d.states.join(', ') !== d.cuisine ? ' · ' + esc(d.states.join(', ')) : ''}</p>
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

async function pageSearch(q) {
  setTitle(`Search: ${q}`);
  document.getElementById('q').value = q;
  const term = q.trim().toLowerCase();
  const hits = [];
  for (const c of countries) {
    const data = await loadCountry(c.id);
    for (const d of data.dishes) {
      if (d.name.toLowerCase().includes(term) || d.cuisine.toLowerCase().includes(term) ||
          (d.recipe && d.recipe.ingredients.some(i => i.toLowerCase().includes(term)))) hits.push([c.id, d]);
    }
  }
  hits.sort((a, b) => (b[1].name.toLowerCase().includes(term)) - (a[1].name.toLowerCase().includes(term)) || (!!b[1].recipe - !!a[1].recipe));
  app.innerHTML = `<nav class="crumbs"><a href="/" data-link>Home</a> / <span>Search</span></nav>
    <h1>“${esc(q)}”</h1><p class="lede">${hits.length} dishes found (names, cuisines and ingredients).</p>
    <div class="grid">${hits.slice(0, 200).map(([cid, d]) => dishCard(cid, d, true)).join('') || '<div class="empty">Nothing found. Try a shorter word.</div>'}</div>`;
}

function pageNotFound() {
  setTitle('Not found');
  app.innerHTML = `<h1>Page not found</h1><p class="lede">This page doesn't exist. <a href="/" data-link>Go to the home page</a>.</p>`;
}

/* ---------- router ---------- */
async function route() {
  const url = new URL(location.href);
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  try {
    if (parts[0] === 'search') return await pageSearch(url.searchParams.get('q') || '');
    if (parts.length === 0) return await pageHome();
    if (parts.length === 1) return await pageCountry(parts[0]);
    if (parts.length === 2) return await pageCuisine(parts[0], parts[1]);
    if (parts.length === 3) return await pageDish(parts[0], parts[1], parts[2]);
    pageNotFound();
  } catch (err) {
    app.innerHTML = `<h1>Something went wrong</h1><p class="lede">${esc(err.message)}. Refresh the page to try again.</p>`;
  }
}
function go(href) { history.pushState(null, '', href); route(); window.scrollTo(0, 0); }

document.addEventListener('click', e => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault(); go(a.getAttribute('href'));
});
window.addEventListener('popstate', route);
document.getElementById('searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim();
  if (q) go(`/search?q=${encodeURIComponent(q)}`);
});
document.getElementById('yr').textContent = new Date().getFullYear();

getJSON('/data/countries.json').then(list => { countries = list; route(); })
  .catch(err => { app.innerHTML = `<h1>Couldn't load recipes</h1><p class="lede">${esc(err.message)}</p>`; });
