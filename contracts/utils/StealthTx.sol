// SPDX-License-Identifier: MIT

pragma solidity >=0.6.8;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@lbertenasco/bonded-stealth-tx/interfaces/stealth/IStealthVault.sol';

import '../../interfaces/utils/IStealthTx.sol';
import '../../interfaces/utils/IMigratable.sol';

/*
 * StealthTxAbstract
 */
abstract
contract StealthTx is IStealthTx {

    address public stealthVault;
    uint256 public penalty = 1 ether;

    constructor(address _stealthVault) public {
        _setStealthVault(_stealthVault);
    }

    modifier validateStealthTx(bytes32 _stealthHash) {
        bool valid = IStealthVault(stealthVault).validateHash(msg.sender, _stealthHash, penalty);
        if (!valid) return;
        _;
    }

    function _setStealthVault(address _stealthVault) internal {
        require(IStealthVault(stealthVault).isStealthVault(), 'not stealth vault');
        stealthVault = _stealthVault;
    }

    function _setPenalty(uint256 _penalty) internal {
        require(_penalty > 0, 'penalty-not-0');
        penalty = _penalty;
    }

    function _migrateStealthVault() internal {
        address _migratedTo = IMigratable(stealthVault).migratedTo();
        require(_migratedTo != address(0), 'not-migrated');
        _setStealthVault(_migratedTo);
        emit MigratedStealthVault(_migratedTo);
    }

}
