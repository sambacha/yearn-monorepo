// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import './UtilsReady.sol';
import '../utils/Migratable.sol';

abstract
contract MigratableReady is UtilsReady, Migratable {

  constructor() public UtilsReady() {
  }

  // Migratable: restricted-access
  function migrate(address _to) external onlyGovernor {
      _migrated(_to);
  }

}
