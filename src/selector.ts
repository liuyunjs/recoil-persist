import {
  DefaultValue,
  RecoilState,
  noWait,
  SetRecoilState,
  GetRecoilValue,
  ResetRecoilState,
  SerializableParam,
  ReadOnlySelectorFamilyOptions,
  ReadWriteSelectorFamilyOptions,
  selectorFamily as recoilSelectorFamily,
} from 'recoil';
import { isPromise } from '@liuyunjs/utils/lib/isPromise';
import { queryFamily } from './query';
import { PersistenceOptions } from './types';
import { Storage } from './Storage';
import { MemoryStorage } from './MemoryStorage';
import {
  asyncProcessor,
  syncProcessor,
  DEFAULT_VALUE,
  factory,
  syncParseRowData,
} from './utils';

export function selectorFamily<T, P extends SerializableParam>(
  options: ReadWriteSelectorFamilyOptions<T, P> & PersistenceOptions,
): (param: P) => RecoilState<T>;
export function selectorFamily<T, P extends SerializableParam>(
  options: ReadOnlySelectorFamilyOptions<T, P> & PersistenceOptions,
): (param: P) => RecoilState<T>;
export function selectorFamily<T, P extends SerializableParam>(
  options: (
    | ReadWriteSelectorFamilyOptions<T, P>
    | ReadOnlySelectorFamilyOptions<T, P>
  ) &
    PersistenceOptions,
) {
  const { get, dangerouslyAllowMutability, key, expired, storage } = options;
  const memoryStorage = new MemoryStorage();
  const currentStorage = new Storage(storage, memoryStorage);
  const baseQuery = queryFamily<T, P>({
    key: `${key}__baseQueryFamily`,
    get,
  });

  // @ts-ignore
  const basePersistFamily: (param: P) => RecoilState<T> = recoilSelectorFamily<
    T,
    P
  >({
    key: `${key}__basePersistFamily`,
    get: (param: P) => () => {
      const savedValue: T | null | Promise<T | null> =
        currentStorage.getItem<T>(basePersistFamily(param).key);
      return isPromise(savedValue)
        ? // @ts-ignore
          (asyncProcessor(savedValue)(DEFAULT_VALUE) as Promise<T>)
        : // @ts-ignore
          (syncProcessor(savedValue)(DEFAULT_VALUE) as T);
    },
  });

  return recoilSelectorFamily<T, P>({
    dangerouslyAllowMutability,
    key,
    get: (param: P) => (opts) => {
      const baseSelector = basePersistFamily(param);
      let persistValue: T | DefaultValue = opts.get(baseSelector);
      const memoryCachedValue = memoryStorage.getItem(baseSelector.key);
      if (memoryCachedValue) {
        persistValue = syncParseRowData(memoryCachedValue);
      }

      const { state, contents } = opts.get(noWait(baseQuery(param)));

      if (state === 'hasError') {
        throw contents;
      }

      if (state === 'loading') {
        if (persistValue instanceof DefaultValue) {
          return contents;
        }
        return persistValue as T;
      }

      currentStorage.setItem(baseSelector.key, contents, expired);
      return contents;
    },
    set:
      (param: P) =>
      (
        opts: {
          set: SetRecoilState;
          get: GetRecoilValue;
          reset: ResetRecoilState;
        },
        newValue: T | DefaultValue,
      ) => {
        const baseSelector = basePersistFamily(param);
        if (newValue instanceof DefaultValue) {
          currentStorage.removeItem(baseSelector.key);
          opts.reset(baseQuery(param));
        } else {
          currentStorage.setItem(baseSelector.key, newValue, expired);
        }

        if ('set' in options) {
          options.set(param)(opts, newValue);
        }
      },
  });
}

export const selector = factory<PersistenceOptions>(selectorFamily);
