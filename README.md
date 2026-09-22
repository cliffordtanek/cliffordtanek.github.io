# cliffordtanek.github.io

Personal portfolio — static site, no framework, no build step. Three files do the work:
`index.html`, `assets/css/style.css`, `assets/js/main.js`.

## Getting it live

1. **Create the repo.** On GitHub, make a new *public* repo named exactly:

   ```
   cliffordtanek.github.io
   ```

   The name has to match your username exactly — that's what makes it a user site served
   at the root domain.

2. **Push these files** to the `main` branch:

   ```bash
   cd portfolio
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/cliffordtanek/cliffordtanek.github.io.git
   git push -u origin main
   ```

3. **Turn on Pages.** Repo → Settings → Pages → Source: *Deploy from a branch* →
   Branch: `main`, folder: `/ (root)` → Save.

4. Wait a minute or two. The site is live at **https://cliffordtanek.github.io**

Every later `git push` to `main` redeploys automatically. No Actions workflow needed.

### Custom domain (optional)

If you ever buy e.g. `cliffordtan.dev`: add a file named `CNAME` at the repo root containing
just the domain, point an `ALIAS`/`A` record at GitHub's Pages IPs, then set the domain under
Settings → Pages.


## Project detail pages

Every project has its own page under `projects/` — real URLs you can send someone
directly, e.g. `cliffordtanek.github.io/projects/magique.html`. Clicking a card on
the home page (or a level design tile) opens it.

The content for all 15 pages lives in **one file**: `tools/projects_data.py`.
Edit the text there, then regenerate:

```bash
python3 tools/build_projects.py
```

That rewrites `projects/*.html`. The output is plain static HTML — GitHub Pages
still needs no build step, this is only so you're not editing fifteen files by hand.

Each page has: summary, hero image, body sections, YouTube/itch.io embeds, an
image gallery, a metadata sidebar (role, team, duration, tech), report PDF links,
and prev/next navigation.

### Two pages need your words

`portal-planet` and `bouncy-balloon` were still lorem ipsum on Weebly, so there was
nothing to carry over. They're marked `NEEDS_YOUR_WORDS` in `projects_data.py` and
render with a highlighted block on the page so you can't miss them. Write a few
sentences on each and rebuild.

### Report PDFs

`tools/build_projects.py` only links a report if the file actually exists in
`assets/docs/` — so a missing PDF is silently omitted rather than shipping a dead
link. Run the fetch script first, then rebuild, and the links appear.

## Live demos

Three project pages run a real algorithm in a canvas, and the home page's first
card uses one as its thumbnail. All of it is in `assets/js/demos.js` (no libraries):

| Demo | Page | What it does |
|---|---|---|
| `parcellation` | Road Network for Urban Parcellation + home card | Recursively splits a site across its long axis; the gaps are the roads |
| `flowfield` | Multi-Agent Pathfinding | One Dijkstra sweep builds an integration field, agents read the gradient |
| `seamcarve` | Seam Carving | Sobel energy, DP min-seam, remove, repeat on a procedural image |

Each one pauses when scrolled offscreen, redraws on theme change, and renders a
single static frame if the visitor has `prefers-reduced-motion` set. To add one to
another page, give the project a `"demo": ("kind", "caption")` entry in
`tools/projects_data.py` and rebuild.

## Drafting language

The visual details come from architectural drawing conventions, which is the part
of the site that comes from your background rather than a template:

- **Title block** — the footer is a drawing sheet title block (project / drawn by /
  scale / date / sheet).
- **Sheet numbers** — every project is `P-01` through `P-15`, shown on its card and
  at the top of its page. They follow the order in `projects_data.py`.
- **Poché hatching** — empty image slots are 45° hatched rather than a dot grid.
- **Dimension line** — the annotation under your name in the hero, with skewed
  architectural ticks.
- **Registration marks** — the small crosses at the top corners.

## Images

Web copies live flat in `assets/img/` — resized to 1600px max and compressed
(37 files, ~5 MB total, down from ~37 MB of originals).

**Your source archive stays out of git.** `.gitignore` excludes
`assets/img/*/` — the per-project folders holding original screenshots, videos,
installers and Visual Studio source. That matters: two of those videos are over
GitHub's hard 100 MB per-file limit and would make `git push` fail outright, and
git keeps every blob in history forever, so a single accidental commit bloats the
repo permanently. The folders stay on your disk; they just don't ship.

If you add a new screenshot, put the web copy in `assets/img/` at the top level
(not in a subfolder) or git will ignore it.

Any image that *is* missing degrades gracefully — the tile shows a labelled
hatched placeholder rather than a broken image.

One asset is still only on Weebly:

```bash
bash assets/img/fetch-weebly-images.sh   # the pathfinding report PDF
```

Filenames the HTML looks for:

| File | Project |
|---|---|
| `parcellation.png` | Road Network for Urban Parcellation (URA) |
| `magique.png` | Magique |
| `pathfinding.png` | Multi-Agent Pathfinding |
| `seam-carving.png` | Seam Carving |
| `hole-in-the-wall.png` | Hole In The Wall |
| `astro-cow.png` | Astro Cow |
| `makan-mania.png` | Makan Mania |
| `destination-dash.png` | Destination Dash |
| `peek-a-beak.png` | Peek A Beak |

Aim for 16:9, around 1600×900, under ~300 KB each.

## Editing

**Add a project** — add an entry to `tools/projects_data.py` and run the build script
for the detail page, then copy an `<article class="card">` block in `index.html` for the
card. The `data-cat` attribute controls which filter chips show it (`systems`, `games`,
`algorithms`, `mobile`, space-separated); `data-href` points at the detail page.

**Add a filter chip** — add a `<button class="chip" data-filter="yourcat">` in the
`.filters` div and use `yourcat` in a card's `data-cat`. The JS wires it up automatically.

**Change the accent colour** — one variable, `--accent`, near the top of `style.css`.
It's set twice: once in `:root` (light) and once in the two dark blocks.

**Dark mode** follows the OS by default; the header toggle overrides it and remembers the
choice in `localStorage`.

## What's deliberately not here

- **No phone number.** Your old Weebly contact page listed one publicly. Email and LinkedIn
  are enough — add it back only if you want it scraped.
- **No résumé PDF.** Drop one at `assets/resume.pdf` and add a link in the contact section
  if you want it downloadable.

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
