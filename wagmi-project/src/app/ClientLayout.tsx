'use client';

import {FC, ReactNode, useState} from 'react';
import {SolanaProvider} from '@/providers/SolanaProvider';
import {WagmiProvider} from "wagmi";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {getConfig} from "@/wagmi";

interface IClientLayoutProps {
    children: ReactNode;
    initialState?: State;
}

export const ClientLayout: FC<IClientLayoutProps> = ({
                                                         children,
                                                         initialState
                                                     }) => {
        const [config] = useState(() => getConfig())
        const [queryClient] = useState(() => new QueryClient())

        return (
            <SolanaProvider>
                <WagmiProvider config={config} initialState={initialState}>
                    <QueryClientProvider client={queryClient}>
                        {children}
                    </QueryClientProvider>
                </WagmiProvider>
            </SolanaProvider>
        );
    }
;
