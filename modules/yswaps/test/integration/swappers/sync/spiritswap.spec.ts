import { expect } from 'chai';
import { Contract, utils, Wallet } from 'ethers';
import { ethers } from 'hardhat';
import { evm, wallet } from '@test-utils';
import { then, when } from '@test-utils/bdd';
import { getNodeUrl } from '../../../../utils/network';
import * as setup from '../setup';
import { IERC20 } from '@typechained';

// We set a fixed block number so tests can cache blockchain state
const FORK_BLOCK_NUMBER = 16548550;

const MAX_SLIPPAGE = 10_000; // 1%
const AMOUNT_IN = utils.parseEther('10000');

describe('Spiritswap', function () {
  let strategy: Wallet;
  let tradeFactory: Contract;
  let snapshotId: string;

  let CRV: IERC20;
  let DAI: IERC20;

  when('on fantom', () => {
    const CHAIN_ID = 250;

    const CRV_ADDRESS = '0x1E4F97b9f9F913c46F1632781732927B9019C68b';
    const DAI_ADDRESS = '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E';

    const CRV_WHALE_ADDRESS = '0x9d945d909ca91937d19563e30bb4dac12c860189';

    before(async () => {
      strategy = await wallet.generateRandom();

      await evm.reset({
        jsonRpcUrl: getNodeUrl('fantom'),
        blockNumber: FORK_BLOCK_NUMBER,
      });

      ({
        fromToken: CRV,
        toToken: DAI,
        tradeFactory,
      } = await setup.sync({
        chainId: CHAIN_ID,
        fixture: ['Common', 'Fantom', 'SyncSpiritswap'],
        swapper: 'SyncSpiritswap',
        fromTokenAddress: CRV_ADDRESS,
        toTokenAddress: DAI_ADDRESS,
        fromTokenWhaleAddress: CRV_WHALE_ADDRESS,
        amountIn: AMOUNT_IN,
        strategy,
      }));

      snapshotId = await evm.snapshot.take();
    });

    beforeEach(async () => {
      await evm.snapshot.revert(snapshotId);
    });

    describe('swap', () => {
      const data = ethers.utils.defaultAbiCoder.encode([], []);
      beforeEach(async () => {
        await tradeFactory
          .connect(strategy)
          ['execute(address,address,uint256,uint256,bytes)'](CRV_ADDRESS, DAI_ADDRESS, AMOUNT_IN, MAX_SLIPPAGE, data);
      });

      then('CRV gets taken from strategy', async () => {
        expect(await CRV.balanceOf(strategy.address)).to.equal(0);
      });
      then('DAI gets airdropped to strategy', async () => {
        expect(await DAI.balanceOf(strategy.address)).to.be.gt(0);
      });
    });
  });
});
