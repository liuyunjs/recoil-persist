import {
  DefaultValue,
  AtomEffect,
  SerializableParam,
  atomFamily as recoilAtomFamily,
} from 'recoil';
import { isFunction } from '@liuyunjs/utils/lib/isFunction';
import { isPromise } from '@liuyunjs/utils/lib/isPromise';
import { Storage } from './Storage';
import { syncProcessor, asyncProcessor } from './utils';
import {
  PersistenceOptions,
  PersistAtomFamilyOptions,
  PersistAtomOptions,
} from './types';

const persistEffect =
  <T>({ key, expired, storage }: PersistenceOptions): AtomEffect<T> =>
  ({ setSelf, onSet }) => {
    const currentStorage = new Storage(storage);
    const savedValue = currentStorage.getItem<T>(key);
    const initialValue: (prevValue: T) => T | Promise<T> = isPromise(savedValue)
      ? asyncProcessor(savedValue)
      : syncProcessor(savedValue);

    // @ts-ignore
    setSelf(initialValue);

    onSet((newValue) => {
      if (newValue instanceof DefaultValue) {
        currentStorage.removeItem(key);
      } else {
        currentStorage.setItem(key, newValue, expired);
      }
    });
  };

export const atomFamily = <T, P extends SerializableParam>(
  options: PersistAtomFamilyOptions<T, P>,
) => {
  const { expired, storage, key } = options;

  const baseAtom = recoilAtomFamily<null, P>({
    key: `${key}__baseRecoilFamily`,
    default: null,
  });

  if (options.effects_UNSTABLE) {
    options.effects_UNSTABLE = (param: P) => {
      const inputEffects = isFunction(options.effects_UNSTABLE)
        ? options.effects_UNSTABLE(param)
        : options.effects_UNSTABLE;

      if (inputEffects) {
        return [getPersistEffect(param)].concat(inputEffects);
      }
      return [getPersistEffect(param)];
    };
  } else {
    options.effects_UNSTABLE = (param) => [getPersistEffect(param)];
  }

  return recoilAtomFamily(options);

  function getPersistEffect(param: P) {
    return persistEffect<T>({
      key: baseAtom(param).key,
      expired,
      storage,
    });
  }
};

export const atom = <T extends any>(options: PersistAtomOptions<T>) =>
  atomFamily<T, undefined>(options)(undefined);
