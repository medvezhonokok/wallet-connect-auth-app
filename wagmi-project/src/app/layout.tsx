import './globals.css'
import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import {headers} from 'next/headers'
import {type ReactNode} from 'react'
import {cookieToInitialState} from 'wagmi'

import {getConfig} from '@/wagmi'
import {Index} from './index'

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: 'WalletConnect Auth App',
    description: 'todo....',
}

export default function RootLayout(props: { children: ReactNode }) {
    const initialState = cookieToInitialState(
        getConfig(),
        headers().get('cookie'),
    )
    return (
        <html lang="en">
        <body className={inter.className}>
        <Index initialState={initialState}>{props.children}</Index>
        </body>
        </html>
    )
}
