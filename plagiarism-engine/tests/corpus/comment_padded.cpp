// ============================================================================
// Bubble Sort Implementation
// Student Submission - Section A
// ============================================================================

#include <iostream>

/* Helper function to swap two integers
   in place using a temporary variable */
void swapValues(int& a, int& b) {
    // Store original 'a' in a temporary register
    int temp = a;
    a = b; // Assign 'b' into 'a'
    b = temp; // Restore temp into 'b'
}

/**
 * Standard bubble sort algorithm.
 * Iterates through array and swaps adjacent inverted elements.
 */
void bubbleSort(int arr[], int n) {
    // Outer loop for passes
    for (int i = 0; i < n - 1; ++i) {
        // Inner loop comparing adjacent pairs
        for (int j = 0; j < n - i - 1; ++j) {
            // Check if current element exceeds next
            if (arr[j] > arr[j + 1]) {
                swapValues(arr[j], arr[j + 1]); // Swap them
            }
        }
    }
}

// Utility function to print all array contents to console
void printArray(int arr[], int n) {
    for (int i = 0; i < n; ++i) {
        std::cout << arr[i] << " "; // Output space-separated values
    }
    std::cout << std::endl;
}

/*
 * Main execution driver
 */
int main() {
    // Sample test dataset
    int data[] = {64, 34, 25, 12, 22, 11, 90};
    int size = sizeof(data) / sizeof(data[0]);

    // Perform sorting
    bubbleSort(data, size);

    // Print sorted output
    printArray(data, size);

    return 0; // Exit successfully
}
