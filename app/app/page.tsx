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
  }, [program, wallet]);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Friend Bet</h1>
      <p className="mt-2">Connect wallet to start</p>
      <div className="mt-4">{mounted ? <WalletMultiButton /> : null}</div>
    </div>
  );
}