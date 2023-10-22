import React from 'react';
import Timer from './_timer';

type Result = {
    turn: number
    winner: string
    yourResult: number // 0: even, 1: win, -1: lose
}

type Props = {
    latestResult: Result
    results: Result[]
    limitTime: number
}

const ShowResult = ({latestResult, results, limitTime}: Props) => {
    const generateMessage = (result: number) => {
        // if input is not 0, 1, -1, return error
        switch (result) {
            case 0:
                return "あいこです";
            case 1:
                return "あなたの勝ちです";
            case -1:
                return "あなたの負けです";
            default:
                return "エラーが発生しました";
        }
    }

    return (
        <div>
            <h1>第{latestResult.turn}戦 対戦結果</h1>
            <p>{generateMessage(latestResult.yourResult)}</p>
            <Timer limitTime={limitTime} />
            {results.map((result, index) => {
                return (
                    <div key={index}>
                        <p>第{result.turn}戦、結果: {generateMessage(result.yourResult)}、勝者: {result.winner==="even" ? "-" : result.winner}</p>
                    </div>
                );
            })}
        </div>
    );
}

export default ShowResult;