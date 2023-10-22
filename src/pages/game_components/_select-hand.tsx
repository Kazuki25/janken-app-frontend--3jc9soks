import Timer from './_timer';

type Props = {
    limitTime: number
    sendFunc: (hand: string) => void
}

const SelectHand = ({limitTime, sendFunc}: Props) => {
    return (
        <div>
            <h1>手を選んでください</h1>
            <button onClick={() => sendFunc("rock")}>Rock</button>
            <button onClick={() => sendFunc("scissors")}>Scissors</button>
            <button onClick={() => sendFunc("paper")}>Paper</button>
            <Timer limitTime={limitTime} />
        </div>
    )
}

export default SelectHand;