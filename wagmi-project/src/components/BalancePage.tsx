import {useEffect, useState} from 'react';
import Loader from "@/components/Loader";

const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC;
const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT;

export const getTokenFromCookies = () => {
    if (typeof document === 'undefined') return null;

    // Ищем в localStorage
    return localStorage.getItem('token') || null;
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
            params: [
                walletAddress,
                {mint: tokenMint},
                {encoding: "jsonParsed"}
            ]
        })
    };

    return await fetch(rpcUrl, options)
        .then((data) => data.json())
        .then((data) => {
            try {
                return data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            } catch (err) {
                return 0;
            }
        });
}

export const BalancePage = ({handleLogout}) => {
    const [user, setUser] = useState(null);
    const [color, setColor] = useState<string>('gray');
    const [secondsLeft, setSecondsLeft] = useState(null);
    const [limits, setLimits] = useState({gold: 0, silver: 0, bronze: 0});
    const [tokensCount, setTokensCount] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [update, setUpdate] = useState(null);
    const [callbacks, setCallbacks] = useState(null);
    const [inputVisible, setInputVisible] = useState(false);
    const [repostUrl, setRepostUrl] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(true);

    const token = getTokenFromCookies();

    useEffect(() => {
        if (user) return;
        if (!token) return;
        fetch(`${backendApiUrl}/user?token=${token}`, {credentials: "include"})
            .then(res => {
                if (res.status === 404) {
                    handleLogout();
                    window.location.reload();
                }
                return res.json()
            })
            .then((data) => {
                if (data) {
                    setUser(data);
                    setSecondsLeft(timeToSeconds(data.time_update));
                }
            })
            .catch(() => {
                handleLogout();
                window.location.reload();
            });
    }, [token]);

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

    const repostXCallback = async () => {
        const urlRes = await fetch(`${backendApiUrl}/get-config?key=x-post-link`);
        const url = (await urlRes.json())?.value || "";

        if (url) {
            return () => {
                window.open(url, '_blank').focus();
                setInputVisible(true);
            }
        }
    };

    const validateUrl = (url) => {
        const regex = /^https?:\/\/(www\.)?x\.com\/.*$/;
        return regex.test(url);
    };

    const handleChange = (e) => {
        const url = e.target.value;
        setRepostUrl(url);
        setIsValidUrl(validateUrl(url));
    };

    const handleSubmit = async () => {
        if (!repostUrl || !isValidUrl) return;

        await fetch(`${backendApiUrl}/repost`, {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({token: getTokenFromCookies(), repostUrl})
        });

        window.location.reload();
    };

    const subscribeCallback = async () => {
        const urlRes = await fetch(`${backendApiUrl}/get-config?key=telegram-link`);
        const url = (await urlRes.json())?.value || 0;

        return () => {
            window.open(url, '_blank').focus()
            fetch(`${backendApiUrl}/subscribe`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({token: getTokenFromCookies()})
            }).then(() => window.location.reload());
        }
    }

    useEffect(() => {
        const iife = async () => {
            const repostX = await repostXCallback();
            const subscribe = await subscribeCallback();
            setCallbacks(
                {
                    repostX,
                    subscribe
                }
            )
        };

        iife();
    }, []);

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
                className={color}>{attempts === null ? '?' : attempts}</span> attempt{attempts > 1 ? 's' : ''} after {`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
            </span>
            <span>
                 You hold <span className={color}>{tokensCount === null ? '????' : tokensCount}</span> $HORN
            </span>
            {update && (
                <span>
                    Hold <span className={update.color}>{update.tokens === null ? '????' : update.tokens}</span> more $HORN to get <span
                    className={update.color}>{update.attempts === null ? '?' : update.attempts}</span> attempts
                </span>
            )}

            <br/><br/>
            <div>
                Hold <span className="akcent">{limits.bronze} $HORN</span> → 3 attempts every 12h<br/>
                Hold <span className="akcent">{limits.silver} $HORN</span> → 5 attempts every 12h<br/>
                Hold <span className="akcent">{limits.gold} $HORN</span> → 10 attempts every 12h<br/>
            </div>

            <a className="button"
               href="https://swap.pump.fun/?input=So11111111111111111111111111111111111111112&output=6biQcSwYXPcb1DU9fNKUoem2FHHAXeFBmnnRrrdJpump">
                Buy on PumpSwap
            </a>
            <a href={backendApiUrl} className="button">
                Play
            </a>
            <button onClick={() => {
                handleLogout();
                window.location.href = '../';
            }} className="button">
                Logout
            </button>
            <a href="../" className="button">
                Back to site
            </a>

            <h2 style={{marginTop: 30}}>Free attempts:
            </h2>

            <span>
                 Renews in: {`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
            </span>

            {inputVisible && (
                <div>
                    <input
                        type="text"
                        value={repostUrl}
                        onChange={handleChange}
                        placeholder="Paste your X repost link here"
                        className="input"
                        style={{
                            borderColor: isValidUrl ? '#08262a' : 'red',
                        }}
                    />
                    <button className="button" onClick={handleSubmit} disabled={!repostUrl || !isValidUrl}>
                        Submit
                    </button>
                </div>
            )}
            <button onClick={callbacks?.repostX} className="button" disabled={!callbacks || user?.reposted}>
                Repost from X
            </button>
            <button onClick={callbacks?.subscribe} className="button" disabled={!callbacks || user?.subscribed}>
                Subscribe to Telegram
            </button>
        </div>
    );
};
