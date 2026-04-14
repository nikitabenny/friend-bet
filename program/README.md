# FriendBet (Solana MVP)

A lightweight on-chain betting app that lets friends create and settle 1v1 bets using SOL on Solana.


FriendBet is a minimal prediction market-style application where:
- One user creates a bet
- Another user accepts it
- Both deposit SOL into escrow
- The creator resolves the outcome
- The winner claims the pooled funds

This project was built as a 1-day MVP to demonstrate:
- Solana smart contract development (Anchor)
- On-chain escrow logic
- Wallet-based interactions

---

### Flow

1. **Create Bet**
   - Creator defines:
     - question
     - opponent wallet
     - stake amount
     - deadline

2. **Deposit Funds**
   - Creator deposits SOL into escrow

3. **Accept Bet**
   - Opponent accepts and deposits matching SOL

4. **Resolve Bet**
   - After deadline, creator selects winner

5. **Claim Payout**
   - Winner withdraws total pooled SOL

---

## Tech Stack

- **Blockchain:** Solana (Devnet)
- **Smart Contracts:** Anchor (Rust)
- **Frontend:** (Next.js / React – in progress)
- **Wallet Integration:** Phantom / Solflare

