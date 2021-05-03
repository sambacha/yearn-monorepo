// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import '../../interfaces/utils/IOnlyStealthRelayer.sol';

/*
 * OnlyStealthRelayerAbstract
 */
abstract
contract OnlyStealthRelayer is IOnlyStealthRelayer {

    address public stealthRelayer;

    constructor(address _stealthRelayer) {
        _setStealthRelayer(_stealthRelayer);
    }

    modifier onlyStealthRelayer() {
        // if not valid, do not revert execution. just return.
        require(msg.sender == stealthRelayer, 'OnlyStealthRelayer::msg-sender-not-stealth-relayer');
        _;
    }

    function _setStealthRelayer(address _stealthRelayer) internal {
        stealthRelayer = _stealthRelayer;
        emit StealthRelayerSet(_stealthRelayer);
    }

}
