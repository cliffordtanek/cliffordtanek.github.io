// =============================================================================
//  SFML -> WebAssembly compatibility shim
//
//  This implements only the slice of the SFML 2.x API that the AI Project
//  actually touches (see the inventory in the port notes), on top of GLFW for
//  input and Dear ImGui's draw lists for rasterisation. It is NOT a general
//  SFML implementation and makes no attempt to be one.
//
//  Why draw lists rather than raw GL: ImGui is already rendering every frame
//  through its own backend, its background draw list sits underneath ImGui
//  windows, which is exactly where the SFML content belongs, and it gives us
//  anti-aliased filled convex polygons and polylines for free.
// =============================================================================
#ifndef SFML_SHIM_GRAPHICS_HPP
#define SFML_SHIM_GRAPHICS_HPP

#include <cmath>
#include <cstdint>
#include <string>
#include <vector>
#include <algorithm>

namespace sf {

typedef unsigned char  Uint8;
typedef unsigned int   Uint32;
typedef int            Int32;

// ---------------------------------------------------------------- Vector2<T>
template <class T>
class Vector2 {
public:
    T x{}, y{};
    Vector2() = default;
    Vector2(T X, T Y) : x(X), y(Y) {}
    template <class U> explicit Vector2(const Vector2<U>& v)
        : x(static_cast<T>(v.x)), y(static_cast<T>(v.y)) {}
};

template <class T> Vector2<T> operator-(const Vector2<T>& r) { return Vector2<T>(-r.x, -r.y); }
template <class T> Vector2<T> operator+(const Vector2<T>& l, const Vector2<T>& r) { return Vector2<T>(l.x + r.x, l.y + r.y); }
template <class T> Vector2<T> operator-(const Vector2<T>& l, const Vector2<T>& r) { return Vector2<T>(l.x - r.x, l.y - r.y); }
template <class T> Vector2<T> operator*(const Vector2<T>& l, T r) { return Vector2<T>(l.x * r, l.y * r); }
template <class T> Vector2<T> operator*(T l, const Vector2<T>& r) { return Vector2<T>(r.x * l, r.y * l); }
template <class T> Vector2<T> operator/(const Vector2<T>& l, T r) { return Vector2<T>(l.x / r, l.y / r); }
template <class T> Vector2<T>& operator+=(Vector2<T>& l, const Vector2<T>& r) { l.x += r.x; l.y += r.y; return l; }
template <class T> Vector2<T>& operator-=(Vector2<T>& l, const Vector2<T>& r) { l.x -= r.x; l.y -= r.y; return l; }
template <class T> bool operator==(const Vector2<T>& l, const Vector2<T>& r) { return l.x == r.x && l.y == r.y; }
template <class T> bool operator!=(const Vector2<T>& l, const Vector2<T>& r) { return !(l == r); }

typedef Vector2<float>        Vector2f;
typedef Vector2<int>          Vector2i;
typedef Vector2<unsigned int> Vector2u;

// -------------------------------------------------------------------- Color
class Color {
public:
    Uint8 r{0}, g{0}, b{0}, a{255};
    Color() = default;
    Color(Uint8 R, Uint8 G, Uint8 B, Uint8 A = 255) : r(R), g(G), b(B), a(A) {}

    static const Color Black, White, Red, Green, Blue, Yellow,
                       Magenta, Cyan, Transparent;
};
inline bool operator==(const Color& l, const Color& r) {
    return l.r == r.r && l.g == r.g && l.b == r.b && l.a == r.a;
}
inline bool operator!=(const Color& l, const Color& r) { return !(l == r); }

// ------------------------------------------------------------------- Rect<T>
template <class T>
class Rect {
public:
    T left{}, top{}, width{}, height{};
    Rect() = default;
    Rect(T l, T t, T w, T h) : left(l), top(t), width(w), height(h) {}
    bool contains(T px, T py) const {
        return px >= left && px < left + width && py >= top && py < top + height;
    }
};
typedef Rect<float> FloatRect;
typedef Rect<int>   IntRect;

// --------------------------------------------------------------------- Time
class Time {
public:
    Time() = default;
    explicit Time(float s) : m_seconds(s) {}
    float asSeconds() const { return m_seconds; }
    Int32 asMilliseconds() const { return static_cast<Int32>(m_seconds * 1000.f); }
private:
    float m_seconds{0.f};
};
inline Time seconds(float s) { return Time(s); }

class Clock {
public:
    Clock();
    Time getElapsedTime() const;
    Time restart();
private:
    double m_start{0.0};
};

// ----------------------------------------------------------------- Drawable
class RenderWindow;
class Drawable {
public:
    virtual ~Drawable() {}
    virtual void shimDraw(RenderWindow& target) const = 0;
};

// ------------------------------------------------------------ Transformable
class Transformable {
public:
    virtual ~Transformable() {}

    void setPosition(float x, float y) { m_position = Vector2f(x, y); }
    void setPosition(const Vector2f& p) { m_position = p; }
    void setOrigin(float x, float y) { m_origin = Vector2f(x, y); }
    void setOrigin(const Vector2f& p) { m_origin = p; }
    void setRotation(float deg) { m_rotation = deg; }
    void setScale(float x, float y) { m_scale = Vector2f(x, y); }
    void setScale(const Vector2f& s) { m_scale = s; }

    void move(float x, float y) { m_position.x += x; m_position.y += y; }
    void move(const Vector2f& d) { m_position += d; }
    void rotate(float deg) { m_rotation += deg; }

    const Vector2f& getPosition() const { return m_position; }
    const Vector2f& getOrigin()   const { return m_origin; }
    const Vector2f& getScale()    const { return m_scale; }
    float           getRotation() const { return m_rotation; }

    // local point -> world point, matching SFML's
    // translate(position) * rotate(rotation) * scale(scale) * translate(-origin)
    Vector2f shimToWorld(const Vector2f& p) const {
        float lx = (p.x - m_origin.x) * m_scale.x;
        float ly = (p.y - m_origin.y) * m_scale.y;
        const float rad = m_rotation * 3.14159265358979323846f / 180.f;
        const float c = std::cos(rad), s = std::sin(rad);
        return Vector2f(m_position.x + lx * c - ly * s,
                        m_position.y + lx * s + ly * c);
    }

private:
    Vector2f m_position{0.f, 0.f};
    Vector2f m_origin{0.f, 0.f};
    Vector2f m_scale{1.f, 1.f};
    float    m_rotation{0.f};
};

// -------------------------------------------------------------------- Shape
class Shape : public Drawable, public Transformable {
public:
    void setFillColor(const Color& c) { m_fill = c; }
    void setOutlineColor(const Color& c) { m_outline = c; }
    void setOutlineThickness(float t) { m_thickness = t; }
    const Color& getFillColor() const { return m_fill; }
    const Color& getOutlineColor() const { return m_outline; }
    float getOutlineThickness() const { return m_thickness; }

    virtual std::size_t getPointCount() const = 0;
    virtual Vector2f    getPoint(std::size_t i) const = 0;

    void shimDraw(RenderWindow& target) const override;

private:
    Color m_fill{Color::White};
    Color m_outline{Color::Transparent};
    float m_thickness{0.f};
};

class RectangleShape : public Shape {
public:
    RectangleShape() = default;
    explicit RectangleShape(const Vector2f& size) : m_size(size) {}
    void setSize(const Vector2f& s) { m_size = s; }
    const Vector2f& getSize() const { return m_size; }
    std::size_t getPointCount() const override { return 4; }
    Vector2f getPoint(std::size_t i) const override {
        switch (i) {
            case 0:  return Vector2f(0.f, 0.f);
            case 1:  return Vector2f(m_size.x, 0.f);
            case 2:  return Vector2f(m_size.x, m_size.y);
            default: return Vector2f(0.f, m_size.y);
        }
    }
private:
    Vector2f m_size{0.f, 0.f};
};

class CircleShape : public Shape {
public:
    explicit CircleShape(float radius = 0.f, std::size_t points = 30)
        : m_radius(radius), m_points(points) {}
    void setRadius(float r) { m_radius = r; }
    float getRadius() const { return m_radius; }
    void setPointCount(std::size_t n) { m_points = n; }
    std::size_t getPointCount() const override { return m_points; }
    Vector2f getPoint(std::size_t i) const override {
        const float two_pi = 6.28318530717958647692f;
        float angle = static_cast<float>(i) * two_pi / static_cast<float>(m_points)
                    - two_pi * 0.25f;
        return Vector2f(m_radius + std::cos(angle) * m_radius,
                        m_radius + std::sin(angle) * m_radius);
    }
private:
    float m_radius{0.f};
    std::size_t m_points{30};
};

class ConvexShape : public Shape {
public:
    explicit ConvexShape(std::size_t count = 0) { setPointCount(count); }
    void setPointCount(std::size_t n) { m_points.resize(n); }
    void setPoint(std::size_t i, const Vector2f& p) { m_points[i] = p; }
    std::size_t getPointCount() const override { return m_points.size(); }
    Vector2f getPoint(std::size_t i) const override { return m_points[i]; }
private:
    std::vector<Vector2f> m_points;
};

// ------------------------------------------------------------- VertexArray
enum PrimitiveType {
    Points, Lines, LineStrip, Triangles, TriangleStrip, TriangleFan, Quads,
    LinesStrip = LineStrip, TrianglesStrip = TriangleStrip, TrianglesFan = TriangleFan
};

class Vertex {
public:
    Vertex() = default;
    Vertex(const Vector2f& p) : position(p) {}
    Vertex(const Vector2f& p, const Color& c) : position(p), color(c) {}
    Vector2f position{};
    Color    color{Color::White};
};

class VertexArray : public Drawable {
public:
    VertexArray() = default;
    explicit VertexArray(PrimitiveType type, std::size_t count = 0)
        : m_type(type), m_vertices(count) {}
    void append(const Vertex& v) { m_vertices.push_back(v); }
    void clear() { m_vertices.clear(); }
    std::size_t getVertexCount() const { return m_vertices.size(); }
    Vertex& operator[](std::size_t i) { return m_vertices[i]; }
    const Vertex& operator[](std::size_t i) const { return m_vertices[i]; }
    void setPrimitiveType(PrimitiveType t) { m_type = t; }
    void shimDraw(RenderWindow& target) const override;
private:
    PrimitiveType m_type{Points};
    std::vector<Vertex> m_vertices;
};

// --------------------------------------------------------------------- View
class View {
public:
    View() = default;
    View(const Vector2f& center, const Vector2f& size)
        : m_center(center), m_size(size) {}
    explicit View(const FloatRect& r)
        : m_center(r.left + r.width / 2.f, r.top + r.height / 2.f),
          m_size(r.width, r.height) {}

    void setCenter(const Vector2f& c) { m_center = c; }
    void setCenter(float x, float y) { m_center = Vector2f(x, y); }
    void setSize(const Vector2f& s) { m_size = s; }
    void setSize(float w, float h) { m_size = Vector2f(w, h); }
    void setViewport(const FloatRect& vp) { m_viewport = vp; }

    const Vector2f& getCenter() const { return m_center; }
    const Vector2f& getSize()   const { return m_size; }
    const FloatRect& getViewport() const { return m_viewport; }

    void move(const Vector2f& d) { m_center += d; }
    void move(float x, float y) { m_center.x += x; m_center.y += y; }
    void zoom(float factor) { m_size.x *= factor; m_size.y *= factor; }

private:
    Vector2f  m_center{0.f, 0.f};
    Vector2f  m_size{1000.f, 1000.f};
    FloatRect m_viewport{0.f, 0.f, 1.f, 1.f};
};

// ---------------------------------------------------------------- VideoMode
class VideoMode {
public:
    VideoMode() = default;
    VideoMode(unsigned int w, unsigned int h, unsigned int bpp = 32)
        : width(w), height(h), bitsPerPixel(bpp) {}
    static VideoMode getDesktopMode();
    unsigned int width{0}, height{0}, bitsPerPixel{32};
};

namespace Style {
    enum { None = 0, Titlebar = 1, Resize = 2, Close = 4, Fullscreen = 8,
           Default = Titlebar | Resize | Close };
}

// -------------------------------------------------------------- input enums
class Keyboard {
public:
    enum Key {
        Unknown = -1,
        A = 0, B, C, D, E, F, G, H, I, J, K, L, M,
        N, O, P, Q, R, S, T, U, V, W, X, Y, Z,
        Num0, Num1, Num2, Num3, Num4, Num5, Num6, Num7, Num8, Num9,
        Escape, LControl, LShift, LAlt, LSystem,
        RControl, RShift, RAlt, RSystem,
        Menu, LBracket, RBracket, Semicolon, Comma, Period, Quote, Slash,
        Backslash, Tilde, Equal, Hyphen, Space, Enter, Backspace, Tab,
        PageUp, PageDown, End, Home, Insert, Delete,
        Add, Subtract, Multiply, Divide,
        Left, Right, Up, Down,
        F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12,
        KeyCount
    };
    static bool isKeyPressed(Key key);
};

class Mouse {
public:
    enum Button { Left, Right, Middle, XButton1, XButton2, ButtonCount };
    enum Wheel  { VerticalWheel, HorizontalWheel };
    static Vector2i getPosition();
    static Vector2i getPosition(const RenderWindow& relativeTo);
};

// -------------------------------------------------------------------- Event
class Event {
public:
    struct SizeEvent        { unsigned int width, height; };
    struct KeyEvent         { Keyboard::Key code; bool alt, control, shift, system; };
    struct TextEvent        { Uint32 unicode; };
    struct MouseMoveEvent   { int x, y; };
    struct MouseButtonEvent { Mouse::Button button; int x, y; };
    struct MouseWheelScrollEvent { Mouse::Wheel wheel; float delta; int x, y; };

    enum EventType {
        Closed, Resized, LostFocus, GainedFocus, TextEntered,
        KeyPressed, KeyReleased, MouseWheelScrolled,
        MouseButtonPressed, MouseButtonReleased, MouseMoved,
        MouseEntered, MouseLeft, Count
    };

    EventType type{Count};
    union {
        SizeEvent             size;
        KeyEvent              key;
        TextEvent             text;
        MouseMoveEvent        mouseMove;
        MouseButtonEvent      mouseButton;
        MouseWheelScrollEvent mouseWheelScroll;
    };
    Event() : mouseWheelScroll{} {}
};

// --------------------------------------------------------------------- Font
// The project loads a font but only ever draws text inside an #if 0 block,
// so this exists to satisfy the type and nothing more.
class Font {
public:
    bool loadFromFile(const std::string&) { return true; }
};

class Text : public Drawable, public Transformable {
public:
    void setFont(const Font&) {}
    void setString(const std::string& s) { m_string = s; }
    void setCharacterSize(unsigned int s) { m_size = s; }
    void setFillColor(const Color& c) { m_color = c; }
    FloatRect getLocalBounds() const {
        return FloatRect(0.f, 0.f, m_string.size() * m_size * 0.5f, (float)m_size);
    }
    void shimDraw(RenderWindow& target) const override;
private:
    std::string  m_string;
    unsigned int m_size{30};
    Color        m_color{Color::White};
};

// ------------------------------------------------------------- RenderWindow
class RenderWindow {
public:
    RenderWindow() = default;
    RenderWindow(VideoMode mode, const std::string& title, Uint32 style = Style::Default);

    void create(VideoMode mode, const std::string& title, Uint32 style = Style::Default);
    bool isOpen() const { return m_open; }
    void close() { m_open = false; }
    void setFramerateLimit(unsigned int) {}
    void setVerticalSyncEnabled(bool) {}

    Vector2u getSize() const;
    bool pollEvent(Event& event);

    void clear(const Color& c = Color(0, 0, 0));
    void draw(const Drawable& d) { d.shimDraw(*this); }
    void display() {}

    void setView(const View& v) { m_view = v; }
    const View& getView() const { return m_view; }
    View getDefaultView() const;

    Vector2f mapPixelToCoords(const Vector2i& point) const;
    Vector2f mapPixelToCoords(const Vector2i& point, const View& view) const;
    Vector2i mapCoordsToPixel(const Vector2f& point) const;

    // --- shim internals -------------------------------------------------
    Vector2f shimWorldToScreen(const Vector2f& world) const;
    void     shimPushClip() const;   // clip to the active view's viewport
    void     shimPopClip() const;
    Color    shimClearColor() const { return m_clear; }

private:
    bool  m_open{true};
    View  m_view;
    Color m_clear{0, 0, 0};
};

} // namespace sf

#endif // SFML_SHIM_GRAPHICS_HPP
