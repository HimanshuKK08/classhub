#pragma once

#include "Comparator.h"
#include <string>

class JsonWriter {
public:
    static std::string writeResult(const std::string& fileA,
                                   const std::string& fileB,
                                   int k,
                                   int w,
                                   const ComparisonResult& result);

    static std::string writeError(const std::string& errorMessage);

    static std::string escapeString(const std::string& input);
};
