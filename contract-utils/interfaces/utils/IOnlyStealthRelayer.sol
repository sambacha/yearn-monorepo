// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

interface IOnlyStealthRelayer {
  event StealthRelayerSet(address _stealthRelayer);
  function setStealthRelayer(address _stealthRelayer) external;
}
