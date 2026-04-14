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
    if (!wallet.publicKey || !wallet.signTransaction) return null;

    const provider = new AnchorProvider(connection, wallet as any, {
      preflightCommitment: "processed",
    });

    return new Program(idl as any, provider);
  }, [connection, wallet]);

  useEffect(() => {
    if (!program || !wallet.publicKey) return;

    console.log("Wallet:", wallet.publicKey.toString());
    console.log("Program:", program);

    console.log(
      "all instruction names:",
      (idl as any).instructions?.map((ix: any) => ix.name)
    );

    console.log("all instructions:", (idl as any).instructions);

    console.log("program method keys:", Object.keys((program as any).methods));

    console.log(
      "createBet method exists:",
      !!(program as any).methods?.createBet
    );

    console.log("Program methods:", (program as any).methods);
  }, [program, wallet]);

  const handleCreateBet = async () => {
    if (!program || !wallet.publicKey) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      const createBetExists = !!(program as any).methods?.createBet;

      if (!createBetExists) {
        setStatus("createBet method not found on program.methods.");
        return;
      }

      setStatus(
        "createBet method found. Next step: add the exact args and accounts."
      );

      console.log("Ready to call:", (program as any).methods.createBet);

      // Example shape once you know the exact Rust instruction signature:
      //
      // const tx = await (program as any).methods
      //   .createBet(arg1, arg2, arg3)
      //   .accounts({
      //     creator: wallet.publicKey,
      //     bet: betPda,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .rpc();
      //
      // console.log("tx:", tx);
      // setStatus(`Success: ${tx}`);
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong. Check console.");
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Friend Bet</h1>
      <p className="mt-2">Connect wallet to start</p>

      <div className="mt-4">{mounted ? <WalletMultiButton /> : null}</div>

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