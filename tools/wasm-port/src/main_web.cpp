//==============================================================================
//  WebAssembly entry point.
//
//  This is Clifford's main.cpp with two changes, and nothing else:
//    1. the window is a GLFW/WebGL canvas instead of an sf::RenderWindow;
//    2. the while(window.isOpen()) loop is handed to the browser through
//       emscripten_set_main_loop, because a web page cannot block in a loop.
//
//  Every global, every system and the whole per-frame sequence below are his.
//==============================================================================

#include <iostream>
#include <array>
#include <vector>
#include <SFML/Graphics.hpp>
#include <GLFW/glfw3.h>
#include <emscripten.h>
#include <emscripten/html5.h>
#include <sys/stat.h>
#include <cstdio>
#include <stdexcept>
#include <unistd.h>

#include "imgui.h"
#include "imgui-SFML.h"
#include "Editor.h"
#include "Utility.h"
#include "Vector2D.h"
#include "Factory.h"
#include "Loader.h"
#include "Camera.h"
#include "Grid.h"

GLFWwindow* g_window = nullptr;

namespace sf { void shimPushEvent(const Event& e); }

Vec2 winSize = { 1600.f, 900.f };
float ratio = winSize.x / winSize.y;
Vec2 minimapOffset;
Vec2 mapSize;
std::string winTitle = "Multi-Agent Pathfinding";
bool isFullscreen = false;
bool canZoom = true;
bool isPaused = false;
float dt = 0.f;
DrawMode mode = DrawMode::WALL;
extern RepulsionConfig rConfig;
extern PotentialConfig pConfig;

sf::RenderWindow window(sf::VideoMode((unsigned int)winSize.x, (unsigned int)winSize.y),
                        winTitle, sf::Style::Titlebar | sf::Style::Close);
sf::Font font;
sf::View view(winSize / 2.f, winSize);
sf::View minimap(mapSize / 2.f, mapSize);

float cellSize = 100.f;
Editor editor;
Factory factory;
Grid grid(25, 50, cellSize);
Loader loader;
Camera camera;

bool isLMousePressed{ false }, isRMousePressed{ false };
bool canExit = false;
Vec2 target{};

static sf::Clock g_clock;

// ---------------------------------------------------------------------------
//  GLFW -> SFML event translation.
//  Installed before ImGui's own callbacks so ImGui chains into these.
// ---------------------------------------------------------------------------
static bool imguiWantsMouse() {
    return ImGui::GetCurrentContext() && ImGui::GetIO().WantCaptureMouse;
}

static void onMouseButton(GLFWwindow* w, int button, int action, int) {
    if (imguiWantsMouse()) return;
    double x, y;
    glfwGetCursorPos(w, &x, &y);

    sf::Event e;
    e.type = (action == GLFW_PRESS) ? sf::Event::MouseButtonPressed
                                    : sf::Event::MouseButtonReleased;
    e.mouseButton.button = (button == GLFW_MOUSE_BUTTON_RIGHT) ? sf::Mouse::Right
                                                               : sf::Mouse::Left;
    e.mouseButton.x = (int)x;
    e.mouseButton.y = (int)y;
    sf::shimPushEvent(e);
}

static void onCursorPos(GLFWwindow*, double x, double y) {
    sf::Event e;
    e.type = sf::Event::MouseMoved;
    e.mouseMove.x = (int)x;
    e.mouseMove.y = (int)y;
    sf::shimPushEvent(e);
}

static void onScroll(GLFWwindow*, double, double yoff) {
    if (imguiWantsMouse()) return;
    sf::Event e;
    e.type = sf::Event::MouseWheelScrolled;
    e.mouseWheelScroll.wheel = sf::Mouse::VerticalWheel;
    e.mouseWheelScroll.delta = (float)yoff;
    sf::shimPushEvent(e);
}

// ---------------------------------------------------------------------------
//  One frame — the body of his while loop, verbatim apart from the fullscreen
//  branch (a browser tab has no window to recreate).
// ---------------------------------------------------------------------------
static void frameBody();

static void frame() {
    // A throw that escapes into emscripten's main loop surfaces in the console
    // as a bare pointer, which tells you nothing. Catch it here and say what
    // it was, once, then stop the loop rather than spamming every frame.
    try {
        frameBody();
    } catch (const std::exception& e) {
        std::fprintf(stderr, "[frame] exception: %s\n", e.what());
        emscripten_cancel_main_loop();
    } catch (...) {
        std::fprintf(stderr, "[frame] unknown exception\n");
        emscripten_cancel_main_loop();
    }
}

static void frameBody() {
    dt = g_clock.restart().asSeconds();
    sf::Event event;

    if (grid.isExitFound()) {
        grid.updateHeatMap(grid.getWorldPos(grid.exitCell->pos));
        grid.CombineMaps();
        grid.generateFlowField();

        for (Enemy* enemy : factory.getEntities<Enemy>())
            enemy->setTargetPos(grid.getWorldPos(grid.exitCell->pos), true);
    } else {
        grid.updateHeatMap();

        if (rConfig.useRepulsionMap) {
            grid.updateRepulsionMap(rConfig.radius, 1.f);
            for (Enemy* enemy : factory.getEntities<Enemy>())
                grid.updateRepulsionMap(grid.getGridPos(enemy->pos), rConfig.radius, 1.f);
        }

        if (pConfig.usePotentialField)
            grid.updatePotentialMap();

        grid.CombineMaps();
        grid.generateFlowField();
    }

    while (window.pollEvent(event)) {
        ImGui::SFML::ProcessEvent(event);

        if (event.type == sf::Event::MouseWheelScrolled &&
            event.mouseWheelScroll.wheel == sf::Mouse::VerticalWheel) {
            // Ctrl is the desktop gesture; on a trackpad-only visitor a plain
            // wheel is the only zoom they have, so accept either.
            if (event.mouseWheelScroll.delta > 0.f)
                view.zoom(1.f - CAM_ZOOM);
            else
                view.zoom(1.f + CAM_ZOOM);
        }

        if (event.type == sf::Event::MouseButtonPressed &&
            event.mouseButton.button == sf::Mouse::Left) {
            isLMousePressed = true;
            Vec2 t = window.mapPixelToCoords(sf::Mouse::getPosition(window));
            grid.setIntensity(grid.getGridPos(t));
            if (mode == DrawMode::ENTITY)
                factory.cloneEnemyAt(t);

            if (!grid.isWall(grid.getGridPos(t)) && mode == DrawMode::GOAL)
                for (Enemy* enemy : factory.getEntities<Enemy>())
                    enemy->setTargetPos(t, true);
        }

        if (event.type == sf::Event::MouseButtonPressed &&
            event.mouseButton.button == sf::Mouse::Right) {
            isRMousePressed = true;
            Vec2 t = window.mapPixelToCoords(sf::Mouse::getPosition(window));
            grid.setIntensity(grid.getGridPos(t));

            if (mode == DrawMode::ENTITY)
                for (Enemy* enemy : factory.getEntities<Enemy>())
                    if (grid.getGridPos(t) == grid.getGridPos(enemy->pos))
                        factory.destroyEntity<Enemy>(enemy);

            if (!grid.isWall(grid.getGridPos(t)) && mode == DrawMode::GOAL)
                grid.setExit(grid.getGridPos(t));
        }

        if (event.type == sf::Event::MouseMoved && isRMousePressed) {
            Vec2 t = window.mapPixelToCoords(sf::Mouse::getPosition(window));
            if (mode == DrawMode::WALL)
                grid.setWall(grid.getGridPos(t), false);
        }

        if (event.type == sf::Event::MouseMoved && isLMousePressed) {
            Vec2 t = window.mapPixelToCoords(sf::Mouse::getPosition(window));
            if (mode == DrawMode::WALL)
                grid.setWall(grid.getGridPos(t), true);
        }

        if (event.type == sf::Event::MouseButtonReleased)
            isLMousePressed = isRMousePressed = false;
    }

    if (sf::Keyboard::isKeyPressed(sf::Keyboard::W)) view.move({ 0.f, -1.f * CAM_MOVE });
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::A)) view.move({ -1.f * CAM_MOVE, 0.f });
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::S)) view.move({ 0.f, 1.f * CAM_MOVE });
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::D)) view.move({ 1.f * CAM_MOVE, 0.f });

    ImGui::SFML::Update(window, sf::seconds(dt));
    window.clear(gridColors().at("Background").first);
    editor.createDockspace();

    int width = grid.getWidth();
    int height = grid.getHeight();
    float gridLength = std::max(height * ratio, width * 1.f) * cellSize;

    mapSize = { gridLength, gridLength / ratio };
    minimapOffset = { (mapSize.x - width * cellSize) / 2.f,
                      (mapSize.y - height * cellSize) / 2.f };
    minimap.setCenter(mapSize / 2.f);
    minimap.setSize(mapSize);

    window.setView(view);
    editor.update();
    factory.update();

    window.setView(minimap);
    sf::RectangleShape rectangle;
    float stroke = 20.f;

    rectangle.setSize(mapSize);
    rectangle.setFillColor(gridColors().at("Background").first);
    window.draw(rectangle);
    window.setView(view);
    camera.flushDrawQueue();

    window.setView(minimap);
    rectangle.setSize({ mapSize.x - stroke * 2.f, mapSize.y - stroke * 2.f });
    rectangle.setPosition({ stroke, stroke });
    rectangle.setFillColor(sf::Color::Transparent);
    rectangle.setOutlineThickness(stroke);
    rectangle.setOutlineColor(sf::Color::White);
    window.draw(rectangle);

    rectangle.setSize(view.getSize());
    rectangle.setPosition(view.getCenter() - winSize / 2.f + minimapOffset +
                          (winSize - view.getSize()) / 2.f);
    rectangle.setFillColor(gridColors().at("Translucent").first);
    rectangle.setOutlineThickness(0.f);
    window.draw(rectangle);
    window.setView(view);

    // paint the frame
    int fbw, fbh;
    glfwGetFramebufferSize(g_window, &fbw, &fbh);
    glViewport(0, 0, fbw, fbh);
    sf::Color bg = window.shimClearColor();
    glClearColor(bg.r / 255.f, bg.g / 255.f, bg.b / 255.f, 1.f);
    glClear(GL_COLOR_BUFFER_BIT);

    ImGui::SFML::Render(window);
    glfwSwapBuffers(g_window);
    glfwPollEvents();
}

// ---------------------------------------------------------------------------
int main() {
    srand((unsigned)time(0));

    // The project reads "../Assets/...", so put the preloaded tree at /Assets
    // and run from a sibling directory.
    mkdir("/app", 0777);
    chdir("/app");

    if (!glfwInit()) {
        std::cerr << "glfwInit failed\n";
        return 1;
    }
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 0);
    glfwWindowHint(GLFW_CLIENT_API, GLFW_OPENGL_ES_API);

    // Fixed internal resolution, CSS-scaled by the page. The editor layout was
    // authored against a 1600x900 desktop window; at the embed's real pixel
    // width the panels would eat half the view, so render at a comfortable
    // size and let the browser scale the canvas down.
    const double cw = 1280, ch = 800;
    winSize = { (float)cw, (float)ch };
    ratio = winSize.x / winSize.y;

    g_window = glfwCreateWindow((int)cw, (int)ch, winTitle.c_str(), nullptr, nullptr);
    if (!g_window) {
        std::cerr << "glfwCreateWindow failed\n";
        return 1;
    }
    glfwMakeContextCurrent(g_window);

    glfwSetMouseButtonCallback(g_window, onMouseButton);
    glfwSetCursorPosCallback(g_window, onCursorPos);
    glfwSetScrollCallback(g_window, onScroll);

    view = sf::View(winSize / 2.f, winSize);

    font.loadFromFile("../Assets/Fonts/PoorStoryRegular.ttf");
    minimap.setViewport(sf::FloatRect(0.75f, 0.0208f, 0.25f, 0.25f));

    try {
        factory.init();
        editor.init();
    } catch (const std::exception& e) {
        std::fprintf(stderr, "[init] exception: %s\n", e.what());
        return 1;
    }

    g_clock.restart();
    emscripten_set_main_loop(frame, 0, 1);
    return 0;
}
