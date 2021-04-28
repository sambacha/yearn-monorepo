// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.4;

// import from @lbertenasco/contract-utils/contracts
import "../abstract/MigratableReady.sol";
import "../utils/Manageable.sol";
import "../utils/StealthTx.sol";

/**
 * MigratableReady = UtilsReady (Manageable, CollectableDust, Pausable) + Migratable
 * Manageable
 * StealthTx
 * 
 */

contract Example is MigratableReady, Manageable, StealthTx {
    event StealthEvent(bytes32 _stealth);

    constructor(
        address _stealthVault
    ) MigratableReady() Manageable(msg.sender) StealthTx(_stealthVault) {
    }

    // StealthTx: unrestricted-access
    // function stealthFunction(bytes32 _hash) public notMigrated validateStealthTx(_hash) returns (bool) {
    //     emit StealthEvent(_hash); // https://bit.ly/393bAUH
    //     return false;
    // }


    // All this below can be moved to a new ExtendedUtilsReady contract

    // StealthTx: restricted-access
    function setPenalty(uint256 _penalty) external override onlyGovernor {
        _setPenalty(_penalty);
    }

    function migrateStealthVault() external override onlyManager {
        _migrateStealthVault();
    }


    // Manageable: restricted-access
    function setPendingManager(address _pendingManager) external override onlyManager {
        _setPendingManager(_pendingManager);
    }

    function acceptManager() external override onlyPendingManager {
        _acceptManager();
    }

}
