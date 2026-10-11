#pragma once

#include "Tokenizer.h"
#include <vector>
#include <cstdint>

struct KGram {
    uint64_t hash;
    int lineStart;
    int lineEnd;
};

struct Fingerprint {
    uint64_t hash;
    int lineStart;
    int lineEnd;
};

class Fingerprinter {
public:
    static std::vector<KGram> generateKGrams(const std::vector<Token>& tokens, int k);
    static std::vector<Fingerprint> winnow(const std::vector<KGram>& kgrams, int w);
    static std::vector<Fingerprint> process(const std::vector<Token>& tokens, int k, int w);
};
