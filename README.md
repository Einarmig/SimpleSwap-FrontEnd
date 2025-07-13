# 🦄 SimpleSwap – Module 3 Final Project

## 📌 Introduction

This project is part of Module 3 of ETH-Kipu and consists of developing a decentralized token exchange system using Solidity and Scaffold-ETH 2. The smart contract allows users to swap between two ERC20 tokens (Token A and Token B) and query the price ratio between them. The frontend connects to the deployed contract, enabling wallet interaction, token swaps, and live price fetching.



---

## 🧰 Tech Stack

- [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2) (React, Vite, Wagmi, Viem, Tailwind)
- Hardhat (testing + deployment)
- Solidity (v0.8.30)
- TypeScript

---

## 🔗 Deployed Contracts

> The project includes Token A and Token B with a public `mint()` function so users can fund their wallets and test the DApp easily.

| Contract       | Address                                      |
|----------------|----------------------------------------------|
| SimpleSwap     | `0x4cA28c2E3cdfd2eeED183405FafA923f84EFB34C`                   |
| Token A (e.g. KPU) | `0x513368b11474270500033ebFa8f07d30ca4C945F`                |
| Token B (e.g. ARG) | `0x0993CAF2399B7b5fAf2BF7E89a9f61E4d1D9F824`                |

---

## 🌐 Live Frontend

Interact with the contracts via the deployed front-end:  
**🔗 [https://simpleswap-ten.vercel.app](https://simpleswap-ten.vercel.app)**

Features:
- Connect your wallet (e.g. MetaMask)
- Mint Token A and Token B
- Swap Token A → Token B and vice versa
- View live token price (TokenA/TokenB)

---

## 🧪 Tests & Coverage

- Test environment set up with Hardhat
- Unit tests written for core functionalities (`addLiquidity`, `removeLiquidity`, `swapExactTokensForTokens`, `getPrice`,'getAmountOut')
- Coverage executed using:

```bash
npx hardhat coverage
