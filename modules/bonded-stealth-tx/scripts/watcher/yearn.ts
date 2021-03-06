import { ethers, hardhatArguments, network } from 'hardhat';
import _ from 'lodash';
import { BigNumber, Contract, utils, Transaction, constants } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import * as contracts from '../../utils/contracts';
import Web3 from 'web3';
import * as gasnow from './tools/gasnow';
import * as alive from './tools/alive';
import { getChainId, getReporterPrivateKey, getWSUrl } from './tools/env';

const MAX_GAS_PRICE = utils.parseUnits('350', 'gwei');
const wsUrlProvider = getWSUrl(hardhatArguments.network!);
const stealthVaultAddress = contracts.stealthVault[hardhatArguments.network! as contracts.DeployedNetwork];
const stealthRelayerAddress = contracts.stealthRelayer[hardhatArguments.network! as contracts.DeployedNetwork];
const chainId = getChainId(hardhatArguments.network!);
const reporterPrivateKey = getReporterPrivateKey(hardhatArguments.network!);

const web3 = new Web3(wsUrlProvider);
const ethersWebSocketProvider = new ethers.providers.WebSocketProvider(wsUrlProvider, hardhatArguments.network!);

let nonce: number;
let reporterSigner: SignerWithAddress;
let stealthVault: Contract;
let stealthRelayer: Contract;
let callers: string[];
let jobs: string[];
let stealthRelayerPenalty: BigNumber;
const bonded: { [keepers: string]: BigNumber } = {};
const callersJobs: { [keepers: string]: string[] } = {};
const checkedTxs: { [hash: string]: boolean } = {};

const generateRandomNumber = (min: number, max: number): string => {
  return `${Math.floor(Math.random() * (max - min) + min)}`;
};

async function main(): Promise<void> {
  await gasnow.start();
  return new Promise(async (resolve) => {
    console.log(`Starting on network ${hardhatArguments.network!}(${chainId}) ...`);
    console.log('Getting reporter ...');
    [reporterSigner] = await ethers.getSigners();
    nonce = await reporterSigner.getTransactionCount();
    stealthVault = await ethers.getContractAt('contracts/StealthVault.sol:StealthVault', stealthVaultAddress, reporterSigner);
    stealthRelayer = await ethers.getContractAt('contracts/StealthRelayer.sol:StealthRelayer', stealthRelayerAddress, reporterSigner);
    console.log('Getting penalty ...');
    stealthRelayerPenalty = await stealthRelayer.penalty();
    console.log('Penalty set to', utils.formatEther(stealthRelayerPenalty));
    console.log('Getting callers ...');
    callers = (await stealthVault.callers()).map((caller: string) => normalizeAddress(caller));
    console.log('Getting callers jobs ...');
    for (let i = 0; i < callers.length; i++) {
      addCallerStealthContracts(callers[i], await stealthVault.callerContracts(callers[i]));
      console.log('Getting bonded from', callers[i]);
      addBond(callers[i], await stealthVault.bonded(callers[i]));
    }

    alive.startCheck();
    ethersWebSocketProvider.on('pending', (txHash: string) => {
      ethersWebSocketProvider.getTransaction(txHash).then((transaction) => {
        alive.stillAlive();
        if (transaction && !checkedTxs[txHash]) {
          checkedTxs[txHash] = true;
          checkTx(transaction);
        }
      });
    });

    console.log('Hooking up to events ...');
    stealthRelayer.on('PenaltySet', (penalty: BigNumber) => {
      console.log('Updating penalty to', utils.formatEther(penalty));
      stealthRelayerPenalty = penalty;
    });
    stealthVault.on('StealthContractEnabled', (caller: string, job: string) => {
      addCallerStealthContracts(caller, [job]);
    });
    stealthVault.on('StealthContractsEnabled', (caller: string, jobs: string[]) => {
      addCallerStealthContracts(caller, jobs);
    });
    stealthVault.on('StealthContractDisabled', (caller: string, job: string) => {
      removeCallerStealthContracts(caller, [job]);
    });
    stealthVault.on('StealthContractsDisabled', (caller: string, jobs: string[]) => {
      removeCallerStealthContracts(caller, jobs);
    });
    stealthVault.on('Bonded', (caller: string, bonded: BigNumber, _: BigNumber) => {
      addBond(caller, bonded);
    });
    stealthVault.on('Unbonded', (caller: string, unbonded: BigNumber, _: BigNumber) => {
      reduceBond(caller, unbonded);
    });
    stealthVault.on('PenaltyApplied', (hash: string, caller: string, penalty: BigNumber, reporter: string) => {
      reduceBond(caller, penalty);
      addBond(reporter, penalty.div(10));
    });
  });
}

async function checkTx(tx: Transaction) {
  const rand = generateRandomNumber(1, 1000000000);
  console.time(`Whole tx analysis ${tx.hash}`);
  console.time(`Is using stealth relayer ${rand}-${tx.hash!}`);
  if (!isUsingStealthRelayer(tx.to!)) return;
  console.log('*****************************************');
  console.timeEnd(`Is using stealth relayer ${rand}-${tx.hash!}`);
  console.time(`Transaction parse ${rand}-${tx.hash!}`);
  const parsedTx = await stealthRelayer.interface.parseTransaction(tx);
  console.timeEnd(`Transaction parse ${rand}-${tx.hash!}`);
  console.time(`Transaction using stealth vault execution ${rand}-${tx.hash!}`);
  if (!isUsingStealthVaultExecution(parsedTx.name)) return;
  console.timeEnd(`Transaction using stealth vault execution ${rand}-${tx.hash!}`);
  console.time(`Validating hash was not reported ${rand}-${tx.hash!}`);
  if (await isHashReported(parsedTx.args._stealthHash)) return;
  console.timeEnd(`Validating hash was not reported ${rand}-${tx.hash!}`);
  console.time(`Validate caller jobs ${rand}-${tx.hash!}`);
  if (!validCallerJobs(tx.from!, stealthRelayerAddress)) return;
  console.timeEnd(`Validate caller jobs ${rand}-${tx.hash!}`);
  console.time(`Validate bond for penalty ${rand}-${tx.hash!}`);
  if (!validBondForPenalty(tx.from!)) return;
  console.timeEnd(`Validate bond for penalty ${rand}-${tx.hash!}`);
  console.timeEnd(`Whole tx analysis ${tx.hash}`);
  await reportHash(parsedTx.args._stealthHash, tx.gasPrice!);
  console.log('*****************************************');
}

async function reportHash(hash: string, validatingGasPrice: BigNumber): Promise<void> {
  console.log('reporting hash', hash);
  nonce++;
  let rushGasPrice = validatingGasPrice.gt(gasnow.getGasPrice().rapid)
    ? validatingGasPrice.add(validatingGasPrice.div(3))
    : BigNumber.from(`${gasnow.getGasPrice().rapid}`);
  rushGasPrice = rushGasPrice.gt(MAX_GAS_PRICE) ? MAX_GAS_PRICE : rushGasPrice;
  const populatedTx = await stealthVault.populateTransaction.reportHash(hash, { gasLimit: 1000000, gasPrice: rushGasPrice, nonce });
  const signedtx = await web3.eth.accounts.signTransaction(
    {
      to: stealthVaultAddress,
      gasPrice: `${rushGasPrice.toString()}`,
      gas: '100000',
      data: populatedTx.data!,
    },
    reporterPrivateKey as string
  );
  const reportingTx = await ethers.provider.sendTransaction(signedtx.rawTransaction!);
  console.log('sent report with tx hash', reportingTx.hash);
}

function isUsingStealthRelayer(to: string): boolean {
  return to == stealthRelayerAddress;
}

function validCallerJobs(caller: string, jobs: string): boolean {
  caller = normalizeAddress(caller);
  jobs = normalizeAddress(jobs);
  if (!_.has(callersJobs, caller)) return false;
  if (!_.includes(callersJobs[caller], jobs)) return false;
  return true;
}

function validBondForPenalty(caller: string): boolean {
  return bonded[normalizeAddress(caller)].gte(stealthRelayerPenalty);
}

function isUsingStealthVaultExecution(functionName: string): boolean {
  return (
    functionName === 'execute' ||
    functionName === 'executeAndPay' ||
    functionName === 'executeWithoutBlockProtection' ||
    functionName === 'executeWithoutBlockProtectionAndPay'
  );
}

async function isHashReported(hash: string): Promise<boolean> {
  const hashReportedBy = await stealthVault.hashReportedBy(hash);
  return hashReportedBy != constants.AddressZero;
}

function addCallerStealthContracts(caller: string, callerContracts: string[]): void {
  console.log('Adding', callerContracts.length, 'jobs of', caller);
  callerContracts = callerContracts.map((cj) => normalizeAddress(cj));
  caller = normalizeAddress(caller);
  if (!_.has(callersJobs, caller)) callersJobs[caller] = [];
  callersJobs[caller] = _.union(callersJobs[caller], callerContracts);
  jobs = _.union(jobs, callerContracts);
}

function removeCallerStealthContracts(caller: string, callerContracts: string[]): void {
  console.log('Removing', callerContracts.length, 'jobs of', caller);
  callerContracts = callerContracts.map((cj) => normalizeAddress(cj));
  caller = normalizeAddress(caller);
  callersJobs[caller] = _.difference(callersJobs[caller], callerContracts);
  jobs = _.difference(jobs, callerContracts);
}

function reduceBond(caller: string, amount: BigNumber): void {
  console.log('Reducing', utils.formatEther(amount), 'of', caller, 'bonds');
  caller = normalizeAddress(caller);
  bonded[caller] = bonded[caller].sub(amount);
}

function addBond(caller: string, amount: BigNumber): void {
  console.log('Adding', utils.formatEther(amount), 'to', caller, 'bonds');
  caller = normalizeAddress(caller);
  if (!_.has(bonded, caller)) bonded[caller] = BigNumber.from('0');
  bonded[caller] = bonded[caller].add(amount);
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

process.on('uncaughtException', () => {
  process.exit(1);
});

process.on('unhandledRejection', () => {
  process.exit(1);
});
