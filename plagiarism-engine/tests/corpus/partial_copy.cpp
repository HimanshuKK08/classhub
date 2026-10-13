#include <iostream>

// Helper copied from original.cpp
void swapValues(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

// Full sorting algorithm copied from original.cpp
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; ++i) {
        for (int j = 0; j < n - i - 1; ++j) {
            if (arr[j] > arr[j + 1]) {
                swapValues(arr[j], arr[j + 1]);
            }
        }
    }
}

// Unrelated logic: iterative Fibonacci computation
int computeFibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    int prev = 0;
    int curr = 1;
    for (int i = 2; i <= n; ++i) {
        int next = prev + curr;
        prev = curr;
        curr = next;
    }
    return curr;
}

int main() {
    int data[] = {5, 2, 9, 1, 7};
    int len = 5;
    bubbleSort(data, len);

    int fib = computeFibonacci(data[0]);
    std::cout << "Result: " << fib << std::endl;
    return 0;
}
