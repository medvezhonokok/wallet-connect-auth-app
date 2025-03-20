'use client'
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';

const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getTokenFromCookies = () => {
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
    }, []); // Добавляем зависимости

    useEffect(() => {
        if (!user) return;
        const attemps = user?.get_attemps;
        switch (attemps) {
            case 10:
                setColor('gold');
                break;

            case 5:
                setColor('silver');
                break;

            case 3:
                setColor('bronze');
                break;

            case 1:
                setColor('gray');
                break;

            default:
                setColor('gray');
        }
    }, [user]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (secondsLeft === 0) window.location.reload();
            setSecondsLeft((prev: number) => Math.max(prev - 1, 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [secondsLeft]);

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
                className={color}>{user.get_attemps}</span> attempts after {`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
            </span>
            <span>
                 You hold <span className={color}>{user.balance}</span> $HORN
            </span>
            <button className="button" onClick={() => {
                window.location.href = "https://raydium.io/swap/?inputMint=sol&outputMint=6biQcSwYXPcb1DU9fNKUoem2FHHAXeFBmnnRrrdJpump";
            }}>
                Buy on Raydium
            </button>
            <button onClick={handleLogout} className="button">
                Logout
            </button>
            <button className="button" onClick={() => router.back()}>
                Cancel
            </button>
        </div>
    );
};
