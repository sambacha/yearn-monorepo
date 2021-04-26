// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../YearnOTCSwapper.sol';
import '../OneInchSwapper.sol';

interface IYearnOTCAndOneInchSwapper is IYearnOTCSwapper, IOneInchSwapper {}

contract YearnOTCAndOneInchSwapper is IYearnOTCAndOneInchSwapper, YearnOTCSwapper, OneInchSwapper {
  using SafeERC20 for IERC20;

  constructor(
    address _oneInch,
    address _mechanicsRegistry,
    address _weth,
    uint256 _slippagePrecision
  ) OneInchSwapper(_oneInch, _mechanicsRegistry, _weth, _slippagePrecision) {}

  function _getTotalAmountOut(
    uint256 _amountIn,
    address _tokenIn,
    address _tokenOut
  ) internal view override returns (uint256 _amountOut) {
    uint256 _parts = 1; // should inherit from one inch swapper
    uint256 _flags = 0; // should inherit from one inch swapper
    (_amountOut, ) = IOneSplit(ONE_INCH).getExpectedReturn(IERC20(_tokenIn), IERC20(_tokenOut), _amountIn, _parts, _flags);
  }
}
