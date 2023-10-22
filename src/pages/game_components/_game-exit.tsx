import Timer from './_timer';

type Result = {
    turn: number
    winner: string
    yourResult: number // 0: even, 1: win, -1: lose
}

type Props = {
    limitTime: number
    results: Result[]
}


const GameExit = ({limitTime, results}: Props) => {

    // 勝負結果を集計して表示する
    const generateMessage = (results: Result[]) => {
        // 勝利数を集計
        const winCount = results.filter(result => result.yourResult === 1).length;
        const loseCount = results.filter(result => result.yourResult === -1).length;
        const evenCount = results.filter(result => result.yourResult === 0).length;

        // 勝敗数を表示
        const winLoseMessage = `あなたの勝ち: ${winCount}回、あなたの負け: ${loseCount}回、あいこ: ${evenCount}回`;

        let resultMessage = "";
        // 勝敗を表示
        if (winCount > loseCount) {
            resultMessage = "あなたの勝ちです";
        } else if (winCount < loseCount) {
            resultMessage = "あなたの負けです";
        } else {
            resultMessage = "引き分けです";
        }
        return [resultMessage, winLoseMessage];
    }    

    return (
        <div>
            <h1>最終結果</h1>
            {generateMessage(results).map((message, index) => {
                return (
                    <p key={index}>{message}</p>
                );
            })}
            <Timer limitTime={limitTime} />
        </div>
    )
}

export default GameExit;