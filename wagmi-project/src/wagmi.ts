import {http, cookieStorage, createConfig, createStorage} from 'wagmi'
import {mainnet, sepolia} from 'wagmi/chains'
import {walletConnect, metaMask} from 'wagmi/connectors'

export function getConfig() {
    return createConfig({
        chains: [mainnet, sepolia],
        connectors: [
            walletConnect({projectId: '38b01666267679af3b51542eee4e9d64'}),
            metaMask()
        ],
        storage: createStorage({
            storage: cookieStorage,
        }),
        ssr: true,
        transports: {
            [mainnet.id]: http(),
            [sepolia.id]: http(),
        },
    })
}

declare module 'wagmi' {
    interface Register {
        config: ReturnType<typeof getConfig>
    }
}
