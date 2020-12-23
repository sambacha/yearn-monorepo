// SPDX-License-Identifier: MIT

pragma solidity >=0.6.8;

import "@openzeppelin/contracts/math/SafeMath.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import '../../interfaces/utils/IStealthTx.sol';

/*
 * StealthTxAbstract
 */
abstract
contract StealthTx is IStealthTx {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    mapping(bytes32 => address) public hashDiscoveredBy;
    uint256 public penalty = 1000 ether; // 1k DAI
    address public dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    constructor() public {
    }

    modifier stealthTx(bytes32 _hash) {
        require(IERC20(dai).balanceOf(msg.sender) >= penalty, 'StealthTx: balance < penalty');
        require(IERC20(dai).allowance(msg.sender, address(this)) >= penalty, 'StealthTx: allowance < penalty');
        address discoveredBy = hashDiscoveredBy[_hash];
        if (discoveredBy != address(0)) {
            // User reported this TX as public, taking penalty away
            delete hashDiscoveredBy[_hash];
            IERC20(dai).safeTransferFrom(msg.sender, discoveredBy, penalty);
            return;
        }
        _;
    }

    function reportHash(bytes32 _hash) external override {
        require(hashDiscoveredBy[_hash] == address(0), 'hash-already-discovered');
        hashDiscoveredBy[_hash] = msg.sender;
    }
    function _setPenalty(uint256 _penalty) internal {
        require(_penalty > 0, 'penalty-not-0');
        penalty = _penalty;
    }

}
