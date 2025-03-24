'use client';
import {useWallet} from '@solana/wallet-adapter-react';
import {useEffect, useState} from 'react';
import {WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import {Loader} from '@/components/Loader';
import {BalancePage, getTokenFromCookies} from '@/components/BalancePage';
import {useSearchParams, useRouter} from 'next/navigation';

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
            document.cookie = `token=${result.token}; domain=horniverse.ai;`;
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
    const router = useRouter();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && connected && publicKey) {
            sendAccountToBackend(publicKey.toBase58()).then(() => {
                if (redirectUrl) window.location.href = redirectUrl;
            });
        }
    }, [mounted, connected, publicKey]);

    const handleLogout = async () => {
        await disconnect(); // Отключение кошелька
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        localStorage.removeItem('token');
        await fetch(`${backendUrl}/logout`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
        });
        router.push('/');
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
            {!connected ? (
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
