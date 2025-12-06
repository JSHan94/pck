import React, { useState, useEffect } from "react";
import { getVaultState, lockAndMint, burnAndWithdraw, VaultState } from "../mocks/vaultMock";
import { useWallets } from "@privy-io/react-auth";
import { useCurrentAccount } from "../lib/wallet";

const VaultView: React.FC = () => {
    const [state, setState] = useState<VaultState>({ lockedM: 0, userPmBalance: 0 });
    const { wallets } = useWallets();
    const account = useCurrentAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [lockAmount, setLockAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        loadState();
    }, []);

    const loadState = async () => {
        const data = await getVaultState();
        setState(data);
    };

    const handleLock = async () => {
        if (!lockAmount || isNaN(Number(lockAmount))) {
            setStatusMessage("Please enter a valid amount");
            return;
        }

        const activeWallet = wallets.find((w) => w.address === account?.address);
        if (!activeWallet) {
            setStatusMessage("Please connect your wallet first");
            return;
        }

        setIsLoading(true);
        setStatusMessage("Sending transaction to burn address...");
        try {
            // 1. Send transaction to 0x1
            const amountWei = "0x" + BigInt(Math.floor(Number(lockAmount) * 1e18)).toString(16);
            const provider = await activeWallet.getEthereumProvider();

            setStatusMessage("Please confirm the transaction in your wallet...");

            await provider.request({
                method: "eth_sendTransaction",
                params: [{
                    from: account?.address,
                    to: "0x0000000000000000000000000000000000000001",
                    value: amountWei,
                }]
            });

            setStatusMessage(`Transaction sent! Minting $pM...`);

            const newState = await lockAndMint(Number(lockAmount));
            setState(newState);
            setStatusMessage("Success! $pM minted.");
            setLockAmount("");
        } catch (error: any) {
            console.error(error);
            setStatusMessage(`Error: ${error.message || "Transaction failed"}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
            setStatusMessage("Please enter a valid amount");
            return;
        }
        setIsLoading(true);
        setStatusMessage("Burning $pM and withdrawing $M...");
        try {
            const newState = await burnAndWithdraw(Number(withdrawAmount));
            setState(newState);
            setStatusMessage("Success! $M withdrawn.");
            setWithdrawAmount("");
        } catch (error: any) {
            setStatusMessage(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-slide-up space-y-8">
            <div className="nes-container with-title is-centered">
                <p className="title">Token Vault</p>
                <div className="flex flex-col items-center gap-4">
                    <i className="nes-icon coin is-large"></i>
                    <p className="text-center">
                        Lock your $M tokens to mint $pM (Pegged Meme) tokens.
                        <br />
                        Use $pM for exclusive features and governance.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Lock Section */}
                <div className="nes-container with-title is-dark">
                    <p className="title">Mint $pM</p>
                    <div className="space-y-4">
                        <div className="nes-field">
                            <label htmlFor="lock_amount">Amount to Lock ($M)</label>
                            <input
                                type="number"
                                id="lock_amount"
                                className="nes-input is-dark"
                                value={lockAmount}
                                onChange={(e) => setLockAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            type="button"
                            className={`nes-btn is-primary w-full ${isLoading ? "is-disabled" : ""}`}
                            onClick={handleLock}
                            disabled={isLoading}
                        >
                            {isLoading ? "Processing..." : "Lock & Mint"}
                        </button>
                        <p className="text-xs text-gray-400">
                            Rate: 1 $M = 1 $pM
                        </p>
                    </div>
                </div>

                {/* Withdraw Section */}
                <div className="nes-container with-title">
                    <p className="title">Withdraw $M</p>
                    <div className="space-y-4">
                        <div className="nes-field">
                            <label htmlFor="withdraw_amount">Amount to Burn ($pM)</label>
                            <input
                                type="number"
                                id="withdraw_amount"
                                className="nes-input"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            type="button"
                            className={`nes-btn is-error w-full ${isLoading ? "is-disabled" : ""}`}
                            onClick={handleWithdraw}
                            disabled={isLoading}
                        >
                            {isLoading ? "Processing..." : "Burn & Withdraw"}
                        </button>
                        <p className="text-xs text-gray-500">
                            Rate: 1 $pM = 1 $M
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="nes-container is-rounded">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500">Your $pM Balance</p>
                        <p className="text-2xl text-primary">{Math.max(0, state.userPmBalance).toFixed(4)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Locked $M</p>
                        <p className="text-2xl">{Math.max(0, state.lockedM).toFixed(4)}</p>
                    </div>
                </div>
            </div>

            {statusMessage && (
                <div className="nes-container is-rounded is-centered bg-blue-50 dark:bg-blue-900/20">
                    <p>{statusMessage}</p>
                </div>
            )}
        </div>
    );
};

export default VaultView;
