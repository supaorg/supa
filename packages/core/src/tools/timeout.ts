/**
 * Creates a timeout that executes a callback function after a specified delay
 * and returns a function to cancel the timeout.
 * 
 * @param callback - The function to be executed after the delay
 * @param ms - The delay duration in milliseconds
 * @returns A function that can be called to cancel the timeout
 * 
 * @example
 * const cancel = timeout(() => console.log('done'), 1000);
 * // ... if needed ...
 * cancel(); // prevents the callback from executing
 */
export const timeout = (callback: () => void, ms: number): () => void => {
    const id = setTimeout(callback, ms);
    return () => clearTimeout(id);
};
