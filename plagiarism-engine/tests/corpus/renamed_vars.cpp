#include <iostream>

void exchange(int& first, int& second) {
    int holding = first;
    first = second;
    second = holding;
}

void sortAscending(int list[], int count) {
    for (int outer = 0; outer < count - 1; ++outer) {
        for (int inner = 0; inner < count - outer - 1; ++inner) {
            if (list[inner] > list[inner + 1]) {
                exchange(list[inner], list[inner + 1]);
            }
        }
    }
}

void displayList(int list[], int count) {
    for (int outer = 0; outer < count; ++outer) {
        std::cout << list[outer] << " ";
    }
    std::cout << std::endl;
}

int main() {
    int items[] = {64, 34, 25, 12, 22, 11, 90};
    int length = sizeof(items) / sizeof(items[0]);

    sortAscending(items, length);
    displayList(items, length);

    return 0;
}
