// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TokenFactory} from "./TokenFactory.sol";


contract SimpleSwap is TokenFactory {

    

    /// @notice Scaling factor for 18-decimal fixed-point math (1 × 10¹⁸).
    uint256 private constant DECIMALS = 1e18;

    /// @notice Minimum liquidity permanently locked on the first `mint` to anchor price ratios.
    /// @dev Prevents zero-liquidity exploits and ensures the pool can never be fully drained.
    uint256 private constant MINIMUN_LIQUIDITY = 10_000;


    /// @notice Emitted when liquidity is added to the pool.
    /// @param provider The address that provided the liquidity.
    /// @param amountA The amount of token A added.
    /// @param amountB The amount of token B added.
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);

    /// @notice Emitted when liquidity is removed from the pool.
    /// @param provider The address that removed the liquidity.
    /// @param amountA The amount of token A returned to the provider.
    /// @param amountB The amount of token B returned to the provider.
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);

    /// @notice Emitted when a token swap is performed.
    /// @param sender The address initiating the swap.
    /// @param recipient The address receiving the output tokens.
    /// @param amountIn The amount of input tokens sent in.
    /// @param amountOut The amount of output tokens received.
    event Swap(address indexed sender, address indexed recipient, uint256 amountIn, uint256 amountOut);

    constructor() TokenFactory("LiquidityPair", "LP") {
        mint(address(this),MINIMUN_LIQUIDITY);
    }

    /// @notice Ensures function is called before `deadline`.
    /// @param deadline Unix timestamp after which the call is invalid.
    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "ExpiredDeadline");
        _;
    }

   
    /// @notice Adds liquidity for `tokenA`/`tokenB` pair.
    /// @dev If reserves are zero, assigns a default value of 1 to avoid division by zero.
    /// @param tokenA First token address.
    /// @param tokenB Second token address.
    /// @param amountADesired Max amount of A to deposit.
    /// @param amountBDesired Max amount of B to deposit.
    /// @param amountAMin Min amount of A to accept.
    /// @param amountBMin Min amount of B to accept.
    /// @param to Recipient of LP tokens.
    /// @param deadline Last valid timestamp.
    /// @return amountA Actual A added.
    /// @return amountB Actual B added.
    /// @return liquidity LP tokens minted.
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline)  returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
       
        uint256 reserveA = IERC20(tokenA).balanceOf(address(this));
        uint256 reserveB = IERC20(tokenB).balanceOf(address(this));
        uint256 amountOut;
        if(reserveA==0 && reserveB==0){
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            //  return amountOut =  (amountIn * reserveOut) / reserveIn;
            amountOut = getAmountOut(amountBDesired, reserveB, reserveA);
            if (amountOut <= amountADesired) {
                require(amountOut >= amountAMin, "InsufficientA");
                    amountA = amountOut;
                    amountB = amountBDesired;
                    } else {
                    amountOut = getAmountOut(amountADesired, reserveA, reserveB);
                    require(amountOut >= amountBMin, "InsufficientB");
                    amountA = amountADesired;
                    amountB = amountOut;
                }
            }
        
        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountA), "TransferAfailed");
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), amountB), "TransferBfailed");

        uint256 supplyLiquidity = totalSupply();
        uint256 liquidityA;
        uint256 liquidityB;

        liquidityA = (amountA * supplyLiquidity);
        liquidityB = (amountB * supplyLiquidity);

        if (reserveA>0 && reserveB>0) {
            liquidityA = liquidityB / reserveA;
            liquidityB = liquidityB / reserveB;
        }
        liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;
      

        mint(to, liquidity);
        
        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    /// @notice Burns `liquidity` LP tokens and returns underlying tokens.
    /// @param tokenA First token address.
    /// @param tokenB Second token address.
    /// @param liquidity Amount of LP tokens to burn.
    /// @param amountAMin Min A to receive.
    /// @param amountBMin Min B to receive.
    /// @param to Recipient of underlying.
    /// @param deadline Last valid timestamp.
    /// @return amountA A returned.
    /// @return amountB B returned.
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline)  returns (uint256 amountA, uint256 amountB) {
    
        uint256 reserveA = IERC20(tokenA).balanceOf(address(this));
        uint256 reserveB = IERC20(tokenB).balanceOf(address(this));
        
        uint256 supplyLiquidity = totalSupply();
        amountA = (liquidity * reserveA) / supplyLiquidity;
        require(amountA >= amountAMin, "InsufficientA");
        amountB = (liquidity * reserveB) / supplyLiquidity;
        require(amountB >= amountBMin, "InsufficientB");

        (bool success) = IERC20(tokenA).transfer(to, amountA);
        require(success, "TransferAfailed");

        (success) = IERC20(tokenB).transfer(to, amountB);
        require(success, "TransferBfailed");

        burn(liquidity);
        
    
        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }

    /// @notice Swap an exact `amountIn` of `path[0]` for as many `path[1]` as possible, enforcing `amountOutMin`.
    /// @param amountIn Input token amount.
    /// @param amountOutMin Minimum acceptable output.
    /// @param path [input, output] token addresses.
    /// @param to Recipient of output tokens.
    /// @param deadline Last valid timestamp.
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) {
        require(path.length == 2, "InvalidPath");

        uint256 reserveIn = IERC20(path[0]).balanceOf(address(this));
        uint256 reserveOut = IERC20(path[1]).balanceOf(address(this));

        uint256 amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "InsufficientOutput");

       (bool success) = IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
       require(success, "TransferInFailed");
       
       (success) =  IERC20(path[1]).transfer(to, amountOut);
       require(success, "TransferOutFailer");
        
        emit Swap(msg.sender, to, amountIn, amountOut);
    }

    /// @notice Returns raw price of `tokenA` to `tokenB` as reserveA/reserveB.
    /// @param tokenA Base token.
    /// @param tokenB Quote token.
    /// @return price tokenA/tokenB price.
    function getPrice(address tokenA, address tokenB) external view  returns (uint256 price) {
        uint256 reserveA = IERC20(tokenA).balanceOf(address(this));
        uint256 reserveB = IERC20(tokenB).balanceOf(address(this));
        require(reserveA > 0 && reserveB > 0, "InsufficientReserves");
        return (reserveA * DECIMALS) / reserveB;
    }

    /// @notice Given `amountIn` and reserves, returns max `amountOut`.
    /// @param amountIn Input token amount.
    /// @param reserveIn Input reserve.
    /// @param reserveOut Output reserve.
    /// @return amountOut Calculated output amount.
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(reserveIn > 0 && reserveOut > 0, "InsufficientReserves");
        return amountOut = (amountIn * reserveOut) / reserveIn;
    }
}
