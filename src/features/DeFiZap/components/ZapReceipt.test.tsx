import React from 'react';

import { simpleRender } from 'test-utils';

import { fAccount, fTxConfig, fTxReceipt } from '@fixtures';
import { ITxType } from '@types';
import { noOp, truncate } from '@utils';

import { ZAPS_CONFIG } from '../config';
import ZapReceipt from './ZapReceipt';

const zapSelected = ZAPS_CONFIG.compounddai;

const defaultProps: React.ComponentProps<typeof ZapReceipt> = {
  txConfig: {
    ...fTxConfig,
    rawTransaction: { ...fTxConfig.rawTransaction, to: ZAPS_CONFIG.compounddai.contractAddress }
  },
  txReceipt: { ...fTxReceipt, txType: ITxType.DEFIZAP },
  zapSelected,
  resetFlow: noOp,
  onComplete: noOp
};

function getComponent(props: React.ComponentProps<typeof ZapReceipt>) {
  return simpleRender(<ZapReceipt {...props} />);
}

describe('ZapReceipt', () => {
  test('it renders a single tx receipt', async () => {
    const { getByText, getAllByText } = getComponent(defaultProps);
    expect(getAllByText(truncate(fAccount.address))).toBeDefined();
    expect(getByText(zapSelected.title)).toBeDefined();
    expect(getByText(zapSelected.contractAddress, { exact: false })).toBeDefined();
    expect(getByText(zapSelected.platformsUsed[0], { exact: false })).toBeDefined();
  });
});
