# -*- coding: utf-8 -*-
"""
Single source of truth for every project detail page.

Edit the text here, run `python3 tools/build_projects.py`, and the 15 files in
projects/ are regenerated. The output is plain static HTML — GitHub Pages needs
no build step, this is only for your convenience when bulk-editing.

Descriptions are based on your own Weebly copy, lightly tightened. Where the old
site had no real text (Portal Planet, Bouncy Balloon were lorem ipsum) the entry
is marked NEEDS_YOUR_WORDS.

Assets live per project in assets/img/<slug>/ :
    cover.mp4 + cover.webm + cover.jpg   animated cover (poster is the jpg)
    cover.jpg                            static cover, when there is no footage
    logo.png                             the title lockup, laid over the cover
    01-*.jpg / 02-*.png ...              gallery, shown in filename order
The "media" key below is generated from those folders.
"""

WEEBLY = "https://cliffordtanek.weebly.com/uploads/1/2/4/8/124841696"

PROJECTS = [

# ─────────────────────────── ENGINEERING ───────────────────────────
{
  "slug": "road-network-parcellation",
  "demo": ("parcellation",
           "An illustration of the idea, not the production code: a small JavaScript\n            sketch written for this page that splits the largest remaining parcel\n            across its long axis until every parcel is under a target area. The real\n            implementation is Python against Singapore's road network data."),
  "title": "Road Network for Urban Parcellation",
  "category": "Capstone · Urban Redevelopment Authority",
  "kind": "engineering",
  "cat": "systems algorithms",
  "year": "2025–2026",
  "summary": "Generative algorithms that take a raw land boundary and produce a viable road "
             "network and subdivided land parcels automatically — built into URA's ePlanner "
             "planning platform.",
  "meta": [
    ("Role", "Computational Designer"),
    ("Where", "Urban Redevelopment Authority, Singapore"),
    ("Duration", "12 months (IWSP placement)"),
    ("Type", "Capstone project"),
  ],
  "tech": ["Python", "Geospatial / GIS", "Computational geometry", "REST API",
           "Cloud deployment", "Rhino / Grasshopper"],
  "sections": [
    ("The problem",
     "Subdividing a plot of land into buildable parcels — and laying the roads that serve them — "
     "was being done by hand, with parcellation logic locked inside legacy Rhino/Grasshopper "
     "definitions. That made it slow to iterate on and impossible to run at scale across "
     "Singapore's planning data."),
    ("What I built",
     "I migrated the legacy parcellation logic out of Grasshopper into Python, then extended it "
     "with generative algorithms that produce road networks automatically from a land boundary. "
     "The geometry runs against real spatial analysis of Singapore's road network data, so the "
     "generated roads connect sensibly to what already exists rather than being drawn in "
     "isolation. I took it the whole way: backend API, frontend integration into ePlanner, and "
     "cloud deployment."),
    ("What I took from it",
     "Most of the difficulty wasn't the algorithm — it was the geometry being messy in ways a "
     "clean test case never is. Real parcel boundaries self-intersect, have slivers, and don't "
     "close. Handling degenerate input turned out to be most of the work."),
  ],
  "note": "Some implementation detail is omitted — this was internal government work.",
  "media": {
    "cover": None,
    "video": False,
    "logo": None,
    "gallery": [
    ],
  },
  "youtube": None, "itch": None, "pdf": None, "links": [],
},

{
  "slug": "magique",
  "title": "Magique",
  "category": "Game · Custom C/C++ engine",
  "kind": "engineering",
  "cat": "games systems",
  "year": "2024",
  "summary": "A 2D thriller side-scrolling platformer following Amare, a boy escaping Maison de "
             "Magie — a circus where the performers are exploited by its ringmaster, Malachi. "
             "Built on an engine we wrote from scratch.",
  "meta": [
    ("Role", "Product Manager · Lead Physics Programmer"),
    ("Team", "7 — UX, game design, computer science"),
    ("Duration", "2 semesters (Year 2)"),
    ("Engine", "Custom, built from scratch"),
  ],
  "tech": ["C", "C++", "Visual Studio", "Custom engine", "Physics", "Rendering"],
  "sections": [
    ("The engine",
     "No Unity, no Unreal. We wrote our own engine in C/C++ — physics, collision, rendering and "
     "the asset pipeline — which meant full control over how the game behaved and nowhere to hide "
     "when something was wrong."),
    ("My role",
     "I owned the physics system and ran the project as PM. The physics side meant collision "
     "response, platformer movement feel, and the constant tuning that decides whether a jump "
     "reads as tight or floaty. The PM side meant keeping seven people across three disciplines "
     "pointed at the same build."),
    ("Working across disciplines",
     "The team spanned UX, game design and CS, which is the part I'd underestimated. Designers "
     "describe a jump in feel; programmers need it in numbers. A lot of the job was translating "
     "between those two, and building the tuning knobs that let designers answer the question "
     "themselves."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": True,
    "logo": 'logo.png',
    "gallery": [
    ('01-main-menu.png', 'Main menu'),
    ('02-gameplay.jpg', 'Gameplay'),
    ('03-level-editor.jpg', 'Level editor'),
    ('04-cutscene.jpg', 'Cutscene'),
    ],
  },
  "youtube": "PIk9CnEE8X8", "itch": "3039191", "pdf": None, "links": [],
},

{
  "slug": "multi-agent-pathfinding",
  "wasm": {
      "base": "../assets/demo/pathfinding/",
      "loader": "pathfinding.js",
      "export": "createPathfinding",
      "title": "Run the actual program",
      "weight": "~400 KB \u00b7 loads only when you ask",
      "keys": [("Drag", "draw walls"),
               ("Right-drag", "erase"),
               ("W A S D", "pan"),
               ("Wheel", "zoom"),
               ("MapMaker \u2192 Generate Map", "procedural maze")],
      "note": """This is the Visual Studio project itself \u2014 the same Grid, Factory and
                 Editor sources \u2014 compiled to WebAssembly with Emscripten. SFML is
                 replaced by a small compatibility layer over WebGL, and the ImGui
                 panels, the map files and the docked layout are the ones from the
                 desktop build.""",
  },
  "title": "Multi-Agent Pathfinding",
  "category": "AI research project",
  "kind": "engineering",
  "cat": "algorithms games",
  "year": "2024",
  "summary": "Navigation for large groups of NPCs across procedurally generated terrain under fog "
             "of war — aimed at real-time strategy, stealth and open-world exploration.",
  "meta": [
    ("Role", "Group project — AI systems"),
    ("Type", "University research project"),
    ("Output", "Implementation + written report"),
  ],
  "tech": ["C++", "SFML", "ImGui", "Visual Studio", "Flow fields", "Potential fields", "Heat maps"],
  "sections": [
    ("The problem",
     "Pathfinding one agent is a solved problem. Pathfinding fifty, through terrain they haven't "
     "seen yet, without them clumping, oscillating or walking through each other, is not — and "
     "running A* per agent per frame doesn't scale."),
    ("The approach",
     "We combined three techniques rather than picking one. Flow fields let the whole group share "
     "a single navigation solve instead of computing a path each. Potential fields handle dynamic "
     "obstacle avoidance and keep agents from overlapping. Heat maps prioritise which areas are "
     "worth exploring, so agents under fog of war spread out to cover ground instead of all "
     "following the same trail."),
    ("Where it applies",
     "The combination suits genres where a crowd has to look deliberate — RTS unit groups, stealth "
     "AI sweeping a space, open-world NPCs exploring terrain the player has also never seen."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": True,
    "logo": 'logo.png',
    "gallery": [
    ('01-flow-field.png', 'Flow field with agent cones'),
    ],
  },
  "youtube": "O11_lbwOUPo", "itch": None,
  "pdf": ("multi-agent-pathfinding-report.pdf", "Full project report",
          f"{WEEBLY}/ai_proposal_team_wo_ai_ni.pdf"),
  "links": [],
},

{
  "slug": "seam-carving",
  "demo": ("seamcarve",
           "An illustration of the algorithm, written in JavaScript for this page \u2014 the\n            project itself is C++/OpenCV, and the footage above is from it. Sobel energy\n            map, then dynamic programming finds the cheapest top-to-bottom seam; the\n            highlighted path is the one about to be removed."),
  "title": "Content-Aware Image Resizing with Seam Carving",
  "category": "Algorithms study",
  "kind": "engineering",
  "cat": "algorithms systems",
  "year": "2024",
  "summary": "Resizing an image by removing the least important pixel paths through it rather than "
             "scaling — implemented three different ways and benchmarked against each other.",
  "meta": [
    ("Role", "Group project — implementation & analysis"),
    ("Type", "University project"),
    ("Output", "Interactive tool + written report"),
  ],
  "tech": ["C++", "OpenCV", "OpenGL", "ImGui", "Maxflow", "NumPy", "Matplotlib-cpp"],
  "sections": [
    ("How seam carving works",
     "Instead of squashing an image, you find a connected path of pixels from top to bottom — a "
     "seam — that carries the least visual information, and delete it. Repeat, and the image gets "
     "narrower while the things that matter in it stay the right shape. The energy of each pixel "
     "comes from a Sobel operator measuring local intensity gradient."),
    ("Three approaches, compared",
     "We implemented the seam search three ways. Dynamic programming builds a cumulative energy "
     "map and finds the globally optimal seam. A greedy algorithm makes local decisions — much "
     "faster, visibly worse. Graph cuts treat it as a max-flow/min-cut problem for a different "
     "kind of global optimum. Dynamic programming won on the quality-per-millisecond trade, which "
     "is the answer the literature predicts but it was worth proving ourselves."),
    ("The tool",
     "A real-time GUI for loading an image, dragging the target dimensions, and watching the seams "
     "get removed. It also does object removal — mark a region and the algorithm preferentially "
     "carves through it."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": True,
    "logo": 'logo.png',
    "gallery": [
    ('01-seams.jpg', 'Seams overlaid on the source image'),
    ],
  },
  "youtube": "9uLtq96a65Q", "itch": None,
  "pdf": ("seam-carving-report.pdf", "Full project report", None),
  "links": [],
},

{
  "slug": "hole-in-the-wall",
  "title": "Hole In The Wall",
  "category": "Android party game",
  "kind": "engineering",
  "cat": "mobile games",
  "year": "2024",
  "summary": "A two-player Android party game: one player calls out instructions, the other "
             "contorts to match a moving cutout while the phone camera judges whether they fit.",
  "meta": [
    ("Role", "Team Leader · Game Designer · UI/UX"),
    ("Team", "Group project"),
    ("Platform", "Android"),
  ],
  "tech": ["Kotlin", "Jetpack Compose", "ML Kit", "CameraX", "SceneView", "Firebase",
           "SoundPool", "MediaPlayer", "Android Studio"],
  "sections": [
    ("The idea",
     "The TV game show, on a phone. One player can see the wall coming and has to describe the "
     "pose; the other can't see it and has to get into position. The camera decides if they made it."),
    ("Making the detection usable",
     "Raw pose detection from ML Kit jitters frame to frame, which made the game feel like it was "
     "cheating. Exponential smoothing over the landmark positions stabilised it enough to be fair. "
     "Fit detection works by bitmap alpha analysis — comparing the player's silhouette against the "
     "cutout's transparent region — which had to run at camera frame rate without dropping the 3D "
     "wall rendering."),
    ("My role",
     "I led the team: concept, delegation, and making sure the pieces other people built actually "
     "fit together into one game. I also did the game design and contributed to UI/UX."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": True,
    "logo": 'logo.png',
    "gallery": [
    ('01-main-menu.jpg', 'Main menu'),
    ('02-pose-matching.jpg', 'In-game pose matching'),
    ('03-game-over.jpg', 'Game over'),
    ('04-technical-overview.png', 'Technical overview'),
    ],
  },
  "youtube": "4pKy15podqU", "itch": None, "pdf": None, "links": [],
},

{
  "slug": "astro-cow",
  "title": "Astro Cow",
  "category": "Game · Alpha Engine",
  "kind": "engineering",
  "cat": "games",
  "year": "2023",
  "summary": "Pilot a UFO across rotating planets, abduct the livestock, dodge the asteroids, and "
             "deliver everything to the planet marked with a flag.",
  "meta": [
    ("Role", "Lead Programmer · UI/UX Designer"),
    ("Team", "5"),
    ("Duration", "Year 1, Semester 2"),
    ("Engine", "Alpha Engine (DigiPen)"),
  ],
  "tech": ["C", "C++", "Alpha Engine", "Visual Studio"],
  "sections": [
    ("The game",
     "Planets rotate; you orbit them, pick up animals, and cross the gap to the next one without "
     "hitting an asteroid. The whole thing lives or dies on how the UFO handles — enough momentum "
     "that it feels like flying, enough control that a miss feels like your fault."),
    ("Difficulty scaling",
     "Three tiers, and they don't just change one number. Easy through hard scales planet rotation "
     "speed, how many planets are in play, and how many animals you have to move — so the harder "
     "modes change the shape of the problem rather than just the reaction time it needs."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": True,
    "logo": 'logo.png',
    "gallery": [
    ('01-main-menu.png', 'Main menu'),
    ('02-level-select.jpg', 'Level select'),
    ('03-tutorial.jpg', 'Tutorial'),
    ],
  },
  "youtube": "viZI0KF6UT0", "itch": "2202573", "pdf": None, "links": [],
},

{
  "slug": "makan-mania",
  "title": "Makan Mania",
  "category": "Game · CProcessing",
  "kind": "engineering",
  "cat": "games",
  "year": "2023",
  "summary": "A pixel-art cooking arcade game. Take orders, mix ingredients, throw the finished "
             "dish at the customer before the timer runs out.",
  "meta": [
    ("Role", "UI/UX Designer"),
    ("Team", "Group project"),
    ("Duration", "Year 1, Semester 1"),
    ("Language", "C"),
  ],
  "tech": ["C", "CProcessing", "Visual Studio", "Pixel art"],
  "sections": [
    ("The game",
     "Orders come in, you assemble them from the ingredients on the counter, and you serve before "
     "the customer walks. Complete a set number of orders to win; miss too many and you lose."),
    ("Two modes",
     "Standard mode keeps the ingredients in fixed positions, so it's a memory-and-speed game. "
     "Spicy mode puts them on a moving conveyor belt, so it becomes a timing game. Each has three "
     "difficulty levels."),
    ("My role",
     "UI/UX — the layout of the kitchen, how orders are communicated at a glance, and the pixel art "
     "interface. In a game where you're reading three things at once under time pressure, where "
     "information sits on screen is the difficulty."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": True,
    "logo": 'logo.png',
    "gallery": [
    ('01-main-menu.png', 'Main menu'),
    ('02-standard-mode.jpg', 'Standard mode'),
    ('03-spicy-mode.jpg', 'Spicy mode — moving conveyor'),
    ('04-almanac.png', 'Almanac'),
    ],
  },
  "youtube": "AyB548vUIBs", "itch": "2207708", "pdf": None, "links": [],
},

# ─────────────────────────── BOARD GAMES ───────────────────────────
{
  "slug": "destination-dash",
  "title": "Destination Dash",
  "category": "Tabletop card game",
  "kind": "design",
  "cat": "design",
  "year": "2023",
  "summary": "You run a private jet company. Fly wealthy clients to all eight destinations before "
             "obstacles and fuel costs eat your fleet.",
  "meta": [
    ("Role", "Game Designer · Graphic Designer"),
    ("Type", "University group project"),
    ("Players", "Competitive, multiplayer"),
  ],
  "tech": ["Figma", "Adobe Suite", "Systems design", "Graphic design"],
  "sections": [
    ("The game",
     "A limited fleet, a fuel budget, and eight destinations to reach. Every route costs you "
     "something, and obstacles thin the fleet — so the tension is in choosing which trips are worth "
     "the aircraft you'll lose making them."),
    ("Designing the object, not just the rules",
     "The physical components carry the theme as hard as the mechanics do. The box is styled as a "
     "piece of luggage, the rulebook is formatted as a passport, and the tokens are planes and "
     "passengers. It means the theme lands before anyone has read a rule."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-cards-and-tokens.jpg', 'Cards and tokens'),
    ('02-packaging.jpg', 'Packaging'),
    ('03-cover.jpg', 'Cover'),
    ],
  },
  "youtube": None, "itch": None, "pdf": None,
  "links": [("BoardGameGeek listing", "https://boardgamegeek.com/boardgame/398559/destination-dash")],
},

{
  "slug": "peek-a-beak",
  "title": "Peek A Beak",
  "category": "Tabletop board game",
  "kind": "design",
  "cat": "design",
  "year": "2023",
  "summary": "A birdwatching competition in Sungei Buloh. Eight days to photograph fifteen elusive "
             "species — without scaring them off, and without losing your shots to the snakes.",
  "meta": [
    ("Role", "Game Designer · Developer"),
    ("Type", "University group project"),
    ("Setting", "Sungei Buloh Wetland Reserve"),
  ],
  "tech": ["Figma", "Adobe Suite", "Board game design"],
  "sections": [
    ("The game",
     "Fifteen bird species, each with its own quest and reward, across eight in-game days. Dice "
     "rolls decide which trails are open and what hazards are out, so no two runs give you the same "
     "route to the same bird."),
    ("The core tension",
     "Proximity. You need to be close enough to photograph a bird and far enough not to spook it, "
     "and the bird-eating snakes roaming the reserve mean the shots you've already banked aren't "
     "safe either. Every turn is a bet on how greedy to be."),
    ("Design work",
     "Bird reference came from birdsoftheworld.org. Most of my contribution was integrating the "
     "visual design with the components so the two reinforced each other rather than the art being "
     "decoration on top of a ruleset."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-bird-cards.jpg', 'Board and bird cards'),
    ('02-cover.jpg', 'Cover'),
    ],
  },
  "youtube": None, "itch": None, "pdf": None, "links": [],
},

# ─────────────────────────── LEVEL DESIGN ───────────────────────────
{
  "slug": "12x16",
  "title": "12 × 16",
  "category": "Level design · Residential",
  "kind": "level",
  "cat": "design",
  "year": "2023",
  "summary": "A 12m × 16m residence for an isolated, work-from-home young adult — every essential "
             "living function on a very small plot, designed in two weeks.",
  "meta": [
    ("Role", "Solo designer"),
    ("Type", "University project"),
    ("Constraint", "12m × 16m, two weeks"),
    ("Tool", "RPG Mapmaker"),
  ],
  "tech": ["RPG Mapmaker", "Spatial design"],
  "sections": [
    ("The brief",
     "Fit sleeping, cooking, eating, sanitation and working onto a 12m × 16m plot, for someone who "
     "does all of it alone and without leaving."),
    ("The design",
     "I wrote the occupant as a landscape architect working from home, which gave the layout a "
     "reason to have opinions. There are several workspaces at different levels of privacy rather "
     "than one desk, a garden reachable from both the bedroom and the living room, and windows "
     "positioned so that every workspace has both daylight and something worth looking at."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-floor-plan.jpg', 'Floor plan', 'wide'),
    ],
  },
  "youtube": None, "itch": None, "pdf": None, "links": [],
},

{
  "slug": "1000m2",
  "title": "1000 m²",
  "category": "Level design · Residential",
  "kind": "level",
  "cat": "design",
  "year": "2023",
  "summary": "A 20m × 20m house set inside a 1000 m² site, designed so the landscape and the "
             "building are one problem rather than two.",
  "meta": [
    ("Role", "Solo designer, as landscape architect"),
    ("Type", "University project"),
    ("Constraint", "20m × 20m house, 1000 m² site"),
    ("Tool", "RPG Mapmaker"),
  ],
  "tech": ["RPG Mapmaker", "Landscape design"],
  "sections": [
    ("The brief",
     "Design the house and the ground it sits on together, with greenery integrated through the "
     "residence rather than arranged around it."),
    ("The design",
     "Every space in the house connects to the outdoors through a window. Planting is used "
     "structurally — greenery divides the living area from the kitchen instead of a wall. The site "
     "carries a basketball court and a herb island that you reach by boat, which was the piece that "
     "made the plan stop feeling like a floor plan with trees drawn on it."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-site-plan.jpg', 'Site plan', 'wide'),
    ('02-site-detail.jpg', 'Site detail', 'wide'),
    ],
  },
  "youtube": None, "itch": None, "pdf": None, "links": [],
},

{
  "slug": "pirate-adventure",
  "title": "Pirate Adventure",
  "category": "Level design · Open world",
  "kind": "level",
  "cat": "design",
  "year": "2023",
  "summary": "A 150m × 150m pirate-themed map. Overthrown as Pirate King, your ship destroyed, you "
             "wake up rescued by an islander with 24 hours to take the throne back.",
  "meta": [
    ("Role", "Solo designer"),
    ("Type", "University project"),
    ("Scale", "150m × 150m"),
    ("Tool", "RPG Mapmaker"),
  ],
  "tech": ["RPG Mapmaker", "Level design", "Environmental storytelling"],
  "sections": [
    ("The premise",
     "A 24-hour clock to gather your scattered crew, collect what you need, and infiltrate the "
     "pirate base that's now holding your throne."),
    ("Pacing and guidance",
     "I drafted intensity curves before building, to plan where the map should push and where it "
     "should let up. Routes are optional — players choose their own order — but blockages, hazards "
     "and height changes steer exploration without walling anything off."),
    ("Environmental storytelling",
     "The world tells you what it is through its buildings: a restaurant shaped like a ship, a town "
     "hall shaped like a skull. It sets the tone without a line of dialogue."),
    ("What I took from it",
     "Drafting the intensity curve first was the lesson. Planning the shape of the experience before "
     "placing a single object made everything downstream easier — and the parts of the map I built "
     "before doing that are the parts that needed reworking."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-the-map.jpg', 'The full 150m × 150m map', 'wide'),
    ('02-annotated-detail.jpg', 'Annotated detail', 'wide'),
    ],
  },
  "youtube": None, "itch": None, "pdf": None, "links": [],
},

{
  "slug": "swinging-skyway",
  "title": "Swinging Skyway",
  "category": "Level design · Platformer",
  "kind": "level",
  "cat": "design",
  "year": "2023",
  "summary": "An easy-difficulty side-scrolling level built around a Spider-Man-style swinging "
             "mechanic, set in a burning city.",
  "meta": [
    ("Role", "Solo designer"),
    ("Type", "University project"),
    ("Length", "Minimum 8 screens"),
    ("Tool", "Megaman Maker"),
  ],
  "tech": ["Megaman Maker", "Level design", "Difficulty pacing"],
  "sections": [
    ("Teaching the mechanic",
     "The level introduces swinging somewhere a mistake costs nothing, then escalates. Once the "
     "player trusts the momentum, new elements get layered on — so the difficulty comes from "
     "combining things they already understand rather than from new rules."),
    ("Set dressing",
     "Skyscrapers and burning buildings throughout, with background variation to keep eight screens "
     "of the same theme from reading as one repeated screen."),
    ("What I took from it",
     "Difficulty progression and visual coherence are the same problem. Incremental challenge only "
     "reads as fair if the environment stays consistent enough that the player can tell what's new."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-level-and-cadence.jpg', 'Level layout and intensity curve', 'wide'),
    ],
  },
  "youtube": None, "itch": None, "pdf": None, "links": [],
},

{
  "slug": "portal-planet",
  "title": "Portal Planet",
  "category": "Level design · Platformer",
  "kind": "level",
  "cat": "design",
  "year": "2023",
  "summary": "NEEDS_YOUR_WORDS — a teleport-driven platforming level built around a repeating "
             "traversal cadence.",
  "meta": [
    ("Role", "Solo designer"),
    ("Type", "University project"),
    ("Tool", "Megaman Maker"),
  ],
  "tech": ["Megaman Maker", "Level design"],
  "sections": [
    ("About this level",
     "NEEDS_YOUR_WORDS — the old Weebly page for this project was still lorem ipsum, so there's "
     "nothing here to carry over. Replace this section in tools/projects_data.py with a few "
     "sentences on what the level does and what you learned building it."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-level-and-cadence.jpg', 'Level layout and intensity curve', 'wide'),
    ],
  },
  "youtube": None, "itch": None, "pdf": None, "links": [],
},

{
  "slug": "bouncy-balloon",
  "title": "Bouncy Balloon",
  "category": "Level design · Platformer",
  "kind": "level",
  "cat": "design",
  "year": "2023",
  "summary": "NEEDS_YOUR_WORDS — a vertical platforming level built around a single bounce mechanic.",
  "meta": [
    ("Role", "Solo designer"),
    ("Type", "University project"),
    ("Tool", "Megaman Maker"),
  ],
  "tech": ["Megaman Maker", "Level design"],
  "sections": [
    ("About this level",
     "NEEDS_YOUR_WORDS — the old Weebly page for this project was still lorem ipsum, so there's "
     "nothing here to carry over. Replace this section in tools/projects_data.py with a few "
     "sentences on what the level does and what you learned building it."),
  ],
  "media": {
    "cover": 'cover.jpg',
    "video": False,
    "logo": 'logo.png',
    "gallery": [
    ('01-level-and-cadence.jpg', 'Level layout and intensity curve', 'wide'),
    ],
  },
  "youtube": "EXBzT5mT8F4", "itch": None, "pdf": None, "links": [],
},

]
