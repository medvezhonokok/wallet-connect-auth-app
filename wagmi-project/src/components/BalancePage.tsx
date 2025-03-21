import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';

const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getTokenFromCookies = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null;
};

const timeToSeconds = (timeStr: string) => {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
};

export const BalancePage = ({handleLogout}) => {
    const [user, setUser] = useState(null);
    const [color, setColor] = useState<string>('gray');
    const [secondsLeft, setSecondsLeft] = useState(null);
    const [limits, setLimits] = useState({gold: 0, silver: 0, bronze: 0});
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
            })
    }, []);

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const goldRes = await fetch(`${backendApiUrl}/get-config?key=gold_attempts`);
                const silverRes = await fetch(`${backendApiUrl}/get-config?key=silver_attempts`);
                const bronzeRes = await fetch(`${backendApiUrl}/get-config?key=bronze_attempts`);

                const gold = (await goldRes.json())?.value || 0;
                const silver = (await silverRes.json())?.value || 0;
                const bronze = (await bronzeRes.json())?.value || 0;

                setLimits({gold, silver, bronze});

                const balance = user.balance;

                if (balance >= gold) {
                    setColor("gold");
                } else if (balance >= silver) {
                    setColor("silver");
                    setUpdate({
                        color: 'gold',
                        tokens: gold - balance,
                        attempts: 10
                    })
                } else if (balance >= bronze) {
                    setColor("bronze");
                    setUpdate({
                        color: 'silver',
                        tokens: silver - balance,
                        attempts: 5
                    })
                } else {
                    setColor("gray");
                    setUpdate({
                        color: 'bronze',
                        tokens: bronze - balance,
                        attempts: 3
                    })
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
    }, []);

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
                className={color}>{user.get_attemps}</span> attempt{user.get_attemps > 1 ? 's' : ''} after {`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
            </span>
            <span>
                 You hold <span className={color}>{user.balance}</span> $HORN
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
                window.location.href = "https://raydium.io/swap/?inputMint=sol&outputMint=6biQcSwYXPcb1DU9fNKUoem2FHHAXeFBmnnRrrdJpump";
            }}>
                Buy on Raydium
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
                Logout
            </button>
        </div>
    );
};
