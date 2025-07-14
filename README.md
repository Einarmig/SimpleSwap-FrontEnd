# 🦄 SimpleSwap – Module 4 Final Project

## 📌 Introduction

This repository is the cap‑stone for **Module 4** (ETH‑Kipu). It delivers a minimal but complete decentralized exchange that lets users **swap two ERC‑20 tokens**, inspect the pool **price ratio**, and mint/approve test balances.  Solidity smart‑contracts are built and tested with **Hardhat**; the UI is a single‑page vanilla HTML that talks to the deployed contracts via **ethers v6**.

---

## 🧰 Tech Stack

| Layer              | Tooling                                          |
| ------------------ | ------------------------------------------------ |
| Smart‑contracts    |  Solidity 0.8.30 · Hardhat · TypeScript typings  |
| Testing & Coverage | Hardhat Network · Mocha/Chai · solidity‑coverage |
| Frontend           | Vanilla **HTML + JS** · **Ethers v6 UMD CDN**    |
| Chain              |  Sepolia test‑net                                |

---

## 🔗 Deployed Contracts (Sepolia)

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| **SimpleSwap**    | `0x4cA28c2E3cdfd2eeED183405FafA923f84EFB34C` |
| **Token A (KPU)** | `0x513368b11474270500033ebFa8f07d30ca4C945F` |
| **Token B (ARG)** | `0x0993CAF2399B7b5fAf2BF7E89a9f61E4d1D9F824` |

*Both tokens expose a public `mint(address,uint256)` so testers can self‑fund.*
*The TokenA and TokenB are deploys of TokenFactory(OpenZepellin-->ERC20+ERC20Burnable)*

---

## 🖥️ Frontend (folder `/frontend`)

| File         | Purpose                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html` | **Single‑page DApp**: connect wallet, live price (`getPrice`), mint, approve, token toggle and `swapExactTokensForTokens`. No bundler required. |

### Prerequisites

1. **MetaMask** (or compatible wallet) set to **Sepolia**.
2. Any static HTTP server.

### Quick Start

```bash
# from project root
cd public

# simplest (npx)
npx serve .
# → serves at http://localhost:3000

# OR with python
python -m http.server 8080
# → http://localhost:8080/index.html
```

> ⚠️  Opening the file with `file://` **will not work** – MetaMask injects `window.ethereum` only over HTTP(S).

### UI Flow

1. **Connect Wallet** – prompts MetaMask, shows shortened address, starts a 30‑second price refresh.
2. **Mint section** – call `mint()` on each token to get test balances.
3. **Approve section** – grant allowance to any spender.
4. **Swap card** –

   * Live quote: `1 TOKEN_A ≈ X.TTTT TOKEN_B` (4 decimals, contract already scales by 1e18).
   * `⇅` toggles token order.
   * `Swap` executes `swapExactTokensForTokens` with `amountOutMin = 0` and `deadline = now + 10 min` (for demo purposes).

All txs pass through `safeTx()` helper → waits for confirmation and shows success / error alerts.

---

## 🧪 Tests & Coverage

* Unit tests cover: `addLiquidity`, `removeLiquidity`, `swapExactTokensForTokens`, `getPrice`, `getAmountOut`.
* Execute with:

```bash
npx hardhat test
npx hardhat coverage
```

### Coverage Report

-------------------|----------|----------|----------|----------|----------------|
File               |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------------|----------|----------|----------|----------|----------------|
 contracts/        |      100 |    79.55 |      100 |      100 |                |
  SimpleSwap.sol   |      100 |    79.55 |      100 |      100 |                |
  TokenFactory.sol |      100 |      100 |      100 |      100 |                |
-------------------|----------|----------|----------|----------|----------------|
All files          |      100 |    79.55 |      100 |      100 |                |
-------------------|----------|----------|----------|----------|----------------|

---

## Author

**Einarmig**  

---

## License

MIT 
