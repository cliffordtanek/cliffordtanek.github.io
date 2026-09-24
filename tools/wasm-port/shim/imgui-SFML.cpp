#include "imgui-SFML.h"
#include "imgui_impl_glfw.h"
#include "imgui_impl_opengl3.h"
#include <GLFW/glfw3.h>

extern GLFWwindow* g_window;

namespace ImGui {
namespace SFML {

bool Init(sf::RenderWindow&) {
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui::StyleColorsDark();

    ImGuiIO& io = ImGui::GetIO();
    // Ship the docked layout Clifford actually works in, rather than letting
    // every panel pile up in the top-left corner. It is preloaded read-mostly;
    // ImGui may rewrite it in MEMFS, which simply evaporates on reload.
    io.IniFilename = "/Assets/layout.ini";

    ImGui_ImplGlfw_InitForOpenGL(g_window, true);
    ImGui_ImplOpenGL3_Init("#version 300 es");
    return true;
}

// GLFW's own callbacks already feed ImGui (installed above), so the SFML
// event pump has nothing left to forward.
void ProcessEvent(const sf::Event&) {}

void Update(sf::RenderWindow&, sf::Time dt) {
    ImGuiIO& io = ImGui::GetIO();
    float seconds = dt.asSeconds();
    if (seconds <= 0.f) seconds = 1.f / 60.f;
    io.DeltaTime = seconds;

    ImGui_ImplOpenGL3_NewFrame();
    ImGui_ImplGlfw_NewFrame();
    ImGui::NewFrame();
}

void Render(sf::RenderWindow&) {
    ImGui::Render();
    ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
}

void Shutdown() {
    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();
}

void UpdateFontTexture() {
    ImGui_ImplOpenGL3_DestroyFontsTexture();
    ImGui_ImplOpenGL3_CreateFontsTexture();
}

} // namespace SFML
} // namespace ImGui
