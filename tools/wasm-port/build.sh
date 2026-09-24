#!/bin/bash
set -e
export EM_CONFIG=/tmp/claude-0/emcfg.py
INC="-Ishim -Iimgui -Ibackends -Isrc"
FLAGS="-std=c++17 -O2 -DIMGUI_IMPL_OPENGL_ES3 -include list -include algorithm -include cstring -include shim/msvc_compat.h $INC"
SRC="src/main_web.cpp src/Grid.cpp src/Editor.cpp src/Factory.cpp src/Loader.cpp \
     src/Camera.cpp src/Debug.cpp src/Ally.cpp src/Enemy.cpp src/Arrow.cpp \
     src/MathLib.cpp src/Vector2D.cpp \
     shim/sfml_shim.cpp shim/imgui-SFML.cpp \
     imgui/imgui.cpp imgui/imgui_draw.cpp imgui/imgui_tables.cpp imgui/imgui_widgets.cpp \
     backends/imgui_impl_glfw.cpp backends/imgui_impl_opengl3.cpp"
mkdir -p web
em++ $FLAGS $SRC \
  -sUSE_GLFW=3 -sUSE_WEBGL2=1 -sMIN_WEBGL_VERSION=2 -sMAX_WEBGL_VERSION=2 \
  -sFULL_ES3=1 -sALLOW_MEMORY_GROWTH=1 -sEXPORTED_RUNTIME_METHODS='["callMain"]' \
  -sDISABLE_EXCEPTION_CATCHING=0 \
  -sMODULARIZE=1 -sEXPORT_NAME=createPathfinding -sENVIRONMENT=web \
  -sEXIT_RUNTIME=0 \
  --preload-file Assets@/Assets \
  -o web/pathfinding.js
