# Friend Bet – Solana Betting dApp

## Overview

Friend Bet is a decentralized peer-to-peer betting application built on the Solana blockchain. It allows users to create and accept bets directly with one another without relying on a centralized intermediary. All transactions and bet logic are executed on-chain through a smart contract, ensuring transparency and trust.

## Features

Users can create a bet by defining a custom question, selecting an opponent using their Solana public key, setting a stake amount, and choosing a deadline. The application supports peer-to-peer bet acceptance, escrow-based fund locking, and on-chain settlement of outcomes. The system is designed as a minimal viable product focused on core betting functionality.

## How It Works

A user creates a bet by submitting the required parameters through the frontend. The program generates a Program Derived Address (PDA) that acts as an escrow account for the bet. The creator’s stake is transferred into this account.

The opponent can then accept the bet by submitting a matching stake. Once both parties have contributed, the bet becomes active.

At resolution, the outcome is submitted and the smart contract transfers the total pooled funds to the winner.

## Architecture

The smart contract is written in Rust using the Anchor framework and is deployed on the Solana blockchain. It manages bet creation, escrow handling, and settlement logic.

The frontend is built using a modern JavaScript framework and integrates with Solana wallets such as Phantom for transaction signing.

The application interacts with the Solana devnet for testing and development.

## Tech Stack

Solana blockchain
Anchor framework (Rust)
JavaScript/TypeScript frontend
Phantom wallet integration

## Project Structure

program contains the smart contract logic written in Rust
app contains the frontend application
idl contains the interface definition used to connect the frontend to the smart contract

## Current Limitations

The outcome of bets is currently resolved manually and is not connected to an external oracle.
There is no dispute resolution mechanism implemented.
The application is deployed on devnet and not yet production-ready.

## Future Improvements

Integrate an oracle such as Chainlink for automatic bet resolution
Add dispute resolution mechanisms
Improve frontend user experience and validation
Deploy to mainnet after security testing and auditing

## Running Locally

Install dependencies for both the program and frontend
Start a local Solana validator or connect to devnet
Deploy the smart contract using Anchor
Run the frontend development server and connect a wallet to begin testing
