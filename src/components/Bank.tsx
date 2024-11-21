import { FC, useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import idl from "./bank.json";
import { Bank } from "./bank";
import {
  Program,
  AnchorProvider,
  web3,
  utils,
  BN,
  setProvider,
} from "@coral-xyz/anchor";

const idl_string = JSON.stringify(idl);

const idl_object = JSON.parse(idl_string);
const programId = new PublicKey(idl.address);

export const BankV: FC = () => {
  const { connection } = useConnection();

  const wallet = useWallet();
  const [banks, setBanks] = useState([]);

  const getProvider = () => {
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    setProvider(provider);
    return provider;
  };

  const createBank = async () => {
    try {
      const anchorProvider = getProvider();
      const program = new Program<Bank>(idl_object, anchorProvider);
      // this creates using the accounts and anchor derives the bank pda and system program
      await program.methods
        .create("Merem Bank")
        .accounts({
          user: anchorProvider.publicKey,
        })
        .rpc();

      // this is how to get and derived the accounts incase needed using account strict method
      // const [bank] = PublicKey.findProgramAddressSync(
      //   [
      //     utils.bytes.utf8.encode("bankaccount"),
      //     anchorProvider.publicKey.toBuffer(),
      //   ],
      //   program.programId
      // );

      // await program.methods.create("Merem Bank").accountsStrict({
      //   bank,
      //   user: anchorProvider.publicKey,
      //   systemProgram: web3.SystemProgram.programId,
      // });
      toast.success("Welcome to Merem Bank");
    } catch (error) {
      console.log("Error while creating a bank:" + error);
    }
  };

  const getBanks = async (publicKey) => {
    try {
      const anchProvider = getProvider();
      const program = new Program<Bank>(idl_object, anchProvider);
      Promise.all(
        (await connection.getParsedProgramAccounts(programId)).map(
          async (bank) => ({
            ...(await program.account.bank.fetch(bank.pubkey)),
            pubkey: bank.pubkey,
          })
        )
      ).then((banks) => {
        console.log(banks);
        setBanks(banks);
      });
      toast.success("Account Details Fetched");
    } catch (error) {
      console.error("Error while getting banks: " + error);
      toast.error("Error while getting bank details:" + error);
    }
  };

  const depositBank = async (publicKey) => {
    try {
      const anchorProvider = getProvider();
      const program = new Program<Bank>(idl_object, anchorProvider);

      await program.methods
        .deposit(new BN(0.1 * web3.LAMPORTS_PER_SOL))
        .accounts({
          bank: publicKey,
          user: anchorProvider.publicKey,
        })
        .rpc();

      toast.success("Deposit confirmed" + publicKey);
    } catch (error) {
      console.log("Error while depositing in bank:" + error);

      toast.error("Error while depositing in bank:");
    }
  };

  const withdrawBank = async (publicKey) => {
    try {
      const anchorProvider = getProvider();
      const program = new Program<Bank>(idl_object, anchorProvider);

      await program.methods
        .withdraw(new BN(0.1 * web3.LAMPORTS_PER_SOL))
        .accounts({
          bank: publicKey,
          user: anchorProvider.publicKey,
        })
        .rpc();

      toast.success("Withdraw confirmed for " + publicKey);

      // Refresh banks after withdrawal
      await getBanks(anchorProvider.publicKey);
    } catch (error) {
      console.log("Error while Withdrawing from bank:", error);
      toast.error("Error while Withdrawing from bank: " + error.message);
    }
  };
  return (
    <div>
      {banks.map((bank) => {
        return (
          // eslint-disable-next-line react/jsx-key
          <div className="md:hero-content flex flex-col">
            <h1>{bank.name.toString()}</h1>
            <span>{bank.balance.toString() / web3.LAMPORTS_PER_SOL}</span>
            <button
              className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
              onClick={() => depositBank(bank.pubkey)}
            >
              <span>Deposit 0.1</span>
            </button>
          </div>
        );
      })}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-row justify-center">
          {banks.map((bank) => {
            return (
              <div
                key={bank.pubkey.toString()}
                className="md:hero-content flex flex-col"
              >
                <button
                  className="group w-60  btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                  onClick={() => withdrawBank(bank.pubkey)}
                >
                  <span>Withdraw 0.1</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="relative group">
          <div
            className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
            rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
          ></div>
          <button
            className="relative group w-60 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={createBank}
            disabled={!wallet.publicKey}
          >
            <div className="hidden group-disabled:block">
              Wallet not connected
            </div>
            <span className="block group-disabled:hidden">Create Account</span>
          </button>
        </div>
        <div className="relative group">
          <div
            className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
            rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
          ></div>
          <button
            className="relative group w-60 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
            onClick={getBanks}
            disabled={!wallet.publicKey}
          >
            <div className="hidden group-disabled:block">
              Wallet not connected
            </div>
            <span className="block group-disabled:hidden">Account details</span>
          </button>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};
