#include "Fingerprinter.h"

namespace {

// Large prime modulus (2^31 - 1, Mersenne prime M31) and base for Rabin-Karp polynomial hashing.
constexpr uint64_t HASH_BASE = 1000003ULL;
constexpr uint64_t HASH_MOD  = 2147483647ULL;

uint64_t hashToken(const Token& token) {
    uint64_t h = 5381ULL;
    std::string repr = tokenTypeToString(token.type) + ":" + token.value;
    for (char ch : repr) {
        h = ((h << 5) + h) + static_cast<unsigned char>(ch);
    }
    return h % HASH_MOD;
}

} // namespace

std::vector<KGram> Fingerprinter::generateKGrams(const std::vector<Token>& tokens, int k) {
    std::vector<KGram> kgrams;
    if (k <= 0 || static_cast<int>(tokens.size()) < k) {
        return kgrams;
    }

    const int n = static_cast<int>(tokens.size());
    std::vector<uint64_t> tokenVals(n);
    for (int i = 0; i < n; ++i) {
        tokenVals[i] = hashToken(tokens[i]);
    }

    // Precompute HASH_BASE^(k-1) % HASH_MOD for O(1) rolling subtraction
    uint64_t powBase = 1;
    for (int i = 0; i < k - 1; ++i) {
        powBase = (powBase * HASH_BASE) % HASH_MOD;
    }

    // Compute initial window hash
    uint64_t currentHash = 0;
    for (int i = 0; i < k; ++i) {
        currentHash = (currentHash * HASH_BASE + tokenVals[i]) % HASH_MOD;
    }

    kgrams.push_back({currentHash, tokens[0].lineNumber, tokens[k - 1].lineNumber});

    // Roll the window across tokens: O(1) update per step
    for (int i = 1; i <= n - k; ++i) {
        uint64_t termToRemove = (tokenVals[i - 1] * powBase) % HASH_MOD;
        uint64_t remaining = (currentHash >= termToRemove)
                                 ? (currentHash - termToRemove)
                                 : (currentHash + HASH_MOD - termToRemove);
        currentHash = ((remaining * HASH_BASE) + tokenVals[i + k - 1]) % HASH_MOD;

        kgrams.push_back({currentHash, tokens[i].lineNumber, tokens[i + k - 1].lineNumber});
    }

    return kgrams;
}

std::vector<Fingerprint> Fingerprinter::winnow(const std::vector<KGram>& kgrams, int w) {
    std::vector<Fingerprint> fingerprints;
    if (w <= 0 || kgrams.empty()) {
        return fingerprints;
    }

    const int m = static_cast<int>(kgrams.size());

    // When fewer k-grams than window size, select global minimum
    if (m < w) {
        int minIdx = 0;
        for (int j = 1; j < m; ++j) {
            if (kgrams[j].hash <= kgrams[minIdx].hash) {
                minIdx = j;
            }
        }
        fingerprints.push_back({kgrams[minIdx].hash, kgrams[minIdx].lineStart, kgrams[minIdx].lineEnd});
        return fingerprints;
    }

    int lastSelectedIdx = -1;
    for (int i = 0; i <= m - w; ++i) {
        int minIdx = i;
        for (int j = i + 1; j < i + w; ++j) {
            // Using <= breaks ties in favor of the rightmost minimum.
            // Rightmost position stays in future sliding windows longest, minimizing redundant selections.
            if (kgrams[j].hash <= kgrams[minIdx].hash) {
                minIdx = j;
            }
        }

        // Only record when a new k-gram instance becomes minimum to avoid duplicate fingerprints for consecutive windows.
        if (minIdx != lastSelectedIdx) {
            fingerprints.push_back({kgrams[minIdx].hash, kgrams[minIdx].lineStart, kgrams[minIdx].lineEnd});
            lastSelectedIdx = minIdx;
        }
    }

    return fingerprints;
}

std::vector<Fingerprint> Fingerprinter::process(const std::vector<Token>& tokens, int k, int w) {
    return winnow(generateKGrams(tokens, k), w);
}
