// =============================================================================
//  SFML shim implementation — GLFW for input, ImGui draw lists for output.
// =============================================================================
#include <SFML/Graphics.hpp>
#include "imgui.h"
#include <GLFW/glfw3.h>
#include <deque>

extern GLFWwindow* g_window;   // owned by main_web.cpp

namespace sf {

// ------------------------------------------------------------ Color statics
const Color Color::Black(0, 0, 0);
const Color Color::White(255, 255, 255);
const Color Color::Red(255, 0, 0);
const Color Color::Green(0, 255, 0);
const Color Color::Blue(0, 0, 255);
const Color Color::Yellow(255, 255, 0);
const Color Color::Magenta(255, 0, 255);
const Color Color::Cyan(0, 255, 255);
const Color Color::Transparent(0, 0, 0, 0);

static inline ImU32 toIm(const Color& c) {
    return IM_COL32(c.r, c.g, c.b, c.a);
}

// -------------------------------------------------------------------- Clock
Clock::Clock() : m_start(glfwGetTime()) {}
Time Clock::getElapsedTime() const {
    return Time(static_cast<float>(glfwGetTime() - m_start));
}
Time Clock::restart() {
    double now = glfwGetTime();
    float  dt  = static_cast<float>(now - m_start);
    m_start = now;
    return Time(dt);
}

// ---------------------------------------------------------------- VideoMode
VideoMode VideoMode::getDesktopMode() {
    int w = 1600, h = 900;
    if (g_window) glfwGetWindowSize(g_window, &w, &h);
    return VideoMode((unsigned)w, (unsigned)h);
}

// ------------------------------------------------------------- input state
// GLFW key codes for the subset the project queries.
static int glfwKeyFor(Keyboard::Key k) {
    switch (k) {
        case Keyboard::A: return GLFW_KEY_A;
        case Keyboard::D: return GLFW_KEY_D;
        case Keyboard::S: return GLFW_KEY_S;
        case Keyboard::W: return GLFW_KEY_W;
        case Keyboard::LControl: return GLFW_KEY_LEFT_CONTROL;
        case Keyboard::RControl: return GLFW_KEY_RIGHT_CONTROL;
        case Keyboard::LShift: return GLFW_KEY_LEFT_SHIFT;
        case Keyboard::Space: return GLFW_KEY_SPACE;
        case Keyboard::Escape: return GLFW_KEY_ESCAPE;
        case Keyboard::F11: return GLFW_KEY_F11;
        default: break;
    }
    if (k >= Keyboard::A && k <= Keyboard::Z)
        return GLFW_KEY_A + (k - Keyboard::A);
    if (k >= Keyboard::Num0 && k <= Keyboard::Num9)
        return GLFW_KEY_0 + (k - Keyboard::Num0);
    return GLFW_KEY_UNKNOWN;
}

bool Keyboard::isKeyPressed(Key key) {
    if (!g_window) return false;
    // While ImGui wants the keyboard (a text field is focused) the camera
    // should not pan — same reflex as not zooming inside a dropdown.
    if (ImGui::GetCurrentContext() && ImGui::GetIO().WantCaptureKeyboard) return false;
    int gk = glfwKeyFor(key);
    if (gk == GLFW_KEY_UNKNOWN) return false;
    return glfwGetKey(g_window, gk) == GLFW_PRESS;
}

Vector2i Mouse::getPosition() {
    double x = 0, y = 0;
    if (g_window) glfwGetCursorPos(g_window, &x, &y);
    return Vector2i((int)x, (int)y);
}
Vector2i Mouse::getPosition(const RenderWindow&) { return getPosition(); }

// -------------------------------------------------------------- event queue
// main_web.cpp translates GLFW callbacks into SFML events and pushes here.
static std::deque<Event> g_events;
void shimPushEvent(const Event& e) { g_events.push_back(e); }

bool RenderWindow::pollEvent(Event& event) {
    if (g_events.empty()) return false;
    event = g_events.front();
    g_events.pop_front();
    return true;
}

// ------------------------------------------------------------- RenderWindow
RenderWindow::RenderWindow(VideoMode mode, const std::string&, Uint32) {
    m_view = View(Vector2f(mode.width / 2.f, mode.height / 2.f),
                  Vector2f((float)mode.width, (float)mode.height));
}

void RenderWindow::create(VideoMode mode, const std::string&, Uint32) {
    m_open = true;
    m_view = View(Vector2f(mode.width / 2.f, mode.height / 2.f),
                  Vector2f((float)mode.width, (float)mode.height));
}

Vector2u RenderWindow::getSize() const {
    int w = 1600, h = 900;
    if (g_window) glfwGetWindowSize(g_window, &w, &h);
    return Vector2u((unsigned)w, (unsigned)h);
}

View RenderWindow::getDefaultView() const {
    Vector2u s = getSize();
    return View(Vector2f(s.x / 2.f, s.y / 2.f), Vector2f((float)s.x, (float)s.y));
}

void RenderWindow::clear(const Color& c) { m_clear = c; }

// world -> screen pixels, through the active view and its viewport
Vector2f RenderWindow::shimWorldToScreen(const Vector2f& w) const {
    const Vector2u win = getSize();
    const FloatRect vp = m_view.getViewport();
    const Vector2f  c  = m_view.getCenter();
    const Vector2f  sz = m_view.getSize();

    const float vpx = vp.left * win.x;
    const float vpy = vp.top  * win.y;
    const float vpw = vp.width  * win.x;
    const float vph = vp.height * win.y;

    const float nx = (w.x - (c.x - sz.x / 2.f)) / sz.x;
    const float ny = (w.y - (c.y - sz.y / 2.f)) / sz.y;
    return Vector2f(vpx + nx * vpw, vpy + ny * vph);
}

Vector2f RenderWindow::mapPixelToCoords(const Vector2i& p, const View& view) const {
    const Vector2u win = getSize();
    const FloatRect vp = view.getViewport();
    const Vector2f  c  = view.getCenter();
    const Vector2f  sz = view.getSize();

    const float vpx = vp.left * win.x;
    const float vpy = vp.top  * win.y;
    const float vpw = vp.width  * win.x;
    const float vph = vp.height * win.y;

    const float nx = (p.x - vpx) / (vpw != 0.f ? vpw : 1.f);
    const float ny = (p.y - vpy) / (vph != 0.f ? vph : 1.f);
    return Vector2f(c.x - sz.x / 2.f + nx * sz.x,
                    c.y - sz.y / 2.f + ny * sz.y);
}

Vector2f RenderWindow::mapPixelToCoords(const Vector2i& p) const {
    return mapPixelToCoords(p, m_view);
}

Vector2i RenderWindow::mapCoordsToPixel(const Vector2f& p) const {
    Vector2f s = shimWorldToScreen(p);
    return Vector2i((int)s.x, (int)s.y);
}

void RenderWindow::shimPushClip() const {
    const Vector2u win = getSize();
    const FloatRect vp = m_view.getViewport();
    ImDrawList* dl = ImGui::GetBackgroundDrawList();
    dl->PushClipRect(ImVec2(vp.left * win.x, vp.top * win.y),
                     ImVec2((vp.left + vp.width) * win.x,
                            (vp.top + vp.height) * win.y),
                     true);
}
void RenderWindow::shimPopClip() const {
    ImGui::GetBackgroundDrawList()->PopClipRect();
}

// -------------------------------------------------------------------- Shape
void Shape::shimDraw(RenderWindow& target) const {
    const std::size_t n = getPointCount();
    if (n < 2) return;

    static std::vector<ImVec2> pts;
    pts.clear();
    pts.reserve(n);
    for (std::size_t i = 0; i < n; ++i) {
        Vector2f w = shimToWorld(getPoint(i));
        Vector2f s = target.shimWorldToScreen(w);
        pts.push_back(ImVec2(s.x, s.y));
    }

    ImDrawList* dl = ImGui::GetBackgroundDrawList();
    target.shimPushClip();

    if (getFillColor().a > 0)
        dl->AddConvexPolyFilled(pts.data(), (int)pts.size(), toIm(getFillColor()));

    if (getOutlineThickness() != 0.f && getOutlineColor().a > 0) {
        // SFML grows the outline outward from the edge; ImGui centres a
        // polyline on it. Scale the thickness into screen space so a zoomed
        // view keeps the proportions, and accept the half-thickness offset.
        Vector2f o0 = target.shimWorldToScreen(Vector2f(0.f, 0.f));
        Vector2f o1 = target.shimWorldToScreen(Vector2f(getOutlineThickness(), 0.f));
        float screenThickness = std::abs(o1.x - o0.x);
        if (screenThickness < 0.75f) screenThickness = 0.75f;
        dl->AddPolyline(pts.data(), (int)pts.size(), toIm(getOutlineColor()),
                        ImDrawFlags_Closed, screenThickness);
    }

    target.shimPopClip();
}

// -------------------------------------------------------------- VertexArray
void VertexArray::shimDraw(RenderWindow& target) const {
    if (m_vertices.size() < 2) return;
    ImDrawList* dl = ImGui::GetBackgroundDrawList();
    target.shimPushClip();

    switch (m_type) {
        case LineStrip: {
            static std::vector<ImVec2> pts;
            pts.clear();
            for (const Vertex& v : m_vertices) {
                Vector2f s = target.shimWorldToScreen(v.position);
                pts.push_back(ImVec2(s.x, s.y));
            }
            dl->AddPolyline(pts.data(), (int)pts.size(),
                            toIm(m_vertices[0].color), 0, 1.5f);
            break;
        }
        case Lines: {
            for (std::size_t i = 0; i + 1 < m_vertices.size(); i += 2) {
                Vector2f a = target.shimWorldToScreen(m_vertices[i].position);
                Vector2f b = target.shimWorldToScreen(m_vertices[i + 1].position);
                dl->AddLine(ImVec2(a.x, a.y), ImVec2(b.x, b.y),
                            toIm(m_vertices[i].color), 1.5f);
            }
            break;
        }
        default: {
            for (std::size_t i = 0; i + 2 < m_vertices.size(); i += 3) {
                Vector2f a = target.shimWorldToScreen(m_vertices[i].position);
                Vector2f b = target.shimWorldToScreen(m_vertices[i + 1].position);
                Vector2f c = target.shimWorldToScreen(m_vertices[i + 2].position);
                dl->AddTriangleFilled(ImVec2(a.x, a.y), ImVec2(b.x, b.y),
                                      ImVec2(c.x, c.y), toIm(m_vertices[i].color));
            }
            break;
        }
    }

    target.shimPopClip();
}

// --------------------------------------------------------------------- Text
void Text::shimDraw(RenderWindow& target) const {
    if (m_string.empty()) return;
    Vector2f s = target.shimWorldToScreen(shimToWorld(Vector2f(0.f, 0.f)));
    ImGui::GetBackgroundDrawList()->AddText(
        ImVec2(s.x, s.y), toIm(m_color), m_string.c_str());
}

} // namespace sf
