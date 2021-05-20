import { PersistenceOptions } from './types';

export const DefaultStorage = (() => {
  let defaultStorage: PersistenceOptions['storage'] = 'localStorage';

  return {
    set(storage: PersistenceOptions['storage']) {
      defaultStorage = storage;
    },
    get() {
      return defaultStorage;
    },
  };
})();
