#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate projects/<slug>.html for every entry in projects_data.py.

    python3 tools/build_projects.py

The output is plain static HTML. GitHub Pages serves it directly — this script
is only a convenience so you can edit copy in one file instead of fifteen.
"""

import html
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from projects_data import PROJECTS  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "projects")
MISSING_PDFS = []

E = html.escape


def nav(active=""):
    items = [("../index.html#work", "Work"), ("../index.html#projects", "Projects"),
             ("../index.html#design", "Design"), ("../index.html#about", "About"),
             ("../index.html#contact", "Contact")]
    lis = "\n".join(f'      <li><a href="{h}">{t}</a></li>' for h, t in items)
    return f"""<header class="site-header">
  <nav class="nav" aria-label="Primary">
    <a class="mark" href="../index.html">CT<span class="dot">.</span></a>
    <ul class="nav-links">
{lis}
    </ul>
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle colour theme" title="Toggle theme">
      <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path class="sun" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m11.32 0 1.41 1.41M4.93 4.93l1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/><path class="moon" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>
    </button>
  </nav>
  <span class="scan" aria-hidden="true"><i></i></span>
</header>"""


def meta_block(p):
    rows = "\n".join(
        f'      <div class="pm-row"><span class="pm-k">{E(k)}</span>'
        f'<span class="pm-v">{E(v)}</span></div>'
        for k, v in p["meta"]
    )
    tech = "".join(f"<li>{E(t)}</li>" for t in p["tech"])

    extras = []
    if p.get("youtube"):
        extras.append(('https://www.youtube.com/watch?v=' + p["youtube"], "Watch demo"))
    if p.get("itch"):
        extras.append((f'https://itch.io/embed/{p["itch"]}', "Play on itch.io"))
    for label, url in p.get("links", []):
        extras.append((url, label))
    # Only link a report if the file is actually on disk — otherwise the page
    # would ship a dead link. Run fetch-weebly-images.sh, then rebuild.
    if p.get("pdf"):
        fname, label, _ = p["pdf"]
        if os.path.exists(os.path.join(ROOT, "assets", "docs", fname)):
            extras.append((f"../assets/docs/{fname}", label + " (PDF)"))
        else:
            MISSING_PDFS.append(fname)

    links_html = ""
    if extras:
        ls = "\n".join(
            f'        <a href="{E(u)}" {"" if u.startswith("../") else "target=_blank rel=noopener"}>{E(t)} ↗</a>'
            for u, t in extras
        )
        links_html = f"""
    <div class="pm-links">
{ls}
    </div>"""

    return f"""  <aside class="project-meta">
    <div class="pm-rows">
{rows}
    </div>
    <div class="pm-tech">
      <h4>Tech &amp; tools</h4>
      <ul class="tags">{tech}</ul>
    </div>{links_html}
  </aside>"""


def body_sections(p):
    out = []
    for heading, text in p["sections"]:
        flagged = "NEEDS_YOUR_WORDS" in text
        cls = ' class="todo"' if flagged else ""
        out.append(f"""    <section class="prose-block"{cls}>
      <h2>{E(heading)}</h2>
      <p>{E(text)}</p>
    </section>""")
    if p.get("note"):
        out.append(f'    <p class="note">{E(p["note"])}</p>')
    return "\n".join(out)


def cover(p, prefix="../assets/img/"):
    """Animated cover (video) or static image, with the title lockup laid over it.
    A missing cover leaves the hatched placeholder showing, which is a real state
    — Road Network has no footage and runs the live demo instead."""
    m = p.get("media") or {}
    base = f"{prefix}{p['slug']}/"
    inner = ""
    if m.get("video"):
        inner = (f'    <video class="cover-media" autoplay muted loop playsinline preload="metadata"\n'
                 f'           poster="{base}cover.jpg" aria-label="{E(p["title"])} gameplay">\n'
                 f'      <source src="{base}cover.webm" type="video/webm">\n'
                 f'      <source src="{base}cover.mp4" type="video/mp4">\n'
                 f'    </video>\n')
    elif m.get("cover"):
        inner = (f'    <img class="cover-media" src="{base}{m["cover"]}" alt="" loading="lazy">\n')
    if m.get("logo"):
        inner += (f'    <img class="cover-logo" src="{base}{m["logo"]}"\n'
                  f'         alt="{E(p["title"])}" loading="lazy">\n')
    if not inner:
        return ""
    has_media = bool(m.get("video") or m.get("cover"))
    if has_media and m.get("logo"):
        inner = inner.replace('    <img class="cover-logo"',
                              '    <span class="cover-veil" aria-hidden="true"></span>\n'
                              '    <img class="cover-logo"')
    cls = "cover cover-hero" + (" has-media" if has_media else "")
    return (f'  <div class="{cls}" data-label="{E(p["title"])}">\n'
            f'{inner}  </div>')


def gallery(p):
    items = (p.get("media") or {}).get("gallery") or []
    if not items:
        return ""
    figs = []
    for item in items:
        fname, caption = item[0], item[1]
        wide = len(item) > 2 and item[2] == "wide"
        cls = "shot shot--wide" if wide else "shot"
        figs.append(f"""      <figure class="{cls}">
        <div class="shot-frame" data-label="{E(caption)}">
          <img src="../assets/img/{E(p['slug'])}/{E(fname)}" alt="{E(p['title'])} — {E(caption)}" loading="lazy">
        </div>
        <figcaption>{E(caption)}</figcaption>
      </figure>""")
    return f"""    <section class="prose-block">
      <h2>Gallery</h2>
      <div class="gallery">
{chr(10).join(figs)}
      </div>
    </section>"""


def embeds(p):
    parts = []
    if p.get("youtube"):
        parts.append(f"""      <div class="embed embed-video">
        <iframe src="https://www.youtube-nocookie.com/embed/{E(p['youtube'])}"
                title="{E(p['title'])} — video" loading="lazy" allowfullscreen
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>""")
    if p.get("itch"):
        parts.append(f"""      <div class="embed embed-itch">
        <iframe src="https://itch.io/embed/{E(p['itch'])}" loading="lazy"
                title="{E(p['title'])} on itch.io"></iframe>
      </div>""")
    if not parts:
        return ""
    return f"""    <section class="prose-block">
      <h2>Play &amp; watch</h2>
{chr(10).join(parts)}
    </section>"""


def demo_block(p):
    if not p.get("demo"):
        return ""
    kind, note = p["demo"]
    note = re.sub(r"\s+", " ", note).strip()
    return f"""    <section class="prose-block">
      <h2>Live demo</h2>
      <div class="demo">
        <canvas class="demo-canvas" data-demo="{E(kind)}"
                aria-label="Live algorithm demo for {E(p['title'])}"></canvas>
        <div class="demo-bar">
          <span class="demo-label">Running</span>
          <span class="demo-note">{E(note)}</span>
          <button class="demo-again" type="button">Regenerate</button>
        </div>
      </div>
    </section>"""


def pager(i):
    prev_p = PROJECTS[i - 1] if i > 0 else None
    next_p = PROJECTS[i + 1] if i < len(PROJECTS) - 1 else None
    left = (f'<a class="pg pg-prev" href="{prev_p["slug"]}.html">'
            f'<span class="pg-k">← Previous</span>'
            f'<span class="pg-v">{E(prev_p["title"])}</span></a>') if prev_p else '<span></span>'
    right = (f'<a class="pg pg-next" href="{next_p["slug"]}.html">'
             f'<span class="pg-k">Next →</span>'
             f'<span class="pg-v">{E(next_p["title"])}</span></a>') if next_p else '<span></span>'
    return f'  <nav class="pager" aria-label="Project navigation">\n    {left}\n    {right}\n  </nav>'


def page(p, i):
    sheet = "P-%02d" % (i + 1)
    desc = re.sub(r"\s+", " ", p["summary"]).replace("NEEDS_YOUR_WORDS — ", "")[:180]
    hero_html = cover(p)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(p['title'])} — Clifford Tan</title>
<meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(p['title'])} — Clifford Tan">
<meta property="og:description" content="{E(desc)}">
<meta property="og:type" content="article">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' font-family='monospace'>C</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css">
<script>
/* Applied before first paint so a dark-mode visitor never sees a white flash. */
(function(){{try{{var t=localStorage.getItem('ct-theme');
if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}}})();
</script>
</head>
<body class="project-page">

<a class="skip" href="#main">Skip to content</a>

<span class="reg-mark reg-tl" aria-hidden="true"></span>
<span class="reg-mark reg-tr" aria-hidden="true"></span>

{nav()}

<main id="main">
  <div class="wrap">

  <a class="back" href="../index.html#projects">← All projects</a>

  <header class="project-head">
    <p class="eyebrow-plain">{E(p['category'])} · {E(p['year'])} <span class="sheet-tag">{sheet}</span></p>
    <h1>{E(p['title'])}</h1>
    <p class="project-summary">{E(p['summary'].replace('NEEDS_YOUR_WORDS — ', ''))}</p>
  </header>

{hero_html}

  <div class="project-layout">
    <div class="project-body">
{body_sections(p)}
{demo_block(p)}
{embeds(p)}
{gallery(p)}
    </div>

{meta_block(p)}
  </div>

{pager(i)}

  </div>
</main>

<footer class="site-footer title-block">
  <div class="tb-grid">
    <div class="tb-cell tb-cell--name">
      <span class="tb-k">Project</span>
      <span class="tb-v">{E(p['title'])}</span>
    </div>
    <div class="tb-cell">
      <span class="tb-k">Drawn by</span>
      <span class="tb-v">C. Tan</span>
    </div>
    <div class="tb-cell">
      <span class="tb-k">Scale</span>
      <span class="tb-v tb-scale">
        <svg width="42" height="7" viewBox="0 0 42 7" aria-hidden="true">
          <rect x="0" y="0" width="10.5" height="6" fill="currentColor"/>
          <rect x="10.5" y="0" width="10.5" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
          <rect x="21" y="0" width="10.5" height="6" fill="currentColor"/>
          <rect x="31.5" y="0" width="10.5" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>1:1
      </span>
    </div>
    <div class="tb-cell">
      <span class="tb-k">Date</span>
      <span class="tb-v">{E(p['year'])}</span>
    </div>
    <div class="tb-cell">
      <span class="tb-k">Sheet</span>
      <span class="tb-v">{sheet}</span>
    </div>
  </div>
  <div class="tb-foot">
    <span>&copy; <span id="year">2026</span> Clifford Tan</span>
    <span><a href="../index.html">Back to portfolio</a></span>
  </div>
</footer>

<script src="../assets/js/main.js"></script>
<script src="../assets/js/demos.js"></script>
<script src="../assets/js/hero.js"></script>
</body>
</html>
"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for i, p in enumerate(PROJECTS):
        path = os.path.join(OUT_DIR, p["slug"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(page(p, i))
        flag = "  ← NEEDS YOUR WORDS" if any(
            "NEEDS_YOUR_WORDS" in t for _, t in p["sections"]) else ""
        print(f"  projects/{p['slug']}.html{flag}")
    print(f"\n{len(PROJECTS)} pages written.")
    if MISSING_PDFS:
        print("\nReport links omitted (file not in assets/docs/):")
        for m in sorted(set(MISSING_PDFS)):
            print("  " + m)
        print("Run: bash assets/img/fetch-weebly-images.sh  then rebuild.")


if __name__ == "__main__":
    main()
