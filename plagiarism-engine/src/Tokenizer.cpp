#include "Tokenizer.h"
#include <unordered_set>
#include <cctype>

std::string tokenTypeToString(TokenType type) {
    switch (type) {
        case TokenType::KEYWORD:        return "KEYWORD";
        case TokenType::IDENTIFIER:     return "IDENTIFIER";
        case TokenType::NUMBER:         return "NUMBER";
        case TokenType::STRING_LITERAL: return "STRING_LITERAL";
        case TokenType::OPERATOR:       return "OPERATOR";
        case TokenType::PUNCTUATION:    return "PUNCTUATION";
    }
    return "UNKNOWN";
}

namespace {

const std::unordered_set<std::string> CPP_KEYWORDS = {
    "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand", "bitor",
    "bool", "break", "case", "catch", "char", "char8_t", "char16_t", "char32_t",
    "class", "compl", "concept", "const", "consteval", "constexpr", "constinit",
    "const_cast", "continue", "co_await", "co_return", "co_yield", "decltype",
    "default", "delete", "do", "double", "dynamic_cast", "else", "enum",
    "explicit", "export", "extern", "false", "float", "for", "friend", "goto",
    "if", "inline", "int", "long", "mutable", "namespace", "new", "noexcept",
    "not", "not_eq", "nullptr", "operator", "or", "or_eq", "private",
    "protected", "public", "reflexpr", "register", "reinterpret_cast", "requires",
    "return", "short", "signed", "sizeof", "static", "static_assert", "static_cast",
    "struct", "switch", "template", "this", "thread_local", "throw", "true",
    "try", "typedef", "typeid", "typename", "union", "unsigned", "using",
    "virtual", "void", "volatile", "wchar_t", "while", "xor", "xor_eq",
    "size_t", "string"
};

const std::unordered_set<std::string> THREE_CHAR_OPS = {
    "<<=", ">>=", "->*"
};

const std::unordered_set<std::string> TWO_CHAR_OPS = {
    "==", "!=", "<=", ">=", "&&", "||", "++", "--",
    "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
    "<<", ">>", "->", "::", ".*"
};

const std::string ONE_CHAR_OPS = "+-*/%=<>!&|^~?:.";
const std::string PUNCTUATION_CHARS = "{}()[];,";

} // namespace

std::vector<Token> Tokenizer::tokenize(const std::string& source) {
    std::vector<Token> tokens;
    const size_t len = source.size();
    size_t i = 0;
    int line = 1;

    while (i < len) {
        char c = source[i];

        if (c == '\n') {
            line++;
            i++;
            continue;
        }

        if (std::isspace(static_cast<unsigned char>(c))) {
            i++;
            continue;
        }

        // Single-line comment
        if (c == '/' && i + 1 < len && source[i + 1] == '/') {
            i += 2;
            while (i < len && source[i] != '\n') {
                i++;
            }
            continue;
        }

        // Multi-line comment
        if (c == '/' && i + 1 < len && source[i + 1] == '*') {
            i += 2;
            while (i + 1 < len && !(source[i] == '*' && source[i + 1] == '/')) {
                if (source[i] == '\n') {
                    line++;
                }
                i++;
            }
            if (i + 1 < len) {
                i += 2; // consume closing */
            } else {
                i = len;
            }
            continue;
        }

        // Preprocessor directives (#include, #define, etc.) - stripped like comments
        if (c == '#') {
            i++;
            while (i < len && source[i] != '\n') {
                if (source[i] == '\\' && i + 1 < len && source[i + 1] == '\n') {
                    line++;
                    i += 2;
                } else {
                    i++;
                }
            }
            continue;
        }

        // String and character literals: treated as an opaque token placeholder
        // so textual differences in messages/prompts do not affect code structure matching.
        if (c == '"' || c == '\'') {
            int tokenLine = line;
            char quote = c;
            i++;
            while (i < len && source[i] != quote) {
                if (source[i] == '\\' && i + 1 < len) {
                    if (source[i + 1] == '\n') {
                        line++;
                    }
                    i += 2;
                } else {
                    if (source[i] == '\n') {
                        line++;
                    }
                    i++;
                }
            }
            if (i < len && source[i] == quote) {
                i++;
            }
            tokens.push_back({TokenType::STRING_LITERAL, "<STR>", tokenLine});
            continue;
        }

        // Numbers (decimal, hex, binary, float)
        if (std::isdigit(static_cast<unsigned char>(c)) ||
            (c == '.' && i + 1 < len && std::isdigit(static_cast<unsigned char>(source[i + 1])))) {
            int tokenLine = line;
            size_t start = i;
            if (c == '0' && i + 1 < len && (source[i + 1] == 'x' || source[i + 1] == 'X')) {
                i += 2;
                while (i < len && (std::isxdigit(static_cast<unsigned char>(source[i])) || source[i] == '\'')) {
                    i++;
                }
            } else if (c == '0' && i + 1 < len && (source[i + 1] == 'b' || source[i + 1] == 'B')) {
                i += 2;
                while (i < len && (source[i] == '0' || source[i] == '1' || source[i] == '\'')) {
                    i++;
                }
            } else {
                while (i < len && (std::isdigit(static_cast<unsigned char>(source[i])) || source[i] == '.' || source[i] == '\'')) {
                    i++;
                }
                if (i < len && (source[i] == 'e' || source[i] == 'E')) {
                    i++;
                    if (i < len && (source[i] == '+' || source[i] == '-')) {
                        i++;
                    }
                    while (i < len && std::isdigit(static_cast<unsigned char>(source[i]))) {
                        i++;
                    }
                }
            }
            // Suffixes (e.g. u, l, ll, f)
            while (i < len && (std::isalpha(static_cast<unsigned char>(source[i])) || source[i] == '_')) {
                i++;
            }
            tokens.push_back({TokenType::NUMBER, source.substr(start, i - start), tokenLine});
            continue;
        }

        // Identifiers and Keywords
        if (std::isalpha(static_cast<unsigned char>(c)) || c == '_') {
            int tokenLine = line;
            size_t start = i;
            while (i < len && (std::isalnum(static_cast<unsigned char>(source[i])) || source[i] == '_')) {
                i++;
            }
            std::string word = source.substr(start, i - start);
            if (CPP_KEYWORDS.find(word) != CPP_KEYWORDS.end()) {
                tokens.push_back({TokenType::KEYWORD, word, tokenLine});
            } else {
                tokens.push_back({TokenType::IDENTIFIER, word, tokenLine});
            }
            continue;
        }

        // Punctuation
        if (PUNCTUATION_CHARS.find(c) != std::string::npos) {
            tokens.push_back({TokenType::PUNCTUATION, std::string(1, c), line});
            i++;
            continue;
        }

        // Operators: greedily match 3-char, then 2-char, then 1-char
        if (i + 2 < len) {
            std::string op3 = source.substr(i, 3);
            if (THREE_CHAR_OPS.find(op3) != THREE_CHAR_OPS.end()) {
                tokens.push_back({TokenType::OPERATOR, op3, line});
                i += 3;
                continue;
            }
        }

        if (i + 1 < len) {
            std::string op2 = source.substr(i, 2);
            if (TWO_CHAR_OPS.find(op2) != TWO_CHAR_OPS.end()) {
                tokens.push_back({TokenType::OPERATOR, op2, line});
                i += 2;
                continue;
            }
        }

        if (ONE_CHAR_OPS.find(c) != std::string::npos) {
            tokens.push_back({TokenType::OPERATOR, std::string(1, c), line});
            i++;
            continue;
        }

        // Advance past unhandled characters (e.g. stray symbols)
        i++;
    }

    return tokens;
}
