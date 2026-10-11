#pragma once

#include <string>
#include <vector>

enum class TokenType {
    KEYWORD,
    IDENTIFIER,
    NUMBER,
    STRING_LITERAL,
    OPERATOR,
    PUNCTUATION
};

std::string tokenTypeToString(TokenType type);

struct Token {
    TokenType type;
    std::string value;
    int lineNumber;
};

class Tokenizer {
public:
    static std::vector<Token> tokenize(const std::string& source);
};
