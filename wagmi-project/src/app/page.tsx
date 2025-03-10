'use client';

import {useWallet} from '@solana/wallet-adapter-react';
import {useEffect} from 'react';
import {WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import {Loader} from '@/components/Loader';
import {useAccount, useConnect, useDisconnect} from "wagmi";
import {Connectors} from '@/components/Connector'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const sendAccountToBackend = async (publicKey: string) => {
    const accountData = {
        status: "connected",
        addresses: [publicKey], // Solana publicKey в формате Ethereum-адресов
        chainId: 1 // Можно оставить заглушку, так как в Solana нет chainId
    };

    try {
        const response = await fetch(`${backendUrl}/wallet-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(accountData),
            credentials: 'include',
        });

        const result = await response.json();

        if (result.token) {
            document.cookie = `token=${result.token}; path=/; secure; samesite=strict`;
        }

        console.log('OK', result);
    } catch (err) {
        console.error('Error sending account to backend:', err);
    }
};
const sendWagmiAccountToBackend = async (accountData) => {
    try {
        const response = await fetch(`${backendUrl}/game/wallet-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(accountData),
            credentials: 'include'
        });

        const result = await response.json();
        console.log('OK', result);
    } catch (err) {
        console.error('err', err);
    }
};

const IndexPage = () => {
    const account = useAccount();
    const {connectors, connect, isPending} = useConnect();
    const {disconnect} = useDisconnect();
    const {publicKey, connected, connecting} = useWallet();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        if (account.status === 'connected') {
            const accountData = {
                status: account.status,
                addresses: account.addresses,
                chainId: account.chainId,
            };

            sendWagmiAccountToBackend(accountData)
            .then(() => window.location.href = `${backendUrl}/game`);
        }

        if (connected && publicKey) {
            sendAccountToBackend(publicKey.toBase58()).then(() => {
                window.location.href = `${backendUrl}/game`;
            });
        }
    }, [account.status, connected, publicKey]);

    const onSignIn = ({connector}: { connector: any }) => {
        try {
            connect(connector);

            console.log(account);
        } catch (err) {
            console.info(err);
        }
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: 'fit-content',
            gap: '1rem',
            alignItems: 'stretch'
        }}>
            {account.status !== 'connected' && !connected
                &&
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "fit-content",
                    gap: "1rem",
                    alignItems: "stretch",
                }}>
                    <Connectors connectors={connectors} handleClick={onSignIn}/>
                    <div className="child_button">
                        <WalletMultiButton>Login by Other</WalletMultiButton>
                    </div>
                    {(isPending || connecting) && <Loader/>}
                </div>
            }
        </div>
    );
};

export default IndexPage;
