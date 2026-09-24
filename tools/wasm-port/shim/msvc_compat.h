// MSVC-only calls the project uses, mapped onto their POSIX equivalents.
#pragma once
#include <ctime>

// MSVC: errno_t localtime_s(struct tm* result, const time_t* time)
// POSIX: struct tm* localtime_r(const time_t* time, struct tm* result)
inline int localtime_s(std::tm* result, const std::time_t* time) {
    return localtime_r(time, result) ? 0 : -1;
}
