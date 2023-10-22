import Timer from './_timer';

type Props = {
    limitTime: number
}

const WaitOpponent = ({limitTime}: Props) => {    
    return (
        <div>
        <h1>対戦相手が手を出すのを待っています...</h1>
        <Timer limitTime={limitTime} />
        </div>
    );
}

export default WaitOpponent;