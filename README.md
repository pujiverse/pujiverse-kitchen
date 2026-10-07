# Pujiverse Kitchen

Regional cuisines, state by state — dishes, ingredients and step-by-step recipes. Plain HTML/CSS/JS, no build step.

## Files

| File | What it is |
|---|---|
| `index.html` | The page shell (header, footer) |
| `styles.css` | All styling, light and dark mode |
| `app.js` | Routing, pages, search, filters |
| `data/countries.json` | List of countries and where their data lives |
| `data/india.json` | India: 46 cuisines, 1,247 dishes, recipes, image credits |
| `vercel.json` | Sends every page URL to `index.html` so links like `/india/hyderabadi/haleem` work |
| `favicon.svg` | Tab icon |

## Deploy on Vercel

1. Create a new GitHub repository (e.g. `pujiverse-kitchen`).
2. On the repo page click **Add file → Upload files**, drag in everything from this folder (keep the `data` folder), and commit.
3. In Vercel: **Add New → Project → Import** the repository. Framework preset: **Other**. Leave build command and output directory empty. Click **Deploy**.
4. Optional: in the Vercel project, **Settings → Domains**, add a subdomain such as `kitchen.pujiverse.com` and add the CNAME record it shows at your DNS provider.

## Updating content

Replace `data/india.json` with a newer export and commit — Vercel redeploys automatically.
To add a country, add its JSON file in `data/` and one line to `data/countries.json`:

```json
{ "id": "mexico", "name": "Mexico", "file": "/data/mexico.json" }
```

## Test locally

Any static server works, but it must send unknown paths to `index.html` for deep links. Easiest: `npx vercel dev`, or `npx serve -s .`

## Credits

Photos: Wikimedia Commons contributors, credited per dish under their licenses. Recipes marked "AI-written" are drafts pending review.
