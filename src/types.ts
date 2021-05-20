import { AtomFamilyOptions, SerializableParam, AtomOptions } from 'recoil';

export type StorageType = {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
};

export type PersistenceOptions = {
  key: string;
  expired?: number | null;
  storage?: 'localStorage' | 'sessionStorage' | StorageType;
};

export type RawData<T = any> = {
  data: T;
  timestamp: number;
  expired?: number;
};

export type PersistAtomFamilyOptions<T, P extends SerializableParam> =
  AtomFamilyOptions<T, P> & PersistenceOptions;

export type PersistAtomOptions<T extends any> = AtomOptions<T> &
  PersistenceOptions;
