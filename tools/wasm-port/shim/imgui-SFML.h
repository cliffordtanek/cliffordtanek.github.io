// =============================================================================
//  imgui-SFML shim — same five entry points the project calls, backed by the
//  official imgui_impl_glfw + imgui_impl_opengl3 backends instead of SFML.
// =============================================================================
#ifndef IMGUI_SFML_SHIM_H
#define IMGUI_SFML_SHIM_H

#include <SFML/Graphics.hpp>
#include "imgui.h"

namespace ImGui {
namespace SFML {

bool Init(sf::RenderWindow& window);
void ProcessEvent(const sf::Event& event);
void Update(sf::RenderWindow& window, sf::Time dt);
void Render(sf::RenderWindow& window);
void Shutdown();
void UpdateFontTexture();

} // namespace SFML
} // namespace ImGui

#endif // IMGUI_SFML_SHIM_H
