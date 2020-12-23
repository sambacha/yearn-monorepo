// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface IStealthTx {
  function reportHash(bytes32 _hash) external;
  function setPenalty(uint256 _penalty) external;
}
