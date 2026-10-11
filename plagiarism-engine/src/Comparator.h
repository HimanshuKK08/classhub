#pragma once

#include "Fingerprinter.h"
#include <vector>
#include <cstdint>
#include <cstddef>

struct LineRange {
    int start;
    int end;
};

struct Match {
    LineRange fileALines;
    LineRange fileBLines;
};

struct ComparisonResult {
    double similarityPercentage = 0.0;
    size_t fingerprintCountA = 0;
    size_t fingerprintCountB = 0;
    size_t matchCount = 0;
    std::vector<Match> matches;
};

class Comparator {
public:
    static ComparisonResult compare(const std::vector<Fingerprint>& fpA,
                                   const std::vector<Fingerprint>& fpB);
};
