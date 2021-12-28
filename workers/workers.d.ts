declare abstract class Cache {
  delete(
    request: Request | string,
    options?: CacheQueryOptions,
  ): Promise<boolean>;
  match(
    request: Request | string,
    options?: CacheQueryOptions,
  ): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
}

interface CacheQueryOptions {
  ignoreMethod?: boolean;
}

declare abstract class CacheStorage {
  open(cacheName: string): Promise<Cache>;
  readonly default: Cache;
}

declare const caches: CacheStorage;
