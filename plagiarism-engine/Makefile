CXX      := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -O2 -Isrc
TARGET   := plagcheck

SRCS     := src/main.cpp \
            src/Tokenizer.cpp \
            src/Normalizer.cpp \
            src/Fingerprinter.cpp \
            src/Comparator.cpp \
            src/JsonWriter.cpp

OBJS     := $(SRCS:.cpp=.o)

.PHONY: all clean test

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $@ $^

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

test: $(TARGET)
	./$(TARGET) tests/corpus/original.cpp tests/corpus/renamed_vars.cpp

clean:
	rm -f $(TARGET) $(TARGET).exe src/*.o tests/*.o tests/test_unit tests/test_unit.exe
