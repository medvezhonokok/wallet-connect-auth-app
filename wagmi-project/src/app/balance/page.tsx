'use client';

import {useWallet} from '@solana/wallet-adapter-react';
import {useEffect, useRef, useState} from 'react';

const nextPublicNextApiUrl = process.env.NEXT_PUBLIC_NEXT_API_URL;
const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const oneGameCount = process.env.NEXT_PUBLIC_ONE_GAME_COUNT;

const getTokenFromCookies = () => {
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null; // Возвращает токен, если он есть
};


const BalancePage = () => {
    const {publicKey, connected} = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [tokensCount, setTokensCount] = useState<number>(1);

    useEffect(() => {
        if (connected && publicKey) {
            fetch(`${backendApiUrl}/user?token=${getTokenFromCookies()}`, {
                credentials: 'include',
            })
                .then(res => res.json())
                .then(data => setBalance(data.coins || 0))
                .catch(err => console.error('Error fetching balance:', err));
        }
    }, [connected, publicKey]);

    const handleWithdraw = async () => {
        if (!publicKey) return;
        try {
            const res = await fetch(`${nextPublicNextApiUrl}/transaction`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userAddress: publicKey.toBase58(), tokens: tokensCount * oneGameCount})
            });
            console.log('Withdraw response:', res);
            const result = await res.json();
            console.log('Withdraw response:', result);
        } catch (err) {
            console.error('Withdraw error:', err);
        }
    };

    return (
        <div style={{
            textAlign: 'center',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: "center"
        }}>
            <h2>Balance: {balance !== null ? `${balance} coins` : '...'}</h2>
            <span>
                Buy <input
                type="number"
                value={tokensCount}
                onChange={(event) => setTokensCount(event.target.value)}
                style={{width: '40px'}}
            /> coin ({(tokensCount * oneGameCount).toFixed(1)}$)</span>
            <button
                className={'button'} onClick={handleWithdraw} disabled={!connected}>
                Buy
            </button>
        </div>
    );
};

export default BalancePage;
