'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const oneGameCount = parseFloat(process.env.NEXT_PUBLIC_ONE_GAME_COUNT || '1');
const TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT!);
const OWNER_WALLET = new PublicKey(process.env.NEXT_PUBLIC_OWNER_WALLET!);
const DEV_WALLET = new PublicKey(process.env.NEXT_PUBLIC_DEV_WALLET!);

const getTokenFromCookies = () => {
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null;
};

const BalancePage = () => {
    const { publicKey, connected, signTransaction } = useWallet();
    const { connection } = useConnection();
    const [balance, setBalance] = useState<number | null>(null);
    const [tokensCount, setTokensCount] = useState<number>(1);

    useEffect(() => {
        if (connected && publicKey) {
            fetch(`${backendApiUrl}/user?token=${getTokenFromCookies()}`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => setBalance(data.coins || 0))
                .catch(err => console.error('Error fetching balance:', err));
        }
    }, [connected, publicKey]);

    const handleWithdraw = async () => {
        if (!publicKey || !signTransaction) return alert("Please connect your wallet.");

        try {
            const tokenPriceInUSD = await fetch(`https://api.dexscreener.io/latest/dex/tokens/${TOKEN_MINT}`)
                .then(res => res.json())
                .then(data => parseFloat(data.pairs?.[0]?.priceUsd || '0'));

            if (!tokenPriceInUSD) throw new Error("Failed to get token price");

            const amountToTransfer = (tokensCount * oneGameCount) / tokenPriceInUSD;
            const holdAmount = Math.round((amountToTransfer * 60) / 100);
            const ownerAmount = Math.round((amountToTransfer * 40) / 100);

            const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
            const devTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, DEV_WALLET);
            const ownerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, OWNER_WALLET);

            const transaction = new Transaction().add(
                createTransferInstruction(userTokenAccount, devTokenAccount, publicKey, ownerAmount),
                createTransferInstruction(userTokenAccount, ownerTokenAccount, publicKey, holdAmount)
            );

            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await signTransaction(transaction);

            const response = await fetch(`${backendApiUrl}/api/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signedTransaction: signedTransaction.serialize().toString('base64'),
                    userAddress: publicKey.toBase58(),
                    tokens: tokensCount * oneGameCount
                }),
            });

            const result = await response.json();
            if (result.success) {
                alert(`Transaction successful! Signature: ${result.signature}`);
            } else {
                alert(`Transaction failed: ${result.message}`);
            }
        } catch (error) {
            console.error("Transaction error:", error);
            alert("Transaction failed.");
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: "center", color: 'white' }}>
            <h2>Balance: {balance !== null ? `${balance} coins` : '...'}</h2>
            <span>
                Buy <input
                type="number"
                value={tokensCount}
                onChange={(event) => setTokensCount(Number(event.target.value))}
                style={{ width: '40px' }}
            /> coin ({(tokensCount * oneGameCount).toFixed(1)}$)
            </span>
            <button className="button" onClick={handleWithdraw} disabled={!connected}>
                Buy
            </button>
        </div>
    );
};

export default BalancePage;
