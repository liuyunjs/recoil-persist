import React from 'react';
import { useRecoilCallback, RecoilValue } from 'recoil';

export const useRecoilValueNotSubscribing = <T>(
  recoilValue: RecoilValue<T>,
) => {
  const getInitialState = useRecoilCallback(
    ({ snapshot: { getLoadable } }) => () => {
      return getLoadable(recoilValue).getValue();
    },
    [recoilValue],
  );

  return React.useMemo(getInitialState, [getInitialState]);
};
