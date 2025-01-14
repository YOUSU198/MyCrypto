import TrezorConnect from 'trezor-connect';

import { TREZOR_DERIVATION_PATHS } from '@config/dpaths';
import { DPath, TAddress, WalletId } from '@types';
import { flatten } from '@vendor';

import { DWAccountDisplay, ExtendedDPath, getHDWallets } from '../deterministic';
import HardwareWallet, { KeyInfo } from './HardwareWallet';
import { getFullPath } from './helpers';

export default class Trezor extends HardwareWallet {
  private cache: { [key: string]: KeyInfo } = {};

  public async initialize(dpath: DPath): Promise<void> {
    TrezorConnect.manifest({
      email: 'support@mycrypto.com',
      appUrl: 'https://beta.mycrypto.com'
    });

    this.cache = {};

    // Fetch a random address to ensure the connection works
    try {
      await this.getAddress(dpath, 50);
    } catch (err) {
      console.debug('[Trezor]: Error connecting to device');
      throw err;
    }
  }

  public async prefetch(paths: DPath[]): Promise<{ [key: string]: KeyInfo }> {
    const bundle = paths.filter((path) => !path.isHardened).map((path) => ({ path: path.value }));

    const response: any = await TrezorConnect.getPublicKey({ bundle }); // @todo - figure out these types

    for (const { serializedPath, chainCode, publicKey } of response.payload) {
      this.cache[serializedPath] = { chainCode, publicKey };
    }

    return this.cache;
  }

  public async getMultipleAddresses(paths: ExtendedDPath[]): Promise<DWAccountDisplay[]> {
    const keyInfo = await this.prefetch(paths);
    return flatten(
      Object.entries(keyInfo).map(([key, value]) => {
        const dpath = paths.find((x) => x.value === key);
        if (!dpath) {
          console.error('[getMultipleAddresses]: Could not find dpath that was expected.');
          return [] as DWAccountDisplay[];
        }
        return getHDWallets({
          dPath: key,
          chainCode: value.chainCode,
          publicKey: value.publicKey,
          limit: dpath.numOfAddresses,
          offset: dpath.offset
        }).map((item) => ({
          address: item.address as TAddress,
          pathItem: {
            path: `${key}/${item.index}`,
            baseDPath: dpath,
            index: item.index
          },
          balance: undefined
        }));
      })
    );
  }

  public getDPaths(): DPath[] {
    return TREZOR_DERIVATION_PATHS;
  }

  protected getWalletType(): WalletId.TREZOR_NEW {
    return WalletId.TREZOR_NEW;
  }

  protected async getKeyInfo(path: DPath): Promise<KeyInfo> {
    if (this.cache[path.value]) {
      return this.cache[path.value];
    }

    const response = await TrezorConnect.getPublicKey({ path: path.value });

    if (!response.success) {
      throw Error(response.payload.error);
    }

    return {
      publicKey: response.payload.publicKey,
      chainCode: response.payload.chainCode
    };
  }

  protected async getHardenedAddress(path: DPath, index: number): Promise<string> {
    /**
     * @todo: Add support for getting multiple addresses at the same time. For reference:
     * https://github.com/trezor/connect/blob/develop/docs/methods/ethereumGetAddress.md
     */
    const response = await TrezorConnect.ethereumGetAddress({ path: getFullPath(path, index) });

    if (!response.success) {
      throw Error(response.payload.error);
    }

    return response.payload.address;
  }
}
