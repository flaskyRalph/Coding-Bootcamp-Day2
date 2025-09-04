import AsyncStorage from '@react-native-async-storage/async-storage';

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get(key: string, ttl?: number): Promise<any | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < (ttl || this.TTL)) {
      return cached.data;
    }

    try {
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < (ttl || this.TTL)) {
          this.cache.set(key, { data, timestamp });
          return data;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    return null;
  }

  async set(key: string, data: any): Promise<void> {
    const timestamp = Date.now();
    
    this.cache.set(key, { data, timestamp });

    try {
      await AsyncStorage.setItem(
        `cache_${key}`,
        JSON.stringify({ data, timestamp })
      );
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async invalidate(pattern?: string): Promise<void> {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          await AsyncStorage.removeItem(`cache_${key}`);
        }
      }
    } else {
      this.cache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  }
}

export default CacheManager.getInstance();


