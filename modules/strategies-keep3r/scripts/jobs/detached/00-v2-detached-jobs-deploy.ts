import { ContractFactory } from 'ethers';
import { run, ethers, network } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../../utils/web3-utils';
import * as contracts from '../../../utils/contracts';

const { Confirm } = require('enquirer');
const prompt = new Confirm('Do you wish to deploy v2 detached jobs contracts?');

async function main() {
  await run('compile');
  await promptAndSubmit();
}

function promptAndSubmit(): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    const [owner] = await ethers.getSigners();
    const networkName = 'ftm';
    console.log('using address:', owner.address, 'on', networkName);
    prompt.run().then(async (answer: any) => {
      if (answer) {
        try {
          const TendV2DetachedJob: ContractFactory = await ethers.getContractFactory('TendV2DetachedJob');
          const HarvestV2DetachedJob: ContractFactory = await ethers.getContractFactory('HarvestV2DetachedJob');

          console.log(
            'TendV2DetachedJob:',
            contracts.baseFeeOracle[networkName], // address _baseFeeOracle,
            contracts.mechanicsRegistry[networkName], // address _mechanicsRegistry,
            contracts.yOracle[networkName], // address _yOracle,
            contracts.v2Keeper[networkName], // address _v2Keeper,
            60 * 5 // 5 minutes // uint256 _workCooldown
          );
          const tendV2Keep3rJob = await TendV2DetachedJob.deploy(
            contracts.baseFeeOracle[networkName],
            contracts.mechanicsRegistry[networkName],
            contracts.yOracle[networkName],
            contracts.v2Keeper[networkName],
            60 * 5 // 5 minutes // uint256 _workCooldown
          );
          console.log('TendV2DetachedJob address:', tendV2Keep3rJob.address);
          console.log(`PLEASE: change utils/contracts.ts tendV2Keep3rJob.${networkName} address to: ${tendV2Keep3rJob.address}`);
          console.log();

          console.log(
            'HarvestV2DetachedJob:',
            contracts.baseFeeOracle[networkName], // address _baseFeeOracle,
            contracts.mechanicsRegistry[networkName], // address _mechanicsRegistry,
            contracts.stealthRelayer.mainnet, // address _stealthRelayer
            contracts.yOracle[networkName], // address _yOracle
            contracts.v2Keeper[networkName], // address _v2Keeper
            6 * 60 * 60 // uint256 _workCooldown // 6 hours
          );
          const harvestV2Keep3rJob = await HarvestV2DetachedJob.deploy(
            contracts.baseFeeOracle[networkName], // address _baseFeeOracle,
            contracts.mechanicsRegistry[networkName], // address _mechanicsRegistry,
            contracts.stealthRelayer.mainnet, // address _stealthRelayer
            contracts.yOracle[networkName], // address _yOracle
            contracts.v2Keeper[networkName], // address _v2Keeper
            6 * 60 * 60 // uint256 _workCooldown // 6 hours
          );
          console.log('HarvestV2DetachedJob address:', harvestV2Keep3rJob.address);
          console.log(`PLEASE: change utils/contracts.ts harvestV2Keep3rJob.${networkName} address to: ${harvestV2Keep3rJob.address}`);

          resolve();
        } catch (err) {
          reject(`Error while deploying v2 detached job contracts: ${(err as any).message}`);
        }
      } else {
        console.error('Aborted!');
        resolve();
      }
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
