import { ERC20 } from '@services/EthService';
import {
  Bigish,
  DistributiveOmit,
  ISimpleTxFormFull,
  ITxData,
  ITxObject,
  ITxToAddress,
  TAddress
} from '@types';

import { makeTxFromForm } from './transaction';

interface IFormatApproveTxInputs {
  contractAddress: ITxToAddress;
  baseTokenAmount: Bigish;
  spenderAddress: TAddress;
  form: ISimpleTxFormFull;
}

export const formatApproveTx = ({
  contractAddress,
  baseTokenAmount,
  spenderAddress,
  form
}: IFormatApproveTxInputs): DistributiveOmit<ITxObject, 'gasLimit' | 'nonce'> => {
  const data = ERC20.approve.encodeInput({
    _spender: spenderAddress,
    _value: baseTokenAmount
  }) as ITxData;

  const { gasLimit, nonce, ...tx } = makeTxFromForm(form, '0', data);

  return {
    to: contractAddress as ITxToAddress,
    ...tx
  };
};
