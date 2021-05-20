import {
  ReadOnlySelectorFamilyOptions,
  ReadOnlySelectorOptions,
  ReadWriteSelectorFamilyOptions,
  ReadWriteSelectorOptions,
  RecoilState,
  DefaultValue,
} from 'recoil';
import { isString } from '@liuyunjs/utils/lib/isString';

import { RawData } from './types';

export const DEFAULT_VALUE = new DefaultValue();

export const asyncProcessor = <T>(savedValue: Promise<T | null>) => {
  return (defaultValue: T) =>
    savedValue.then((result) => syncProcessor<T>(result)(defaultValue));
};

export const syncProcessor =
  <T>(savedValue: T | null) =>
  (defaultValue: T) => {
    return savedValue ?? defaultValue;
  };

export function syncParseRowData<T>(
  savedValue: string | null | RawData<T>,
): T | null {
  if (!savedValue) return null;
  if (isString(savedValue)) {
    try {
      savedValue = JSON.parse(savedValue);
    } catch (e) {}
  }
  if (isString(savedValue)) return null;
  const { data, timestamp, expired } = savedValue! as unknown as RawData<T>;
  if (!expired || Date.now() - timestamp < expired) return data;
  return null;
}

export const factory = <P>(
  family: (
    options: (
      | ReadOnlySelectorFamilyOptions<any, undefined>
      | ReadWriteSelectorFamilyOptions<any, undefined>
    ) &
      P,
  ) => (param: undefined) => RecoilState<any>,
) => {
  function single<T>(options: ReadWriteSelectorOptions<T> & P): RecoilState<T>;
  function single<T>(options: ReadOnlySelectorOptions<T> & P): RecoilState<T>;
  function single<T>(
    options: (ReadOnlySelectorOptions<T> | ReadWriteSelectorOptions<T>) & P,
  ) {
    // @ts-ignore
    const { get, set } = options;

    const familyOptions = Object.assign({}, options, {
      get: () => get,
    }) as unknown as ReadWriteSelectorOptions<T> & P;

    delete familyOptions.set;

    if ('set' in options) {
      familyOptions.set = () => set;
    }

    // @ts-ignore
    return family(familyOptions)();
  }

  return single;
};
