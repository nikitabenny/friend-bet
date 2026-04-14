"use client";

import { useEffect, useMemo, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../../src/idl/program.json";

export default function Home() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new AnchorProvider(connection, wallet as any, {
      preflightCommitment: "processed",
    });

    return new Program(idl as any, provider);
  }, [connection, wallet]);

  useEffect(() => {
    if (!program || !wallet.publicKey) return;

    console.log("Wallet:", wallet.publicKey.toString());
    console.log("Program:", program);

    const createBetIx = (idl as any).instructions.find(
      (ix: any) => ix.name === "createBet"
    );

    console.log("createBet instruction:", createBetIx);
  }, [program, wallet]);

  const handleCreateBet = async () => {
    if (!program || !wallet.publicKey) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setStatus("Ready to call createBet, but we need the exact args/accounts.");
      console.log("Program methods:", program.methods);
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong. Check console.");
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Friend Bet</h1>
      <p className="mt-2">Connect wallet to start</p>

      <div className="mt-4">
        {mounted ? <WalletMultiButton /> : null}
      </div>

      <button
        onClick={handleCreateBet}
        className="mt-6 rounded bg-white px-4 py-2 text-black disabled:opacity-50"
        disabled={!wallet.publicKey}
      >
        Create Bet
      </button>

      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
}