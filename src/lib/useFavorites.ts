import { useCallback, useState } from 'react';
import { loadFavorites, saveFavorites } from './favorites';
import type { Message } from './types';

export function useFavorites() {
  const [items, setItems] = useState<Message[]>(loadFavorites);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(
    (m: Message) => {
      const exists = items.some((x) => x.id === m.id);
      const next = exists ? items.filter((x) => x.id !== m.id) : [m, ...items];
      if (!saveFavorites(next)) {
        setError('Tidak bisa menyimpan di browser ini. Penyimpanan mungkin diblokir.');
        return;
      }
      setError(null);
      setItems(next);
    },
    [items],
  );
  const isSaved = useCallback((id: string) => items.some((x) => x.id === id), [items]);

  return { items, toggle, isSaved, error };
}
