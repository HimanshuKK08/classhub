#include "Comparator.h"
#include <unordered_map>
#include <unordered_set>
#include <algorithm>

ComparisonResult Comparator::compare(const std::vector<Fingerprint>& fpA,
                                   const std::vector<Fingerprint>& fpB) {
    ComparisonResult result;

    // Deduplicate within each file: record first occurrence line range per unique hash
    std::unordered_map<uint64_t, LineRange> uniqueA;
    for (const auto& fp : fpA) {
        if (uniqueA.find(fp.hash) == uniqueA.end()) {
            uniqueA[fp.hash] = {fp.lineStart, fp.lineEnd};
        }
    }

    std::unordered_map<uint64_t, LineRange> uniqueB;
    for (const auto& fp : fpB) {
        if (uniqueB.find(fp.hash) == uniqueB.end()) {
            uniqueB[fp.hash] = {fp.lineStart, fp.lineEnd};
        }
    }

    result.fingerprintCountA = uniqueA.size();
    result.fingerprintCountB = uniqueB.size();

    // Identify intersection of unique hashes
    std::vector<Match> rawMatches;
    for (const auto& [hash, rangeA] : uniqueA) {
        auto itB = uniqueB.find(hash);
        if (itB != uniqueB.end()) {
            rawMatches.push_back({rangeA, itB->second});
        }
    }

    result.matchCount = rawMatches.size();
    size_t unionCount = result.fingerprintCountA + result.fingerprintCountB - result.matchCount;

    if (unionCount > 0) {
        result.similarityPercentage = (static_cast<double>(result.matchCount) / unionCount) * 100.0;
    } else {
        result.similarityPercentage = 0.0;
    }

    if (rawMatches.empty()) {
        return result;
    }

    // Sort matches chronologically by line position in file A, then file B
    std::sort(rawMatches.begin(), rawMatches.end(), [](const Match& a, const Match& b) {
        if (a.fileALines.start != b.fileALines.start) {
            return a.fileALines.start < b.fileALines.start;
        }
        return a.fileBLines.start < b.fileBLines.start;
    });

    // Merge adjacent or overlapping line ranges into continuous match blocks
    std::vector<Match> merged;
    for (const auto& m : rawMatches) {
        if (merged.empty()) {
            merged.push_back(m);
            continue;
        }

        auto& last = merged.back();
        // Allow up to a 1-line gap (tolerance <= 2) to join contiguous code blocks
        bool canMergeA = (m.fileALines.start <= last.fileALines.end + 2) &&
                         (m.fileALines.start >= last.fileALines.start);
        bool canMergeB = (m.fileBLines.start <= last.fileBLines.end + 2) &&
                         (m.fileBLines.start >= last.fileBLines.start);

        if (canMergeA && canMergeB) {
            last.fileALines.end = std::max(last.fileALines.end, m.fileALines.end);
            last.fileBLines.end = std::max(last.fileBLines.end, m.fileBLines.end);
        } else {
            merged.push_back(m);
        }
    }

    result.matches = std::move(merged);
    return result;
}
