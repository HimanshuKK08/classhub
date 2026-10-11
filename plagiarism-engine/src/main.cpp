#include "Tokenizer.h"
#include "Normalizer.h"
#include "Fingerprinter.h"
#include "Comparator.h"
#include "JsonWriter.h"

#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

namespace {

bool readFileContent(const std::string& path, std::string& content, std::string& errorMsg) {
    std::ifstream file(path, std::ios::in | std::ios::binary);
    if (!file.is_open()) {
        errorMsg = "Could not open file: " + path;
        return false;
    }

    std::ostringstream ss;
    ss << file.rdbuf();
    content = ss.str();

    if (content.empty()) {
        errorMsg = "File is empty: " + path;
        return false;
    }

    // Check if file is purely whitespace
    bool hasNonWhitespace = false;
    for (char c : content) {
        if (!std::isspace(static_cast<unsigned char>(c))) {
            hasNonWhitespace = true;
            break;
        }
    }
    if (!hasNonWhitespace) {
        errorMsg = "File contains no non-whitespace characters: " + path;
        return false;
    }

    return true;
}

} // namespace

int main(int argc, char* argv[]) {
    int k = 15;
    int w = 10;
    std::vector<std::string> positionalArgs;

    try {
        for (int i = 1; i < argc; ++i) {
            std::string arg = argv[i];
            if (arg == "--k") {
                if (i + 1 < argc) {
                    k = std::stoi(argv[++i]);
                } else {
                    std::cout << JsonWriter::writeError("Missing value for flag --k") << std::endl;
                    return 1;
                }
            } else if (arg.rfind("--k=", 0) == 0) {
                k = std::stoi(arg.substr(4));
            } else if (arg == "--w") {
                if (i + 1 < argc) {
                    w = std::stoi(argv[++i]);
                } else {
                    std::cout << JsonWriter::writeError("Missing value for flag --w") << std::endl;
                    return 1;
                }
            } else if (arg.rfind("--w=", 0) == 0) {
                w = std::stoi(arg.substr(4));
            } else if (arg.rfind("--", 0) == 0) {
                std::cout << JsonWriter::writeError("Unknown option: " + arg) << std::endl;
                return 1;
            } else {
                positionalArgs.push_back(arg);
            }
        }

        if (positionalArgs.size() != 2) {
            std::cout << JsonWriter::writeError("Usage: plagcheck <fileA> <fileB> [--k N] [--w N]") << std::endl;
            return 1;
        }

        if (k <= 0) {
            std::cout << JsonWriter::writeError("Flag --k must be a positive integer") << std::endl;
            return 1;
        }

        if (w <= 0) {
            std::cout << JsonWriter::writeError("Flag --w must be a positive integer") << std::endl;
            return 1;
        }

        const std::string fileA = positionalArgs[0];
        const std::string fileB = positionalArgs[1];

        std::string contentA, contentB, errorMsg;
        if (!readFileContent(fileA, contentA, errorMsg)) {
            std::cout << JsonWriter::writeError(errorMsg) << std::endl;
            return 1;
        }
        if (!readFileContent(fileB, contentB, errorMsg)) {
            std::cout << JsonWriter::writeError(errorMsg) << std::endl;
            return 1;
        }

        // Pipeline execution:
        // 1. Tokenize source files with line-number tracking
        auto tokensA = Tokenizer::tokenize(contentA);
        auto tokensB = Tokenizer::tokenize(contentB);

        if (tokensA.empty()) {
            std::cout << JsonWriter::writeError("No valid C++ tokens found in file: " + fileA) << std::endl;
            return 1;
        }
        if (tokensB.empty()) {
            std::cout << JsonWriter::writeError("No valid C++ tokens found in file: " + fileB) << std::endl;
            return 1;
        }

        // 2. Normalize identifiers (order-of-first-appearance within each file)
        auto normA = Normalizer::normalizeIdentifiers(tokensA);
        auto normB = Normalizer::normalizeIdentifiers(tokensB);

        // 3 & 4. Compute rolling hash k-grams and winnow to fingerprints
        auto fpA = Fingerprinter::process(normA, k, w);
        auto fpB = Fingerprinter::process(normB, k, w);

        // 5. Compare fingerprint sets and identify line range matches
        auto result = Comparator::compare(fpA, fpB);

        // Print final JSON result
        std::cout << JsonWriter::writeResult(fileA, fileB, k, w, result);
        return 0;

    } catch (const std::exception& e) {
        std::cout << JsonWriter::writeError(std::string("Internal error: ") + e.what()) << std::endl;
        return 1;
    } catch (...) {
        std::cout << JsonWriter::writeError("An unknown fatal error occurred") << std::endl;
        return 1;
    }
}
