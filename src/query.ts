import {
  ReadOnlySelectorFamilyOptions,
  ReadWriteSelectorFamilyOptions,
  selectorFamily,
  SerializableParam,
  RecoilState,
  DefaultValue,
  atomFamily,
} from 'recoil';
import { factory } from './utils';

const queryRequestController = atomFamily({
  key: 'queryRequestController',
  default: [],
});

export function queryFamily<T, P extends SerializableParam>(
  options: ReadOnlySelectorFamilyOptions<T, P>,
): (param: P) => RecoilState<T>;
export function queryFamily<T, P extends SerializableParam>(
  options: ReadWriteSelectorFamilyOptions<T, P>,
): (param: P) => RecoilState<T>;
export function queryFamily<T, P extends SerializableParam>(
  options:
    | ReadOnlySelectorFamilyOptions<T, P>
    | ReadWriteSelectorFamilyOptions<T, P>,
) {
  const { key, get, dangerouslyAllowMutability } = options;
  const selectorFactory: (param: P) => RecoilState<T> = selectorFamily({
    dangerouslyAllowMutability,
    key,
    get: (param: P) => (opts) => {
      opts.get(queryRequestController(selectorFactory(param).key));
      return get(param)(opts);
    },
    set: (param: P) => (opts, newValue) => {
      if (newValue instanceof DefaultValue) {
        return opts.set(queryRequestController(selectorFactory(param).key), []);
      }
      if ('set' in options) {
        options.set(param)(opts, newValue);
      }
    },
  });
  return selectorFactory;
}

export const query = factory<{}>(queryFamily);
