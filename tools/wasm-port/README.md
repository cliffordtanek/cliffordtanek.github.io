# Multi-Agent Pathfinding → WebAssembly

The build embedded at `assets/demo/pathfinding/` is the Visual Studio project
(`CSD 3183 AI Project`) compiled with Emscripten. Same `Grid`, `Factory`,
`Editor`, `Loader`, `Camera` and math sources; same ImGui panels; same map
files and docked layout.

## What had to be replaced

**SFML.** There is no SFML build for Emscripten, so `shim/SFML/Graphics.hpp`
implements the slice of the API the project actually uses — 24 types, found by
grepping every `sf::` in the source. Shapes are rasterised into Dear ImGui's
background draw list rather than through GL directly: ImGui is already
rendering each frame, its background list sits underneath ImGui windows (which
is where the game view belongs), and it gives anti-aliased convex fills and
polylines for free. `Transformable::shimToWorld` reproduces SFML's
`translate(position) · rotate(rotation) · scale(scale) · translate(-origin)`
so rotated arrows land where they do on the desktop.

Nothing renders text: the only `sf::Text` in the project sits inside an
`#if 0`, so `sf::Font::loadFromFile` is a no-op that returns true.

**imgui-SFML.** Replaced by `shim/imgui-SFML.cpp`, which maps the five entry
points the project calls onto the official `imgui_impl_glfw` +
`imgui_impl_opengl3` backends, pinned to v1.90.9-docking to match the vendored
ImGui.

**The main loop.** A browser tab cannot block, so `src/main_web.cpp` hands the
body of `while (window.isOpen())` to `emscripten_set_main_loop`. The frame
body is otherwise line-for-line the original.

## Three real bugs this surfaced

These are latent on MSVC, not Emscripten quirks — worth fixing upstream.

1. **Static initialisation order.** `Grid::Grid` reads the `colors` table, but
   the global `Grid grid(25, 50, cellSize)` lives in a different translation
   unit. The C++ standard does not order those, so `colors` was still empty
   when the constructor ran and `.at("Floor")` threw before `main()` started.
   MSVC happened to order them favourably. Fixed by making the table a
   function-local static (`gridColors()` in `Grid.h`), which is initialised on
   first use by definition.

2. **`typeid(T).name()` is implementation-defined.** `addWindow` takes that
   string and trims `"class "` off the front — correct for MSVC's
   `"class ControlPanel"`, wrong for Clang's `"12ControlPanel"`, which came out
   as `"trolPanel"`. Every panel was misnamed, and the saved ImGui layout
   (keyed on the real names) stopped matching. `Editor::windowTypeName<T>()`
   now strips the Itanium length prefix when it sees one.

3. **Missing includes.** `Factory.h` uses `std::list` without including
   `<list>`; `Debug.cpp` calls the MSVC-only `localtime_s`. Both are supplied
   by the build (`-include list`, `shim/msvc_compat.h`) rather than edited into
   the source.

## Building

Needs an Emscripten SDK (3.1.6 was used here) and the vendored ImGui plus the
matching backends:

    git clone --depth 1 --branch v1.90.9-docking https://github.com/ocornut/imgui

Lay out `imgui/` (the project's vendored copy), `backends/` (from the clone),
`src/` (the project's `Source/` plus `main_web.cpp`), `shim/`, then run
`build.sh`. Output: `pathfinding.js`, `.wasm`, `.data` — about 400 KB gzipped.

The font is `PoorStoryRegular.ttf` subset to Latin with fonttools: the original
is a 4 MB Korean face and only ASCII is ever drawn, which takes it to 12 KB.
