// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import '../../interfaces/utils/IMachinery.sol';
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

abstract
contract Machinery is IMachinery {
  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet internal _mechanics;

  constructor(address _mechanic) public {
    require(_mechanic != address(0), 'machinery/mechanic-should-not-be-zero-address');
    _addMechanic(_mechanic);
  }

  // Machinery
  function _addMechanic(address _mechanic) internal {
    require(!_mechanics.contains(_mechanic), "Keep3rJob::add-mechanic:mechanic-already-added");
    _mechanics.add(_mechanic);
    emit MechanicAdded(_mechanic);
  }

  function _removeMechanic(address _mechanic) internal {
    require(_mechanics.contains(_mechanic), "Keep3rJob::remove-mechanic:mechanic-not-found");
    _mechanics.remove(_mechanic);
    emit MechanicRemoved(_mechanic);
  }

  // View helpers
  function isMechanic(address mechanic) public view override returns (bool _isMechanic) {
    return _mechanics.contains(mechanic);
  }

  // Getters
  function mechanics() public view override returns (address[] memory _mechanicsList) {
    _mechanicsList = new address[](_mechanics.length());
    for (uint256 i; i < _mechanics.length(); i++) {
      _mechanicsList[i] = _mechanics.at(i);
    }
  }
}
