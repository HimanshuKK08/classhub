cmake_minimum_required(VERSION 3.16)
project(PlagiarismEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_compile_options(-Wall -Wextra)

include_directories(src)

set(SOURCES
    src/main.cpp
    src/Tokenizer.cpp
    src/Normalizer.cpp
    src/Fingerprinter.cpp
    src/Comparator.cpp
    src/JsonWriter.cpp
)

add_executable(plagcheck ${SOURCES})
