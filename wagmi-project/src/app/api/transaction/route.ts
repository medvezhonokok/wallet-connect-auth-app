import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const SOLANA_RPC = process.env.SOLANA_RPC!;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY!;
const TOKEN_MINT = new PublicKey(process.env.TOKEN_MINT!); // Адрес токена
const SMART_CONTRACT_WALLET = new PublicKey(process.env.SMART_CONTRACT_WALLET!); // Кошелек смарт-контракта
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getTokenPrice = async (): Promise<number> => {
    const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT
    const url = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenAddress}&vs_currencies=usd`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data[tokenAddress.toLowerCase()]?.usd || 0; // Цена токена в USD
    } catch (error) {
        console.error("Error fetching token price:", error);
        return 0;
    }
};


export async function POST(req: NextRequest) {
    try {
        const { userAddress, tokens } = await req.json();

        if (!userAddress) {
            return NextResponse.json({ error: 'User address is required' }, { status: 400 });
        }

        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const ownerKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(OWNER_PRIVATE_KEY)));

        const userWallet = new PublicKey(userAddress);
        const ownerWallet = ownerKeypair.publicKey;

        // Получаем адреса ATA (Associated Token Account)
        const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, userWallet);
        const ownerTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, ownerWallet);
        const contractTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, SMART_CONTRACT_WALLET);

        // Получаем текущий курс токена (заглушка, лучше использовать Chainlink или API)
        const tokenPriceInUSD = await getTokenPrice();
        const amountToTransfer = tokens / tokenPriceInUSD;

        const holdAmount = (amountToTransfer * 60) / 100;
        const ownerAmount = (amountToTransfer * 40) / 100;

        // Создаем транзакции перевода
        const transaction = new Transaction().add(
            createTransferInstruction(userTokenAccount, contractTokenAccount, userWallet, holdAmount), // 60% в смарт-контракт
            createTransferInstruction(userTokenAccount, ownerTokenAccount, userWallet, ownerAmount) // 40% владельцу
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [ownerKeypair]);

        const response = await fetch(`${BACKEND_API_URL}/game/user/add_coins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userAddress,
                tokens: tokens, // Количество токенов для покупки
            }),
        });

        if (!response.ok) {
            console.error('Failed to add coins on backend:', response.statusText);
            return NextResponse.json({ error: 'Failed to update user coins' }, { status: 500 });
        }

        return NextResponse.json({ success: true, signature });
    } catch (error) {
        console.error('Error processing transaction:', error);
        return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
    }
}
