// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import './UtilsReady.sol';
import '../utils/Machinery.sol';

abstract
contract MachineryReady is UtilsReady, Machinery {

  constructor() public Machinery(msg.sender) UtilsReady() {
  }

  // Machinery: restricted-access
  function addMechanic(address _mechanic) external override onlyGovernor {
    _addMechanic(_mechanic);
  }
  function removeMechanic(address _mechanic) external override onlyGovernor {
    _removeMechanic(_mechanic);
  }

  // Machinery: modifiers
  modifier onlyGovernorOrMechanic() {
    require(isGovernor(msg.sender) || isMechanic(msg.sender), "Machinery::onlyGovernorOrMechanic:invalid-msg-sender");
    _;
  }

}
