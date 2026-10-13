#include "Normalizer.h"
#include <unordered_map>

std::vector<Token> Normalizer::normalizeIdentifiers(const std::vector<Token>& tokens) {
    std::vector<Token> normalized = tokens;
    // Map tracks first-appearance identifier placeholders per scope/function to defeat variable renaming.
    std::unordered_map<std::string, std::string> identifierMap;
    int varCounter = 1;
    int braceDepth = 0;

    for (auto& token : normalized) {
        if (token.type == TokenType::PUNCTUATION) {
            if (token.value == "{") {
                braceDepth++;
            } else if (token.value == "}") {
                braceDepth--;
                if (braceDepth <= 0) {
                    braceDepth = 0;
                    // Reset identifier mapping at the end of each top-level scope / function
                    // so function reordering across files doesn't offset variable placeholders.
                    identifierMap.clear();
                    varCounter = 1;
                }
            }
        } else if (token.type == TokenType::IDENTIFIER) {
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
