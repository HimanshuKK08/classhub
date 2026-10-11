#include "Normalizer.h"
#include <unordered_map>

std::vector<Token> Normalizer::normalizeIdentifiers(const std::vector<Token>& tokens) {
    std::vector<Token> normalized = tokens;
    // Map tracks first-appearance identifier placeholders per file to defeat variable renaming.
    std::unordered_map<std::string, std::string> identifierMap;
    int varCounter = 1;

    for (auto& token : normalized) {
        if (token.type == TokenType::IDENTIFIER) {
            auto it = identifierMap.find(token.value);
            if (it == identifierMap.end()) {
                std::string placeholder = "VAR" + std::to_string(varCounter++);
                identifierMap[token.value] = placeholder;
                token.value = placeholder;
            } else {
                token.value = it->second;
            }
        }
    }

    return normalized;
}
