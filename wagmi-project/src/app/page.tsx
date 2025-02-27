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
                .finally(() => window.location.href = 'https://uni.ekaterinabeska.com');
        }
    }, [account.status]);

    const sendAccountToBackend = async (accountData: AccountData) => {
        try {
            const response = await fetch('https://uni.ekaterinabeska.com/wallet-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(accountData),
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
            {account.status === 'connected'
                ?
                <>
                    <h2>Данные об аккаунте</h2>
                    <div>
                        статус: {account.status}
                        <br/>
                        адрес(-а): {JSON.stringify(account.addresses)}
                        <br/>
                        chainId: {account.chainId}
                    </div>

                    {account.status === 'connected' && (
                        <button type="button" onClick={() => onSignOut()}>
                            Выйти
                        </button>
                    )}
                </>
                :
                <><h2>Авторизоваться через</h2>
                    {connectors.map((connector) => (
                        <button
                            key={connector.uid}
                            onClick={() => onSignIn({connector: {connector}})}
                            type="button"
                        >
                            {connector.name}
                        </button>
                    ))}</>
            }
        </div>
    )
}

export default App
