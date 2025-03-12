import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC!;
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
const connection = new Connection(SOLANA_RPC, 'confirmed');

export async function POST(req: NextRequest) {
    try {
        const { signedTransaction, userAddress, tokens } = await req.json();

        if (!signedTransaction || !userAddress || !tokens) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Отправка транзакции в блокчейн
        const signature = await connection.sendRawTransaction(
            Buffer.from(signedTransaction, 'base64'),
            { skipPreflight: false, preflightCommitment: 'confirmed' }
        );

        // Обновление баланса пользователя в бэкенде
        const response = await fetch(`${BACKEND_API_URL}/user/add_coins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress, tokens })
        });

        if (!response.ok) {
            console.error('Failed to add attemps on backend:', response.statusText);
            return NextResponse.json({ error: 'Failed to update user attemps' }, { status: 500 });
        }

        return NextResponse.json({ success: true, signature });
    } catch (error) {
        console.error('Error processing transaction:', error);
        return NextResponse.json({ error: 'Transaction failed', message: error.message }, { status: 500 });
    }
}
