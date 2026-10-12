# Pujiverse Kitchen

India's regional cuisines, state by state — dishes, ingredients and step-by-step recipes. Plain HTML/CSS/JS, no build step.

## Files

| File | What it is |
|---|---|
| `index.html` | The page shell (header, footer) |
| `styles.css` | All styling, light and dark mode |
| `app.js` | Routing, pages, search, filters |
| `data/countries.json` | Points the app at `data/india.json` |
| `data/india.json` | India: 46 cuisines, 1,247 dishes, recipes, image credits |
| `vercel.json` | Optional Vercel settings (caching). Not needed on GitHub Pages |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |
| `favicon.svg` | Tab icon |

## Deploy

Pages use hash links (`#/hyderabadi/haleem`), so the site works from any folder — GitHub Pages (`pujiverse.github.io/pujiverse-kitchen/`), Vercel, or a custom domain.

**GitHub Pages:** repo **Settings → Pages → Deploy from a branch → main / (root)**. Custom domain: add it on the same page and create a CNAME record pointing to `pujiverse.github.io`.

### Vercel (optional)

1. Create a new GitHub repository (e.g. `pujiverse-kitchen`).
2. On the repo page click **Add file → Upload files**, drag in everything from this folder (keep the `data` folder), and commit.
3. In Vercel: **Add New → Project → Import** the repository. Framework preset: **Other**. Leave build command and output directory empty. Click **Deploy**.
4. Optional: in the Vercel project, **Settings → Domains**, add a subdomain such as `kitchen.pujiverse.com` and add the CNAME record it shows at your DNS provider.

## Updating content

Replace `data/india.json` with a newer export and commit — GitHub Pages (or Vercel) redeploys automatically within a minute or two.

## Test locally

Any static server works, e.g. `python3 -m http.server` in this folder, then open http://localhost:8000.

## Credits

Photos: Wikimedia Commons contributors, credited per dish under their licenses. Recipes marked "AI-written" are drafts pending review.
