import 'dotenv/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import '@typechain/hardhat/dist/type-extensions';
import { removeConsoleLog } from 'hardhat-preprocessor';
import 'hardhat-gas-reporter';
import 'hardhat-deploy';
import 'solidity-coverage';
import { HardhatUserConfig, MultiSolcUserConfig, NetworksUserConfig } from 'hardhat/types';
import { DEFAULT_ACCOUNT, getNodeUrl } from './utils/network';
import 'tsconfig-paths/register';

const networks: NetworksUserConfig = process.env.TEST
  ? {}
  : {
      hardhat: {
        forking: {
          enabled: process.env.FORK ? true : false,
          url: getNodeUrl('fantom'),
        },
      },
      localhost: {
        url: getNodeUrl('localhost'),
        live: false,
        accounts: [(process.env.LOCAL_MAINNET_PRIVATE_KEY as string) || DEFAULT_ACCOUNT],
        tags: ['local'],
      },
      mainnet: {
        url: getNodeUrl('mainnet'),
        accounts: [(process.env.MAINNET_PRIVATE_KEY as string) || DEFAULT_ACCOUNT],
        gasPrice: 'auto',
        tags: ['production'],
      },
      polygon: {
        url: getNodeUrl('polygon'),
        accounts: [(process.env.POLYGON_PRIVATE_KEY as string) || DEFAULT_ACCOUNT],
        tags: ['production'],
      },
      fantom: {
        url: getNodeUrl('fantom'),
        accounts: [(process.env.FANTOM_PRIVATE_KEY as string) || DEFAULT_ACCOUNT],
        tags: ['production'],
      },
    };

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: 0, // yMECH Alejo
    governor: {
      default: 0, // yMECH Alejo
      1: '0xfeb4acf3df3cdea7399794d0869ef76a6efaff52', // ychad
      250: '0x9f2A061d6fEF20ad3A656e23fd9C814b75fd5803', // ymechs msig
    },
    yMech: '0xB82193725471dC7bfaAB1a3AB93c7b42963F3265', // yMECH Alejo
  },
  mocha: {
    timeout: process.env.MOCHA_TIMEOUT || 300000,
  },
  networks,
  solidity: {
    compilers: [
      {
        version: '0.8.7',
        settings: {
          optimizer: {
            enabled: true,
            runs: 9999,
          },
        },
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 9999,
          },
        },
      },
    ],
  },
  gasReporter: {
    currency: process.env.COINMARKETCAP_DEFAULT_CURRENCY || 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    enabled: true,
    outputFile: 'gasReporterOutput.json',
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => hre.network.name !== 'hardhat'),
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: 'typechained',
    target: 'ethers-v5',
  },
};

if (process.env.TEST) {
  (config.solidity as MultiSolcUserConfig).compilers = (config.solidity as MultiSolcUserConfig).compilers.map((compiler) => {
    return {
      ...compiler,
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    };
  });
}

export default config;
