'use client'

import {Connector, useAccount, useConnect, useDisconnect} from 'wagmi';
import {Loader} from './Loader';
import {useEffect} from "react";

interface AccountData {
    status: string;
    addresses: readonly string[];
    chainId: number;
}

const Connectors = ({connectors, handleClick}) => {
    return (<>
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
                onClick={() => handleClick(({connector: {connector}}))}
                type="button"
            >
                Войти через {connector.name}
            </button>
        ))}
    </>)
}

function App() {
    const account = useAccount()
    const {connectors, connect, connectAsync, isPending} = useConnect();
    const {disconnect} = useDisconnect()

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        if (account.status === 'connected') {
            const accountData: AccountData = {
                status: account.status,
                addresses: account.addresses,
                chainId: account.chainId,
            };

            sendAccountToBackend(accountData)
            .then(() => window.location.href = `${backendUrl}/game`);
        }
    }, [account.status]);

    const sendAccountToBackend = async (accountData: AccountData) => {
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

    const onSignIn = ({connector}: { connector: any }) => {
        try {
            connect(connector);

            console.log(account);
        } catch (err) {
            console.info(err);
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
        <>
            {account.status !== 'connected'
                &&
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "fit-content",
                    gap: "1rem",
                    alignItems: "stretch",
                }}>
                    <Connectors connectors={connectors} handleClick={onSignIn}/>
                    {isPending && <Loader/>}
                </div>
            }
        </>
    )
}

export default App
