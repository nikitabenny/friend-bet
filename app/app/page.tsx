"use client";

import { useEffect, useMemo, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import idl from "../../src/idl/program.json";

export default function Home() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("");

  const [question, setQuestion] = useState("");
  const [opponentInput, setOpponentInput] = useState("");
  const [stakeSol, setStakeSol] = useState("0.01");
  const [durationHours, setDurationHours] = useState("24");
  const [lastTx, setLastTx] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;

    const provider = new AnchorProvider(connection, wallet as any, {
      preflightCommitment: "processed",
    });

    return new Program(idl as any, provider);
  }, [connection, wallet]);

  const handleCreateBet = async () => {
    if (!program || !wallet.publicKey) {
      setStatus("Connect wallet first");
      return;
    }

    try {
      setStatus("Creating bet...");
      setLastTx("");

      if (!question.trim()) {
        throw new Error("Enter a question");
      }

      let opponent: PublicKey;
      try {
        opponent = new PublicKey(opponentInput.trim());
      } catch {
        throw new Error("Enter a valid opponent public key");
      }

      if (opponent.equals(wallet.publicKey)) {
        throw new Error("Opponent cannot be your own wallet");
      }

      const stakeLamportsNum = Math.floor(Number(stakeSol) * 1_000_000_000);
      if (!Number.isFinite(stakeLamportsNum) || stakeLamportsNum <= 0) {
        throw new Error("Enter a valid stake amount");
      }

      const hours = Number(durationHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        throw new Error("Enter a valid duration in hours");
      }

      const betId = new BN(Date.now()).add(new BN(Math.floor(Math.random() * 1000)));
      const stakeLamports = new BN(stakeLamportsNum);
      const deadlineTs = new BN(Math.floor(Date.now() / 1000) + hours * 3600);

      const [betPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bet"),
          wallet.publicKey.toBuffer(),
          betId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const tx = await (program as any).methods
        .createBet(betId, question.trim(), opponent, stakeLamports, deadlineTs)
        .accounts({
          creator: wallet.publicKey,
          bet: betPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("tx signature:", tx);
      console.log("bet PDA:", betPda.toString());

      setLastTx(tx);
      setStatus("Bet created successfully");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Failed to create bet");
    }
  };

  return (
    <div className="p-10 max-w-2xl">
      <h1 className="text-2xl font-bold">Friend Bet</h1>
      <p className="mt-2">Create a bet with a friend on Solana devnet.</p>

      <div className="mt-4">
        {mounted ? <WalletMultiButton /> : null}
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <label className="block text-sm mb-1">Question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will BTC hit 100k by Friday?"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Opponent public key</label>
          <input
            value={opponentInput}
            onChange={(e) => setOpponentInput(e.target.value)}
            placeholder="Paste your friend's Solana public key"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Stake (SOL)</label>
          <input
            value={stakeSol}
            onChange={(e) => setStakeSol(e.target.value)}
            placeholder="0.01"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Duration (hours)</label>
          <input
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            placeholder="24"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button
          onClick={handleCreateBet}
          disabled={!wallet.publicKey}
          className="rounded bg-white px-4 py-2 text-black disabled:opacity-50"
        >
          Create Bet
        </button>

        {status && <p className="text-sm">{status}</p>}

        {lastTx && (
          <p className="text-sm break-all">
            Tx: {lastTx}
          </p>
        )}
      </div>
    </div>
  );
}