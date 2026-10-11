#include "Tokenizer.h"
#include "Normalizer.h"
#include "Fingerprinter.h"
#include "Comparator.h"

#include <iostream>
#include <cassert>
#include <string>
#include <vector>

void testTokenizerAndNormalizer() {
    std::cout << "[TEST] Running Tokenizer & Normalizer tests..." << std::endl;

    std::string code1 = "int sum = a + b;";
    std::string code2 = "int total = x + y;";

    auto tokens1 = Tokenizer::tokenize(code1);
    auto tokens2 = Tokenizer::tokenize(code2);

    assert(tokens1.size() == 7);
    assert(tokens2.size() == 7);

    // Verify token types and line numbers
    assert(tokens1[0].type == TokenType::KEYWORD && tokens1[0].value == "int" && tokens1[0].lineNumber == 1);
    assert(tokens1[1].type == TokenType::IDENTIFIER && tokens1[1].value == "sum");
    assert(tokens1[2].type == TokenType::OPERATOR && tokens1[2].value == "=");
    assert(tokens1[3].type == TokenType::IDENTIFIER && tokens1[3].value == "a");
    assert(tokens1[4].type == TokenType::OPERATOR && tokens1[4].value == "+");
    assert(tokens1[5].type == TokenType::IDENTIFIER && tokens1[5].value == "b");
    assert(tokens1[6].type == TokenType::PUNCTUATION && tokens1[6].value == ";");

    auto norm1 = Normalizer::normalizeIdentifiers(tokens1);
    auto norm2 = Normalizer::normalizeIdentifiers(tokens2);

    assert(norm1.size() == norm2.size());
    for (size_t i = 0; i < norm1.size(); ++i) {
        assert(norm1[i].type == norm2[i].type);
        assert(norm1[i].value == norm2[i].value);
    }

    // Verify repeated identifiers map to same placeholder
    std::string codeRepeated = "int a = 1; a = a + 2;";
    auto normRepeated = Normalizer::normalizeIdentifiers(Tokenizer::tokenize(codeRepeated));
    // Tokens: int (KEYWORD), VAR1, =, 1, ;, VAR1, =, VAR1, +, 2, ;
    assert(normRepeated[1].value == "VAR1");
    assert(normRepeated[5].value == "VAR1");
    assert(normRepeated[7].value == "VAR1");

    // Comment stripping and line numbers
    std::string codeComments = "// Single line\n/* Multi\nline */\nint x = 5;";
    auto tokensComments = Tokenizer::tokenize(codeComments);
    assert(tokensComments.size() == 5);
    // int x = 5 ; should start on line 4
    assert(tokensComments[0].lineNumber == 4);

    // Opaque string literals
    std::string codeStr1 = "string msg = \"Hello World\";";
    std::string codeStr2 = "string msg = \"Completely different text\";";
    auto normStr1 = Normalizer::normalizeIdentifiers(Tokenizer::tokenize(codeStr1));
    auto normStr2 = Normalizer::normalizeIdentifiers(Tokenizer::tokenize(codeStr2));
    assert(normStr1.size() == normStr2.size());
    for (size_t i = 0; i < normStr1.size(); ++i) {
        assert(normStr1[i].type == normStr2[i].type);
        assert(normStr1[i].value == normStr2[i].value);
    }

    std::cout << "  -> Tokenizer & Normalizer tests PASSED." << std::endl;
}

void testFingerprinter() {
    std::cout << "[TEST] Running Fingerprinter & Winnowing tests..." << std::endl;

    // Test Winnowing tie-breaking rule: picks rightmost minimum
    // Construct kgrams with specific hash values: { 10, 5, 20, 5, 30 } with w = 3
    std::vector<KGram> kgrams = {
        {10, 1, 3},
        {5, 2, 4},
        {20, 3, 5},
        {5, 4, 6},
        {30, 5, 7}
    };

    // Windows of size 3:
    // Window 0: [10, 5, 20] -> min is 5 at index 1
    // Window 1: [5, 20, 5]  -> min is 5 at index 1 and 3. Rightmost is index 3!
    // Window 2: [20, 5, 30] -> min is 5 at index 3.
    auto fps = Fingerprinter::winnow(kgrams, 3);

    // Expect 2 fingerprints: index 1, then index 3 (index 3 was picked and not duplicated for window 2)
    assert(fps.size() == 2);
    assert(fps[0].lineStart == 2 && fps[0].lineEnd == 4);
    assert(fps[1].lineStart == 4 && fps[1].lineEnd == 6);

    std::cout << "  -> Fingerprinter & Winnowing tests PASSED." << std::endl;
}

void testComparator() {
    std::cout << "[TEST] Running Comparator tests..." << std::endl;

    std::vector<Fingerprint> fpA = {
        {100, 1, 5},
        {200, 4, 8},
        {300, 10, 15}
    };
    std::vector<Fingerprint> fpB = {
        {100, 1, 5},
        {200, 3, 7},
        {400, 20, 25}
    };

    auto res = Comparator::compare(fpA, fpB);
    assert(res.fingerprintCountA == 3);
    assert(res.fingerprintCountB == 3);
    assert(res.matchCount == 2); // hashes 100 and 200 match
    // Union = 3 + 3 - 2 = 4. Jaccard = 2/4 = 50.0%
    assert(res.similarityPercentage == 50.0);

    // Check adjacent range merging:
    // fpA [1, 5] and [4, 8] overlap
    // fpB [1, 5] and [3, 7] overlap
    // Should be merged into 1 match range: [1, 8] vs [1, 7]
    assert(res.matches.size() == 1);
    assert(res.matches[0].fileALines.start == 1 && res.matches[0].fileALines.end == 8);
    assert(res.matches[0].fileBLines.start == 1 && res.matches[0].fileBLines.end == 7);

    std::cout << "  -> Comparator tests PASSED." << std::endl;
}

int main() {
    testTokenizerAndNormalizer();
    testFingerprinter();
    testComparator();
    std::cout << "\nAll Unit Tests PASSED Successfully!" << std::endl;
    return 0;
}
