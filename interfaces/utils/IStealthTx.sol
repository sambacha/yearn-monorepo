// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface IStealthTx {
  event StealthVaultSet(address _stealthVault);
  event PenaltySet(uint256 _penalty);
  event MigratedStealthVault(address _migratedTo);


  function migrateStealthVault() external;
  function setPenalty(uint256 _penalty) external;
}
