import { FC, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import idl from "./vault_program.json";

// Define interfaces matching your IDL structure
interface VaultState {
  vaultBump: number;
  stateBump: number;
}

interface VaultProgramIDL {
  version: string;
  name: string;
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      writable?: boolean;
      signer?: boolean;
      pda?: {
        seeds: Array<{
          kind: string;
          value?: number[];
          path?: string;
        }>;
      };
    }>;
    args: Array<{
      name: string;
      type: string;
    }>;
  }>;
  accounts: Array<{
    name: string;
    discriminator: number[];
  }>;
  types: Array<{
    name: string;
    type: {
      kind: string;
      fields: Array<{
        name: string;
        type: string;
      }>;
    };
  }>;
}

export const Bank: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const programId = new PublicKey(
    "CatTg5QoJNvZFcKiL3aQGBeuiE3i1F2GZRUj1qZCWYuN"
  );

  const getProvider = useCallback(() => {
    if (!wallet || !connection) return null;
    return new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  const initializeVault = async () => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const provider = getProvider();
      if (!provider) {
        toast.error("Provider not initialized");
        return;
      }

      const program = new Program(idl as any, programId, provider);

      // Derive PDAs
      const [state] = PublicKey.findProgramAddressSync(
        [Buffer.from("state"), wallet.publicKey.toBytes()],
        program.programId
      );

      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), state.toBytes()],
        program.programId
      );

      const tx = await program.methods
        .initialize()
        .accounts({
          signer: wallet.publicKey,
          state,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      toast.success("Vault initialized successfully!");
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error(`Failed to initialize vault: ${error.message}`);
    }
  };

  const deposit = async () => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const provider = getProvider();
      if (!provider) {
        toast.error("Provider not initialized");
        return;
      }

      const program = new Program(idl as any, programId, provider);

      // Derive PDAs
      const [state] = PublicKey.findProgramAddressSync(
        [Buffer.from("state"), wallet.publicKey.toBytes()],
        program.programId
      );

      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), state.toBytes()],
        program.programId
      );

      const amount = new BN(0.1 * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .deposit(amount)
        .accounts({
          signer: wallet.publicKey,
          state,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      toast.success("Deposit successful!");
    } catch (error) {
      console.error("Deposit error:", error);
      if (error.message?.includes("custom program error: 0x0")) {
        toast.error("Vault not initialized. Initializing...");
        await initializeVault();
      } else {
        toast.error(`Deposit failed: ${error.message}`);
      }
    }
  };

  const withdraw = async (amount: number) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const provider = getProvider();
      if (!provider) {
        toast.error("Provider not initialized");
        return;
      }

      const program = new Program(idl as any, programId, provider);

      const [state] = PublicKey.findProgramAddressSync(
        [Buffer.from("state"), wallet.publicKey.toBytes()],
        program.programId
      );

      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), state.toBytes()],
        program.programId
      );

      const lamportsAmount = new BN(amount * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .withdraw(lamportsAmount)
        .accounts({
          signer: wallet.publicKey,
          state,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      toast.success("Withdrawal successful!");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error(`Withdrawal failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-row justify-center gap-4">
        <div className="relative group">
          <div
            className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
              rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
          ></div>
          <button
            className="relative group w-60 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={() => deposit()}
            disabled={!wallet.publicKey}
          >
            <div className="hidden group-disabled:block">
              Wallet not connected
            </div>
            <span className="block group-disabled:hidden">Deposit 0.1 SOL</span>
          </button>
        </div>

        <div className="relative group">
          <div
            className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
              rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
          ></div>
          <button
            className="relative group w-60 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={() => withdraw(0.1)}
            disabled={!wallet.publicKey}
          >
            <div className="hidden group-disabled:block">
              Wallet not connected
            </div>
            <span className="block group-disabled:hidden">
              Withdraw 0.1 SOL
            </span>
          </button>
        </div>
      </div>

      <div className="relative group">
        <div
          className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
            rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
        ></div>
        <button
          className="relative group w-60 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={initializeVault}
          disabled={!wallet.publicKey}
        >
          <div className="hidden group-disabled:block">
            Wallet not connected
          </div>
          <span className="block group-disabled:hidden">Initialize Vault</span>
        </button>
      </div>

      <ToastContainer />
    </div>
  );
};
