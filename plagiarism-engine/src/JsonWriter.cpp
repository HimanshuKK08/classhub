#include "JsonWriter.h"
#include <sstream>
#include <iomanip>

std::string JsonWriter::escapeString(const std::string& input) {
    std::string out;
    out.reserve(input.size() + 16);
    for (char c : input) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\b': out += "\\b";  break;
            case '\f': out += "\\f";  break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    char buf[8];
                    std::snprintf(buf, sizeof(buf), "\\u%04x", static_cast<unsigned char>(c));
                    out += buf;
                } else {
                    out += c;
                }
                break;
        }
    }
    return out;
}

std::string JsonWriter::writeResult(const std::string& fileA,
                                   const std::string& fileB,
                                   int k,
                                   int w,
                                   const ComparisonResult& result) {
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"fileA\": \"" << escapeString(fileA) << "\",\n";
    ss << "  \"fileB\": \"" << escapeString(fileB) << "\",\n";
    ss << "  \"k\": " << k << ",\n";
    ss << "  \"w\": " << w << ",\n";
    ss << std::fixed << std::setprecision(2);
    ss << "  \"similarityPercentage\": " << result.similarityPercentage << ",\n";
    ss << "  \"fingerprintCountA\": " << result.fingerprintCountA << ",\n";
    ss << "  \"fingerprintCountB\": " << result.fingerprintCountB << ",\n";
    ss << "  \"matchCount\": " << result.matchCount << ",\n";
    ss << "  \"matches\": [";

    if (!result.matches.empty()) {
        ss << "\n";
        for (size_t i = 0; i < result.matches.size(); ++i) {
            const auto& m = result.matches[i];
            ss << "    { \"fileALines\": [" << m.fileALines.start << ", " << m.fileALines.end
               << "], \"fileBLines\": [" << m.fileBLines.start << ", " << m.fileBLines.end << "] }";
            if (i + 1 < result.matches.size()) {
                ss << ",";
            }
            ss << "\n";
        }
        ss << "  ]\n";
    } else {
        ss << "]\n";
    }

    ss << "}\n";
    return ss.str();
}

std::string JsonWriter::writeError(const std::string& errorMessage) {
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"error\": \"" << escapeString(errorMessage) << "\"\n";
    ss << "}\n";
    return ss.str();
}
