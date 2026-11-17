import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";

/** Keeps a value in AsyncStorage. `ready` turns true once the saved value has been read. */
export function usePersisted<T>(key: string, initial: T, valid: (v: unknown) => v is T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (valid(parsed)) setValue(parsed);
      })
      .catch(() => {})
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (ready) AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, [value, ready, key]);

  return [value, setValue, ready] as const;
}
