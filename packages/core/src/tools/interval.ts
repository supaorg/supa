/**
 * Creates an interval that executes a callback function at specified intervals
 * and returns a function to cancel the interval.
 * 
 * @param callback - The function to be executed at each interval
 * @param ms - The interval duration in milliseconds
 * @returns A function that can be called to cancel the interval
 * 
 * @example
 * const cancel = interval(() => console.log('tick'), 1000);
 * // ... later ...
 * cancel(); // stops the interval
 */
export const interval = (callback: () => void, ms: number): () => void => {
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
};
