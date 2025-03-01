'use client'

import {Connector, useAccount, useConnect, useDisconnect} from 'wagmi'
import {useEffect} from "react";

interface AccountData {
    status: string;
    addresses: readonly string[];
    chainId: number;
}

function App() {

    const account = useAccount()
    const {connectors, connect} = useConnect()
    const {disconnect} = useDisconnect()

    useEffect(() => {
        if (account.status === 'connected') {
            const accountData: AccountData = {
                status: account.status,
                addresses: account.addresses,
                chainId: account.chainId,
            };

            sendAccountToBackend(accountData)
            .then(() => window.location.href = 'http://horniverse.ai/game');
        }
    }, [account.status]);

    const sendAccountToBackend = async (accountData: AccountData) => {
        try {
            const response = await fetch('http://horniverse.ai/game/wallet-login', {
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

    const onSignIn = async ({connector}: { connector: any }) => {
        try {
            await connect(connector);

            console.log(account);
        } catch (err) {
            console.error(err);
        }
    }

    const onSignOut = async () => {
        try {
            await disconnect();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            {account.status !== 'connected'
                &&
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "fit-content",
                    margin: "17rem auto 0 auto",
                    gap: "1rem",
                    alignItems: "stretch",
                }}>
                    {connectors.map((connector) => (
                        <button
                            style={{
                                borderRadius: '25px',
                                backgroundColor: '#51a8ef',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'background-color 0.3s ease',
                                width: '100%',
                                textAlign: 'center',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4795d5'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#51a8ef'}
                            key={connector.uid}
                            onClick={() => onSignIn({connector: {connector}})}
                            type="button"
                        >
                            Войти через {connector.name}
                        </button>
                    ))}
                </div>
            }
        </div>
    )
}

export default App
