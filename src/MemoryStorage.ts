import { RawData } from './types';

export class MemoryStorage {
  private readonly store: Record<string, RawData> = {};

  getItem(key: string) {
    return this.store[key];
  }

  setItem(key: string, value: RawData) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}
