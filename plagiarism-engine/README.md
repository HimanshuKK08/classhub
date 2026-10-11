# ClassHub Plagiarism Engine (`plagcheck`)

A standalone C++ similarity detection engine for C++ source code based on tokenization, order-of-appearance identifier normalization, Rabin-Karp polynomial rolling hashes, and Schleimer-Wilkerson-Aiken winnowing.

## Architecture & Pipeline

1. **Tokenizer (`src/Tokenizer.h`, `src/Tokenizer.cpp`)**:
   - Strips single-line (`//`) and multi-line (`/* */`) comments.
   - Strips preprocessor directives (`#include`, `#define`, etc.).
   - Preserves 1-indexed source line numbers for every token.
   - Tokenizes keywords, identifiers, numbers, operators, punctuation, and treats string/char literal contents as opaque `STRING_LITERAL` tokens.

2. **Normalizer (`src/Normalizer.h`, `src/Normalizer.cpp`)**:
   - Maps identifiers to positional placeholders (`VAR1`, `VAR2`, ...) based on order of first appearance within each file.
   - Defeats variable and function renaming obfuscations.

3. **Fingerprinter (`src/Fingerprinter.h`, `src/Fingerprinter.cpp`)**:
   - Generates $k$-grams from normalized tokens.
   - Computes rolling hashes in $O(1)$ time per window using Rabin-Karp polynomial rolling hash (Mersenne prime modulus $2^{31} - 1$, base $1000003$).
   - Slides a window of size $w$ to winnow fingerprints. Ties are broken in favor of the rightmost minimum, persisting longest in future sliding windows.

4. **Comparator (`src/Comparator.h`, `src/Comparator.cpp`)**:
   - Computes Jaccard similarity between unique fingerprint sets.
   - Merges adjacent or overlapping matching line ranges.

5. **JSON Output (`src/JsonWriter.h`, `src/JsonWriter.cpp`)**:
   - Zero-dependency formatting of JSON results and error payloads to stdout.

---

## Building

### Direct Compiler Invocation (g++)
```bash
g++ -std=c++17 -Wall -Wextra -O2 -Isrc -o plagcheck \
    src/main.cpp \
    src/Tokenizer.cpp \
    src/Normalizer.cpp \
    src/Fingerprinter.cpp \
    src/Comparator.cpp \
    src/JsonWriter.cpp
```

### Using Make
```bash
make
```

### Using CMake
```bash
mkdir build && cd build
cmake ..
cmake --build .
```

---

## Usage

```bash
./plagcheck <fileA> <fileB> [--k N] [--w N]
```

### Arguments & Flags
- `<fileA>`: Path to first C++ source file (positional, required).
- `<fileB>`: Path to second C++ source file (positional, required).
- `--k <N>`: Token window length for $k$-grams (default: `15`).
- `--w <N>`: Window size for winnowing (default: `10`).

---

## Example Output

```bash
./plagcheck tests/corpus/original.cpp tests/corpus/renamed_vars.cpp
```

```json
{
  "fileA": "tests/corpus/original.cpp",
  "fileB": "tests/corpus/renamed_vars.cpp",
  "k": 15,
  "w": 10,
  "similarityPercentage": 100.00,
  "fingerprintCountA": 38,
  "fingerprintCountB": 38,
  "matchCount": 38,
  "matches": [
    { "fileALines": [3, 33], "fileBLines": [3, 33] }
  ]
}
```

### Error Output
On invalid arguments, missing files, or empty files, `plagcheck` exits with non-zero status code `1` and prints:
```json
{
  "error": "Could not open file: nonexistent.cpp"
}
```

---

## Running Tests

### Unit Tests
```bash
g++ -std=c++17 -Wall -Wextra -O2 -Isrc -o tests/test_unit \
    tests/test_unit.cpp \
    src/Tokenizer.cpp \
    src/Normalizer.cpp \
    src/Fingerprinter.cpp \
    src/Comparator.cpp \
    src/JsonWriter.cpp
./tests/test_unit
```

### Test Corpus
The test corpus in `tests/corpus/` includes:
- `original.cpp`: Baseline C++ program with bubble sort and utility functions.
- `renamed_vars.cpp`: Identical logic with all identifiers systematically renamed.
- `comment_padded.cpp`: Identical code with extensive single-line and multi-line comments.
- `reformatted.cpp`: Identical code with Allman brace style and alternative formatting.
- `reordered_functions.cpp`: Identical logic with functions defined in different order.
- `partial_copy.cpp`: One copied function mixed with unrelated code.
- `unrelated.cpp`: An unrelated palindrome checking program.
