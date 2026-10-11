#include <iostream>

// Copied helper function from original.cpp
void swapValues(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
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
    int x = 10, y = 20;
    swapValues(x, y);

    int fib = computeFibonacci(x);
    std::cout << "Result: " << fib << std::endl;
    return 0;
}
