// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface IStealthTx {
  event MigratedStealthVault(address _migratedTo);
  function migrateStealthVault() external;

  function setPenalty(uint256 _penalty) external;
}
