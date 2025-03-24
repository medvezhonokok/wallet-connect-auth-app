'use client';
import {useWallet} from '@solana/wallet-adapter-react';
import {useEffect, useState} from 'react';
import {WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import {Loader} from '@/components/Loader';
import {BalancePage, getTokenFromCookies} from '@/components/BalancePage';
import {useSearchParams} from 'next/navigation';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const sendAccountToBackend = async (publicKey: string) => {
    const accountData = {
        status: "connected",
        addresses: [publicKey],
        chainId: 1
    };

    try {
        const response = await fetch(`${backendUrl}/wallet-login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(accountData),
            credentials: 'include',
        });

        const result = await response.json();
        if (result.token) {
            localStorage.setItem('token', result.token);
        }

        console.log('OK', result);
    } catch (err) {
        console.error('Error sending account to backend:', err);
    }
};

const IndexPage = () => {
    const searchParams = useSearchParams();
    const {publicKey, connected, disconnect, connecting} = useWallet();
    const redirectUrl = searchParams.get('redirect_url');

    const [mounted, setMounted] = useState(false);
    const [sending, setSending] = useState(Boolean(getTokenFromCookies()));

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && connected && publicKey && !sending) {
            sendAccountToBackend(publicKey.toBase58()).then(() => {
                if (redirectUrl) window.location.href = redirectUrl;
                setSending(true);
            });
        }
    }, [mounted, connected, publicKey]);

    const handleLogout = async () => {
        await disconnect(); // Отключение кошелька
        localStorage.removeItem('token');
    };

    if (!mounted) return null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: 'fit-content',
            gap: '1rem',
            alignItems: 'stretch'
        }}>
            {!connected && !sending ? (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "fit-content",
                    gap: "1rem",
                    alignItems: "stretch",
                }}>
                    <div className="child_button">
                        <WalletMultiButton>Login by Solana Wallet</WalletMultiButton>
                    </div>
                    {connecting && <Loader/>}
                </div>
            ) : (
                <BalancePage handleLogout={handleLogout}/>
            )}
        </div>
    );
};

export default IndexPage;
