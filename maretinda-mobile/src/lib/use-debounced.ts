import { useEffect, useState } from 'react';

/** A value once it has stopped changing for a moment. */
export function useDebounced<T>(value: T, wait = 250): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), wait);
    return () => clearTimeout(timer);
  }, [value, wait]);
  return settled;
}
