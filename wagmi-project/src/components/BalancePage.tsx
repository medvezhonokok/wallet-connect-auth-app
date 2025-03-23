import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Loader from "@/components/Loader";

const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC;
const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT;

export const getTokenFromCookies = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null;
};

const timeToSeconds = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
};

async function getTokenBalance(walletAddress: string): Promise<number> {
    const options = {
        method: 'POST',
        headers: {accept: 'application/json', 'content-type': 'application/json'},
        body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [walletAddress, {mint: tokenMint}]
        })
    };
    fetch(rpcUrl, options)
        .then((data) => {
                console.log(data)
            }
        );

    return 0;
}

export const BalancePage = ({handleLogout}) => {
    const [user, setUser] = useState(null);
    const [color, setColor] = useState<string>('gray');
    const [secondsLeft, setSecondsLeft] = useState(null);
    const [limits, setLimits] = useState({gold: 0, silver: 0, bronze: 0});
    const [tokensCount, setTokensCount] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [update, setUpdate] = useState(null);
    const router = useRouter();


    useEffect(() => {
        if (user) return;
        const token = getTokenFromCookies();
        fetch(`${backendApiUrl}/user?token=${token}`, {credentials: 'include'})
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setSecondsLeft(timeToSeconds(data.time_update));
            });
    }, []);

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const [goldRes, silverRes, bronzeRes, balance] = await Promise.all([
                    fetch(`${backendApiUrl}/get-config?key=gold_attempts`),
                    fetch(`${backendApiUrl}/get-config?key=silver_attempts`),
                    fetch(`${backendApiUrl}/get-config?key=bronze_attempts`),
                    getTokenBalance(user.wallet_address)
                ]);

                const gold = (await goldRes.json())?.value || 0;
                const silver = (await silverRes.json())?.value || 0;
                const bronze = (await bronzeRes.json())?.value || 0;

                setLimits({gold, silver, bronze});
                setTokensCount(balance);

                if (balance >= gold) {
                    setColor("gold");
                    setAttempts(10);
                } else if (balance >= silver) {
                    setColor("silver");
                    setUpdate({
                        color: 'gold',
                        tokens: gold - balance,
                        attempts: 10
                    });
                    setAttempts(5);
                } else if (balance >= bronze) {
                    setColor("bronze");
                    setUpdate({
                        color: 'silver',
                        tokens: silver - balance,
                        attempts: 5
                    });
                    setAttempts(3);
                } else {
                    setColor("gray");
                    setUpdate({
                        color: 'bronze',
                        tokens: bronze - balance,
                        attempts: 3
                    })
                    setAttempts(1);
                }
            } catch (error) {
                console.error("Ошибка при получении лимитов:", error);
            }
        };

        if (user) fetchLimits();
    }, [user]);

    useEffect(() => {
        if (secondsLeft === null) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev: number) => {
                if (prev === 0) {
                    window.location.reload();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [user]);

    const repostX = async () => {
        const urlRes = await fetch(`${backendApiUrl}/get-config?key=x-post-link`);
        const url = (await urlRes.json())?.value || 0;
        window.open(url, '_blank').focus();
        fetch(`${backendApiUrl}/repost`, {
            method: "POST",
            credentials: 'include',
            body: JSON.stringify({token: getTokenFromCookies()})
        });
    }

    const subscribe = async () => {
        const urlRes = await fetch(`${backendApiUrl}/get-config?key=telegram-link`);
        const url = (await urlRes.json())?.value || 0;
        window.open(url, '_blank').focus();
        fetch(`${backendApiUrl}/subscribe`, {
            method: "POST",
            credentials: 'include',
            body: JSON.stringify({token: getTokenFromCookies()})
        });
    }

    if (!user) return null;

    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;

    if (!user) {
        return <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: 'fit-content',
            gap: '1rem',
            alignItems: 'stretch'
        }}>
            <Loader/>
        </div>
    }

    return (
        <div style={{
            textAlign: 'center',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: "center",
            color: 'white'
        }}>
            <h2>Balance: {user.attemps} attempts</h2>
            <span>
                 You will get <span
                className={color}>{attempts}</span> attempt{attempts > 1 ? 's' : ''} after {`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
            </span>
            <span>
                 You hold <span className={color}>{tokensCount}</span> $HORN
            </span>
            {update && (
                <span>
                    If you hold <span className={update.color}>{update.tokens}</span> more $HORN,
                    then you will get <span className={update.color}>{update.attempts}</span> attempts
                </span>
            )}

            <br/><br/>
            <div>
                Hold <span className="akcent">{limits.bronze} $HORN</span> → 3 attempts every 12h<br/>
                Hold <span className="akcent">{limits.silver} $HORN</span> → 5 attempts every 12h<br/>
                Hold <span className="akcent">{limits.gold} $HORN</span> → 10 attempts every 12h<br/>
            </div>

            <button className="button" onClick={() => {
                window.location.href = "https://swap.pump.fun/?input=So11111111111111111111111111111111111111112&output=6biQcSwYXPcb1DU9fNKUoem2FHHAXeFBmnnRrrdJpump";
            }}>
                Buy on PumpSwap
            </button>
            <button onClick={() => {
                window.location.href = backendApiUrl;
            }} className="button">
                Play
            </button>
            <button onClick={handleLogout} className="button">
                Logout
            </button>
            <button className="button" onClick={() => router.back()}>
                Cancel
            </button>


            <h2 style={{marginTop: 30}}>Free attempts:</h2>

            <button onClick={repostX} className="button" disabled={user?.reposted}>
                Repost from X
            </button>
            <button onClick={subscribe} className="button" disabled={user?.subscribed}>
                Subscribe to Telegram
            </button>
        </div>
    );
};
