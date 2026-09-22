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

## Hero intro & motion

`assets/js/hero.js` + the matching CSS blocks. The conceit is that the page
drafts itself, in the order you'd actually draw a title:

1. drafting grid fades up
2. construction lines sweep out (the accent hairlines)
3. the name strokes in a character at a time, blur to sharp
4. the dimension annotation is added last

Behind it, the **parcellation algorithm runs as the backdrop** — the same
subdivision from the URA work, masked away from the text so it never fights
the type. On a fine pointer the hero also gets a CAD crosshair with a live
coordinate readout.

**Theme toggle is a plotter pass.** A pen travels the viewport and the new
sheet is drawn in behind it — a hard reveal edge, not a fade. On the View
Transitions path the pen is a `drop-shadow` on the clipped snapshot, which
traces its leading edge; normal DOM can't paint above those pseudo-elements,
so that's the only way to get a line on top. Browsers without View Transitions
get a panel that wipes across in the incoming colour with the pen drawn on its
own edge, so the two can't drift out of sync.

A tiny inline script in `<head>` applies the saved theme before first paint,
so there's no white flash.

**AutoCAD cursor**, site-wide on fine pointers: full-viewport crosshair,
pickbox at the intersection that grows and fills over anything clickable, and
a coordinate readout bottom-left like the status bar. The native cursor is
hidden only while ours is live, and restored on pointer-leave, window blur and
tab hide — so you can never end up with no cursor at all. Off entirely on
touch and with reduced motion.

**Drafting paper** (`.paper`) is a fixed grid under every page, so the site
reads as one continuous sheet. Two scales, 22px and 110px, matching the hero.

Also: a scroll-progress rule under the header, and registration ticks on the
corners of a hovered card.

**To turn the intro off**, delete the `<script src="assets/js/hero.js">` line.
The hero renders in its final state without it — every animation is gated
behind a class that only that file adds, so no-JS and `prefers-reduced-motion`
visitors already see the static version.

## Images and covers

Every project has its own folder, `assets/img/<slug>/`:

```
assets/img/magique/
  cover.mp4        animated cover (h264)
  cover.webm       same, VP9 — browsers pick whichever they support
  cover.jpg        poster frame; also the static cover when there's no footage
  logo.png         title lockup, laid over the cover
  01-main-menu.png gallery, shown in filename order
  02-gameplay.jpg
```

The caption under each gallery image is derived from its filename
(`02-spicy-mode.jpg` → "Spicy mode"), so name files descriptively. Add or
remove one, update the `media` block in `tools/projects_data.py`, and rebuild.

**Covers are video, not GIF.** Your source GIFs were 4–10 MB each; as MP4 and
WebM they're 116–500 KB, a 10–25× reduction for the same footage. They carry no
`autoplay` attribute and `preload="none"`, so nothing downloads until a cover is
near the viewport; offscreen covers pause. With `prefers-reduced-motion` they
never play and the poster frame stands in.

To add a cover for a project that doesn't have one, drop the GIF in and convert:

```bash
ffmpeg -t 8 -i in.gif -vf "scale='min(960,iw)':-2:flags=lanczos" \
  -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -an \
  -movflags +faststart assets/img/<slug>/cover.mp4
ffmpeg -t 8 -i in.gif -vf "scale='min(960,iw)':-2:flags=lanczos" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -an assets/img/<slug>/cover.webm
ffmpeg -i assets/img/<slug>/cover.mp4 -frames:v 1 -q:v 4 assets/img/<slug>/cover.jpg
```

Road Network has no cover on purpose — its card runs the live parcellation demo.

**Your source archive stays out of git.** `.gitignore` excludes
`assets/img/[0-9]*/` — your numbered folders ("1 Makan Mania", "2 Astro Cow"…)
holding originals, videos, installers and Visual Studio source. Two of those
videos exceed GitHub's hard 100 MB per-file limit and would make `git push` fail
outright, and git keeps every blob forever, so one accidental commit bloats the
repo permanently. The folders stay on your disk; they just don't ship.

Loose files at the top of `assets/img/` are also ignored — that's the old flat
layout, and those files are safe to delete by hand.

A missing cover degrades gracefully: the tile shows hatching and the project
name rather than a broken image.

One asset is still only on Weebly:

```bash
bash assets/img/fetch-weebly-images.sh   # the pathfinding report PDF
```

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
