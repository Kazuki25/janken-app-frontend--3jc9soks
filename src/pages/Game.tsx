import React, { useCallback, useEffect, useRef, useState } from 'react';
import WaitMatching from './game_components/_wait-matching';
import GameStart from './game_components/_start-game';
import SelectHand from './game_components/_select-hand';
import WaitOpponent from './game_components/_wait-opponent';
import ShowResult from './game_components/_show-result';
import GameExit from './game_components/_game-exit';

const url: string|undefined = process.env.REACT_APP_WEBSOCKET_URL;
const env: string|undefined = process.env.REACT_APP_ENV;

type Props = {
    userName: string
    setConn: React.Dispatch<React.SetStateAction<boolean>>
    exitGame: () => void
}

type Signal = {
    action: string
    nextState: string
    limitTime: number
    message: string
}

type User = {
    username: string
    connectionId: string
}

type Request = {
    action: string
    name?: string
    hand?: string
    gameId?: string
}

type Result = {
    turn: number
    winner: string
    yourResult: number // 0: even, 1: win, -1: lose
}

const Game = ({userName, setConn, exitGame}: Props) => {
    // define websocket object ref
    const wsRef = useRef<WebSocket|null>(null);

    // define variables
    const [state, setState] = useState<string>("0");
    const [message, setMessage] = useState("");
    const [users, setUsers] = useState<User[]>([]); // [{username: "user1", connectionId: "id1"}, {username: "user2", connectionId: "id2"}]
    const [opponent, setOpponent] = useState<string>("");
    const timerRef = useRef(0);
    const limitTimeRef = useRef(0);
    const stateQueueRef = useRef<Signal[]>([]);
    const connectionIdRef = useRef("");
    const gameIdRef = useRef("");
    const resultsRef = useRef<Result[]>([]);
    const latestResultRef = useRef<Result>({turn: 0, winner: "", yourResult: 0});

    useEffect(() => {
        const timeInterval = 1000;
        const timerId = setInterval(() => {
            // console.log("timer: " + timerRef.current + "[ms]");

            // Debug: show stateQueue's action
            let stateQueueStr = "";
            stateQueueRef.current.forEach((signal, index) => {
                stateQueueStr += "#" + index + ": " + signal.action + ", ";
            });
            addLog("stateQueue: [" + stateQueueStr + "]");

            // if stateQueue is empty, return.
            if (stateQueueRef.current.length === 0) {
                return;
            }
            // if stateQueue is not empty, get first element
            const signal = stateQueueRef.current[0];
            // if signal.limitTime is not -1, check timer
            if (timerRef.current >= signal.limitTime) {
                // define processes when timer is over
                switch (signal.action) {
                    case "entry_done":
                        addLog("60秒経過しました");
                        setMessage("マッチングが成立しませんでした");
                        setState("0");
                        break;
                    case "matched":
                        addLog("マッチ通知完了");
                        // check nest signal and if its nextState is "select_hand", set state to "select_hand"
                        // else set state to "0"
                        if (stateQueueRef.current[1].action === "select_hand") {
                            const nextSignal = stateQueueRef.current[1];
                            setState(nextSignal.nextState);
                            setMessage(nextSignal.message);
                        } else {
                            setState("0");
                            setMessage("エラーが発生しました");
                        }
                        break;
                    case "select_hand":
                        addLog("時間切れです");
                        // if time is over, send ranmdomly selected hand.
                        const hands = ["rock", "scissors", "paper"];
                        const hand = hands[Math.floor(Math.random() * hands.length)];
                        sendHand(hand);
                        break;
                    case "register_hand":
                        addLog("相手からの手の登録がありません");
                        setMessage("エラーが発生しました");
                        setState("0");
                        break;
                    case "result":
                        const nextSignal = stateQueueRef.current[1];
                        setState(nextSignal.nextState);
                        setMessage(nextSignal.message);
                        break;
                    case "game_finished":
                        addLog("ゲームが終了しました");
                        exitGame();
                        break;
                    default:
                        break;
                }
                // delete first element from stateQueue
                stateQueueRef.current.shift();
                // reset timer
                timerRef.current = 0;
                // set next limitTime if next stateQueue is not empty
                if (stateQueueRef.current.length !== 0) {
                    limitTimeRef.current = stateQueueRef.current[0].limitTime;
                }
            }

            timerRef.current = timerRef.current + timeInterval;
        }, timeInterval);

        // define functions
        const connect = async () => {
            if (wsRef.current) {
                addLog("すでに接続しています");
                return;
            }

            // Initialize websocket object.
            if (!url) {
                addLog("urlが設定されていません");
                throw new Error("urlが設定されていません");
            }
            wsRef.current = new WebSocket(url);
            // Set open event handler to websocket object.
            wsRef.current.onopen = (event) => {
                setConn(true);
                addLog("接続しました");
                getConnectionId();
                entry();
            };
    
            // Set message event handler to websocket object.
            wsRef.current.onmessage = async (event) => {
                addLog("サーバから受信: " + event.data);
                const data = JSON.parse(event.data);
                // if data has limitTime, let limitTime = data.limitTime
                // swich processes by event.data.action
                if (data.action === "getconnectionid") {
                    connectionIdRef.current = data.connectionId;
                    addLog("接続IDを取得しました: " + connectionIdRef.current);
                    return;
                }

                if (data.message==="OK") {
                    return;
                }

                // State Queue control
                const limitTime = !data.limitTime ? -1 : Number(data.limitTime);
                stateQueueRef.current.push({
                    action: data.action,
                    nextState: data.nextState,
                    limitTime: limitTime,
                    message: data.message,
                });

                // define processes when reveive data from server
                switch (data.action) {
                    case "entry_done":
                        addLog("エントリーを受け付けました");
                        setState(data.nextState);
                        setMessage(data.message);
                        limitTimeRef.current = limitTime;
                        break;
                    case "matched":
                        addLog("マッチングが成立しました");
                        gameIdRef.current = data.gameId;
                        // delete waiting timer
                        if (stateQueueRef.current.length >= 2 && stateQueueRef.current[0].action !== "matched") {
                            stateQueueRef.current.shift();
                        }
                        timerRef.current = 0; // reset timer
                        limitTimeRef.current = limitTime; // reset limitTime
                        setState(data.nextState);
                        setMessage(data.message);
                        // set users
                        setUsers(data.users);
                        // set opponent
                        setOpponent(data.users.filter((user: User) => user.username !== userName)[0].username);
                        break;
                    case "select_hand":
                        addLog("手を選択してください");
                        break;
                    case "register_hand":
                        addLog("手を登録しました");
                        setState(data.nextState);
                        setMessage(data.message);
                        // delete select_hand timer
                        if (stateQueueRef.current[0].action === "select_hand") {
                            stateQueueRef.current.shift();
                            // limitTime is remianing time of select_hand
                            limitTimeRef.current = limitTimeRef.current - timerRef.current + 2000;
                            timerRef.current = 0; // reset timer
                        }
                        break;
                    case "already_registered":
                        addLog("すでに手を登録しています");
                        setMessage(data.message);
                        // delete the latest registered signal
                        stateQueueRef.current.pop();
                        break;
                    case "result":
                        addLog("結果を受信しました");
                        const result: Result = {
                            turn: data.currentTurn,
                            winner: data.winner,
                            yourResult: data.winner === "even" ? 0
                                : data.winner === userName ? 1 : -1
                        }
                        // set results
                        resultsRef.current.push(result);

                        latestResultRef.current = result
                        
                        // delete timer if current state is not "result"
                        if (stateQueueRef.current[0].action !== "result") {
                            stateQueueRef.current.shift();
                        }
                        setState(data.nextState);
                        setMessage(data.message);
                        timerRef.current = 0; // reset timer
                        limitTimeRef.current = limitTime; // reset limitTime
                        break;
                    case "game_finished":
                        addLog("ゲームが終了しました");
                        timerRef.current = 0; // reset timer
                        limitTimeRef.current = limitTime; // reset limitTime
                        break;
                    default:
                        break;
                }
            }
    
            wsRef.current.onclose = (event) => {
                addLog("切断しました in onclose");
                setConn(false);
                setState("0");
            }
        }

        // define functions end`

        connect();
        return () => {
            disconnect();
            clearInterval(timerId);
        }
    }, []);

    const addLog = useCallback((arg: string) => {
        if (env && env === "dev") {
            console.log(arg);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            addLog("切断しました in disconnect");
        }
        wsRef.current = null;
        setMessage("");
        setConn(false);
    }, []);

    const getConnectionId = useCallback(() => {
        if (wsRef.current) {
            const data:Request = {
                action: "getconnectionid"
            }
            wsRef.current.send(JSON.stringify(data));
            addLog("サーバに送信: " + JSON.stringify(data));
        }
    }, []);

    const entry = useCallback(() => {
        if (wsRef.current) {
            const data:Request = {
                action: "game",
                name: userName
            }
            wsRef.current.send(JSON.stringify(data));
            addLog("サーバに送信: " + JSON.stringify(data));
        }
    }, []);

    const sendHand = useCallback((hand: string) => {
        if (wsRef.current) {
            const data:Request = {
                action: "game",
                gameId: gameIdRef.current,
                name: userName,
                hand: hand
            }
            wsRef.current.send(JSON.stringify(data));
            addLog("サーバに送信: " + JSON.stringify(data));
        }
    }, []);

    return (
        <>
            {state==="waiting" && <WaitMatching limitTime={limitTimeRef.current}/>}
            {state==="game_start" && <GameStart users={users} limitTime={limitTimeRef.current}/>}
            {state==="select_hand" && <SelectHand limitTime={limitTimeRef.current} sendFunc={sendHand}/>}
            {state==="waiting_opponent" && <WaitOpponent limitTime={limitTimeRef.current}/>}
            {state==="show_result" && <ShowResult latestResult={latestResultRef.current} results={resultsRef.current} limitTime={limitTimeRef.current}/>}
            {state==="game_finished" && <GameExit limitTime={limitTimeRef.current} results={resultsRef.current}/>}
            <p>{message}</p>
            {opponent && <p>対戦相手: {opponent}</p>}
        </>
    )
}

export default Game;