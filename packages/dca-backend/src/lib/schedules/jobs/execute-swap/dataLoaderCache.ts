import Cache, { Key } from 'node-cache';

export function wrapNodeCacheForDataloader<T>(cache: Cache) {
  return {
    clear: () => cache.flushAll(),
    delete: (key: Key) => cache.del(key),
    get: async (key: Key) => cache.get<T>(key),
    set: (key: Key, value: unknown) => cache.set(key, value),
  };
}
