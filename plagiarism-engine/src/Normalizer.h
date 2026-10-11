#pragma once

#include "Tokenizer.h"
#include <vector>

class Normalizer {
public:
    static std::vector<Token> normalizeIdentifiers(const std::vector<Token>& tokens);
};
