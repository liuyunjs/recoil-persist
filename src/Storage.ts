import { isString } from '@liuyunjs/utils/lib/isString';
import { isPromise } from '@liuyunjs/utils/lib/isPromise';
import { PersistenceOptions, RawData, StorageType } from './types';
import { DefaultStorage } from './DefaultStorage';
import { MemoryStorage } from './MemoryStorage';
import { syncParseRowData } from './utils';

function replaceKey(key: string) {
  return key.replace(/\//g, '.');
}

export class Storage {
  private readonly _storage: StorageType;
  private readonly _memoryStorage?: MemoryStorage;

  constructor(
    storageInput: PersistenceOptions['storage'] = DefaultStorage.get(),
    memoryStorage?: MemoryStorage,
  ) {
    if (isString(storageInput)) {
      if (typeof window === 'undefined') {
        throw new Error(
          'localStorage, sessionStorage are not supported in the current environment',
        );
      }
      this._storage = window[storageInput];
    } else if (storageInput) {
      this._storage = storageInput as StorageType;
    } else {
      throw new Error('please pass in the available storage');
    }
    this._memoryStorage = memoryStorage;
  }

  getItem<T>(key: string) {
    key = replaceKey(key);
    const savedValue =
      this._memoryStorage?.getItem(key) ?? this._storage.getItem(key);

    if (isPromise(savedValue)) {
      return savedValue.then((result) => syncParseRowData<T>(result));
    }
    return syncParseRowData<T>(savedValue as string | null);
  }

  setItem<T>(key: string, value: T, expired?: number | null) {
    key = replaceKey(key);
    const rowData = {
      timestamp: Date.now(),
      data: value,
      expired,
    } as RawData<T>;
    this._memoryStorage?.setItem(key, rowData);
    this._storage.setItem(key, JSON.stringify(rowData));
  }

  removeItem(key: string) {
    key = replaceKey(key);
    // this._memoryStorage?.removeItem(key);
    this._storage.removeItem(key);
  }
}
