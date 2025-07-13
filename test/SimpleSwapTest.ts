import { ethers } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";


describe("SimpleSwap",function(){

  let user;
  let swap;
  let tokenA;
  let tokenB;
  let owner;

    beforeEach(async function(){
     [user,owner]   = await ethers.getSigners();
      const Swap    = await ethers.getContractFactory("SimpleSwap");
      swap          = await Swap.deploy();
      await swap.waitForDeployment();

      const Token   = await ethers.getContractFactory("TokenFactory");
      tokenA  = await Token.deploy("Pesos","ARG");
      tokenB  = await Token.deploy("Kipu","KPU");
      await tokenA.connect(user).mint(user.address, 10000n);
      await tokenB.connect(user).mint(user.address, 10000n);
      // Set Reserves for Test
      await tokenA.connect(owner).mint(swap.target, 10000n);
      await tokenB.connect(owner).mint(swap.target, 10000n);
    });
  

it("testAddLiquidity", async function () {
    const now = await time.latest();
    const deadline = now + 3600;
  
    const amountADesired = 10n;
    const amountBDesired = 10n;
  
    // Approve token transfers from user to the swap contract
    await tokenA.connect(user).approve(swap.target, amountADesired);
    await tokenB.connect(user).approve(swap.target, amountBDesired);
  
    // Store balances before adding liquidity
    const userTokenABefore = await tokenA.balanceOf(user.address);
    const userTokenBBefore = await tokenB.balanceOf(user.address);
    const liquidityBefore =  await swap.totalSupply();
    const swapTokenABefore = await tokenA.balanceOf(swap.target);
    const swapTokenBBefore = await tokenB.balanceOf(swap.target);

    const tx = await swap.connect(user).addLiquidity(
      tokenA.target,
      tokenB.target,
      amountADesired,
      amountBDesired,
      amountADesired,
      amountBDesired,
      user.address,
      deadline
    );

    // Store balances after adding liquidity
    const userTokenAAfter = await tokenA.balanceOf(user.address);
    const userTokenBAfter = await tokenB.balanceOf(user.address);
    const userliquidityAfter = await swap.balanceOf(user.address);
    const liquidityAfter = await swap.totalSupply();
    

    // Check User Balances
    expect(userTokenAAfter).to.equal(userTokenABefore-amountADesired);
    expect(userTokenBAfter).to.equal(userTokenABefore-amountBDesired);
    expect(userliquidityAfter).to.equal(liquidityAfter-liquidityBefore);

    // Check Swap Balances
    expect(await tokenA.balanceOf(swap.target)).to.equal(swapTokenABefore+amountADesired);
    expect(await tokenB.balanceOf(swap.target)).to.equal(swapTokenBBefore+amountBDesired);

    // Check Deadline
    const { timestamp } = await ethers.provider.getBlock(tx.blockNumber);
    expect(timestamp).to.be.lessThanOrEqual(deadline);

  });

  it("testRemoveLiquidity", async function () {
    const now = await time.latest();
    const deadline = now + 3600;

    const amountAMin = 1n;
    const amountBMin = 1n;
    const liquidityToBurn = 10n;

    // Artificial Liquidity for test
    await swap.connect(owner).mint(user, 1000n);

    const userliquidityBefore = await swap.balanceOf(user.address);

    const tx = await swap.connect(user).removeLiquidity(
      tokenA.target,
      tokenB.target,
      liquidityToBurn,
      amountAMin,
      amountBMin,
      user.address,
      deadline
    )

    const userliquidityAfter = await swap.balanceOf(user.address);

    // Check Burn Liquidity
    expect(userliquidityAfter).to.equal(userliquidityBefore-liquidityToBurn);
  });


  it("testGetPrice", async function () {
    
    const reserveA = await tokenA.balanceOf(swap.target);
    const reserveB = await tokenB.balanceOf(swap.target);
    // Repply the math of function for ExpectedPrice
    const expectedPrice = (reserveA * 10n**18n) / reserveB;
  
    const price = await swap.getPrice(tokenA.target, tokenB.target);
    expect(price).to.equal(expectedPrice);
  });
  

  it("testSwapExactTokenForTokens", async function () {
    
    const now = await time.latest();
    const deadline = now + 3600;

    const amountIn = 100n;
    const amountOutMin = 100n;

    // Approve token transfers from user to the swap contract
    await tokenA.connect(user).approve(swap.target, 100n);
    await tokenB.connect(user).approve(swap.target, 100n);

    // Store balances before adding liquidity
    const userTokenABefore = await tokenA.balanceOf(user.address);
    const userTokenBBefore = await tokenB.balanceOf(user.address);
    const swapTokenABefore = await tokenA.balanceOf(swap.target);
    const swapTokenBBefore = await tokenB.balanceOf(swap.target);

    const pair = [tokenA.target, tokenB.target];

    const tx = await swap.connect(user).swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    pair,
    user,
    deadline
    );
  
    // Store balances after swap
    const userTokenAAfter = await tokenA.balanceOf(user.address);
    const userTokenBAfter = await tokenB.balanceOf(user.address);

    // Check User Balances
    expect(userTokenAAfter).to.equal(userTokenABefore-amountIn);
    expect(userTokenBAfter).to.equal(userTokenABefore+amountOutMin);

    // Check Swap Balances
    expect(await tokenA.balanceOf(swap.target)).to.equal(swapTokenABefore+amountIn);
    expect(await tokenB.balanceOf(swap.target)).to.equal(swapTokenBBefore-amountOutMin);
  });
 

  it("getAmountOut", async function () {


    const amountIn = 100n;
    const reserveIn = await tokenA.balanceOf(swap.target);
    const reserveOut = await tokenB.balanceOf(swap.target);

    const amountOut = await swap.connect(user).getAmountOut(
      amountIn,
      reserveIn,
      reserveOut
    );
    
    // Repply the math of function for expectedAmountOut
    const expectedAmountOut = amountIn * reserveOut / reserveIn;

    //Check Result
    expect(amountOut).to.equal(expectedAmountOut);
  });
  

  /////////////////AnotherBranchs//////////////////////////////


  it("testAddLiquidityForAmountB branch", async function () {
    const now = await time.latest();
    const deadline = now + 3600;
  
    const amountADesired = 10n;
    const amountBDesired = 12n;

    // AmountMinB for this test
    const amountBMin = 2n;
  
    // Approve token transfers from user to the swap contract
    await tokenA.connect(user).approve(swap.target, amountADesired);
    await tokenB.connect(user).approve(swap.target, amountBDesired);
  
    // Store balances before adding liquidity
    const userTokenABefore = await tokenA.balanceOf(user.address);
    const userTokenBBefore = await tokenB.balanceOf(user.address);
    const liquidityBefore =  await swap.totalSupply();
    const swapTokenABefore = await tokenA.balanceOf(swap.target);
    const swapTokenBBefore = await tokenB.balanceOf(swap.target);

    const tx = await swap.connect(user).addLiquidity(
      tokenA.target,
      tokenB.target,
      amountADesired,
      amountBDesired,
      amountADesired,
      amountBMin,
      user.address,
      deadline
    );

    // Store balances after adding liquidity
    const userTokenAAfter = await tokenA.balanceOf(user.address);
    const userTokenBAfter = await tokenB.balanceOf(user.address);
    const userliquidityAfter = await swap.balanceOf(user.address);
    const liquidityAfter = await swap.totalSupply();
    

    // Check User Balances
    expect(userTokenAAfter).to.equal(userTokenABefore-amountADesired);
    expect(userliquidityAfter).to.equal(liquidityAfter-liquidityBefore);

    // Check Swap Balances 
    expect(await tokenA.balanceOf(swap.target)).to.equal(swapTokenABefore+amountADesired);
    

    // Check Balances of amountB for User and SwapContract
    expect(userTokenBAfter).to.gt(userTokenBBefore-amountBDesired);
    expect(await tokenB.balanceOf(swap.target)).to.lt(swapTokenBBefore+amountBDesired);
  });

  it("testAddLiquidityWithoutReserves branch", async function () {
    const now = await time.latest();
    const deadline = now + 3600;
    const amountCDesired = 10n;
    const amountDDesired = 10n;
    
    // For this test use new tokens without reserves
    const Token   = await ethers.getContractFactory("TokenFactory");
    const tokenC  = await Token.deploy("TestC","TEC");
    const tokenD  = await Token.deploy("TestD","TED");

    // Mint for the example
    await tokenC.connect(user).mint(user.address, 10000n);
    await tokenD.connect(user).mint(user.address, 10000n);


    // Approve token transfers from user to the swap contract
    await tokenC.connect(user).approve(swap.target, amountCDesired);
    await tokenD.connect(user).approve(swap.target, amountDDesired);

    // Store balances before adding liquidity
    const userTokenCBefore = await tokenC.balanceOf(user.address);
    const userTokenDBefore = await tokenD.balanceOf(user.address);
    const liquidityBefore =  await swap.totalSupply();
    const swapTokenCBefore = await tokenC.balanceOf(swap.target);
    const swapTokenDBefore = await tokenD.balanceOf(swap.target);

    const tx = await swap.connect(user).addLiquidity(
      tokenC.target,
      tokenD.target,
      amountCDesired,
      amountDDesired,
      amountCDesired,
      amountDDesired,
      user.address,
      deadline
    );

    // Store balances after adding liquidity
    const userTokenCAfter = await tokenC.balanceOf(user.address);
    const userTokenDAfter = await tokenD.balanceOf(user.address);
    const userliquidityAfter = await swap.balanceOf(user.address);
    const liquidityAfter = await swap.totalSupply();
    
    // Check User Balances
    expect(userTokenCAfter).to.equal(userTokenCBefore-amountCDesired);
    expect(userTokenDAfter).to.equal(userTokenDBefore-amountDDesired);
    expect(userliquidityAfter).to.equal(liquidityAfter-liquidityBefore);

    // Check Swap Balances
    expect(await tokenC.balanceOf(swap.target)).to.equal(swapTokenCBefore+amountCDesired);
    expect(await tokenD.balanceOf(swap.target)).to.equal(swapTokenDBefore+amountDDesired);
  });

  /////////////////Errors//////////////////////////////

  it("ExpiredDeadline in Modifier-->ensure",async function(){
    const now = await time.latest();
    // Deadline lowest than block.stamp
    const deadline = now - 3600;//1hour
  
    const amountADesired = 10n;
    const amountBDesired = 10n;
  
    await expect(
      swap.connect(user).addLiquidity(
        tokenA.target,
        tokenB.target,
        amountADesired,
        amountBDesired,
        amountADesired,
        amountBDesired,
        user.address,
        deadline
      )
    ).to.be.revertedWith("ExpiredDeadline");

  });

  it("InsufficientA in AddLiquidity", async function () {

    const now = await time.latest();
    const deadline = now + 3600;
    
    //Increment AmountADesired to force the error
    const amountADesired = 1000n;
    const amountBDesired = 10n;
 
    await expect(
      swap.connect(user).addLiquidity(
        tokenA.target,
        tokenB.target,
        amountADesired,
        amountBDesired,
        amountADesired,
        amountBDesired,
        user.address,
        deadline
      )
    ).to.be.revertedWith("InsufficientA");
  });

  it("InsufficientB  in AddLiquidity", async function () {
    const now = await time.latest();
    const deadline = now + 3600;    
    const amountADesired = 10n;
    //Increment AmountBDesired to force the error
    const amountBDesired = 1000n; 
    await expect(swap.connect(user).addLiquidity(
      tokenA.target,
      tokenB.target,
      amountADesired,
      amountBDesired,
      amountADesired,
      amountBDesired,
      user.address,
      deadline
    )).to.be.revertedWith("InsufficientB");
  });
    
  it("InvalidPath in SwapExactTokensForTokens", async function () {
    const now = await time.latest();
    const deadline = now + 3600;
    const amountIn = 100n;
    const amountOutMin = 100n;
    //Fake Address to array
    const TokenC = "0x0000000000000000000000000000000000000001";
    //Input an array of 3 values
    const pair = [tokenA.target, tokenB.target,TokenC];
    
    await expect(
      swap.connect(user).swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      pair,
      user,
      deadline)
    ).to.be.revertedWith("InvalidPath");
    
    });


  it("InsufficientOutput in SwapExactTokensForTokens", async function () {
    const now = await time.latest();
    const deadline = now + 3600;
    const amountIn = 100n;
    const pair = [tokenA.target, tokenB.target];
    // Set high to check the require
    const amountOutMin = 5000n;
    await expect(swap.connect(user).swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      pair,
      user,
      deadline)
    ).to.be.revertedWith("InsufficientOutput");  
   });

 
  it("InsufficientReserves in getPrice", async function () {
  
  // Create 2 new tokens to try the getPrice of tokens without reserves
  const Token   = await ethers.getContractFactory("TokenFactory");
  const tokenC  = await Token.deploy("TestC","TEC");
  const tokenD  = await Token.deploy("TestD","TED");

  await expect(swap.connect(user).getPrice(tokenC.target,tokenD.target)            
      ).to.be.revertedWith("InsufficientReserves");
  });
  

  it("InsufficientReserves in getAmountOut", async function () {
    
    //Check if the params reserveIn and reserveOut are greater than 0
    const reserveIn  = 0;
    const reserveOut = 0;
    const amountIn = 100n;

    await expect(swap.connect(user).getAmountOut(amountIn,reserveIn,reserveOut)            
        ).to.be.revertedWith("InsufficientReserves");
    });
  
  it("InsufficientA in removeLiquidity", async function () {

    const now = await time.latest();
    const deadline = now + 3600;
      
    // Increment amountAMin to force the error
    const amountAMin = 1000n;
    const amountBMin = 100n; 
    const liquidityToBurn = 10n;

    // Artificial Liquidity for test
    await swap.connect(owner).mint(user, 1000n);
   
    await expect(
      swap.connect(user).removeLiquidity(
      tokenA.target,
      tokenB.target,
      liquidityToBurn,
      amountAMin,
      amountBMin,
      user.address,
      deadline
    )
    ).to.be.revertedWith("InsufficientA");
    });
  
  it("InsufficientB in removeLiquidity", async function () {
    const now = await time.latest();
    const deadline = now + 3600;
    
    
    const amountAMin = 1n;
    // Increment amountBMin to force the error
    const amountBMin = 1000n; 
    const liquidityToBurn = 10n;

    // Artificial Liquidity for test
    await swap.connect(owner).mint(user, 1000n);

    await expect(
      swap.connect(user).removeLiquidity(
      tokenA.target,
      tokenB.target,
      liquidityToBurn,
      amountAMin,
      amountBMin,
      user.address,
      deadline
    )
    ).to.be.revertedWith("InsufficientB");
  });
  

});