import Timer from './_timer';

type Props = {
    limitTime: number
}

const WaitMatching = ({limitTime}: Props) => {
    // display a message and timer up to 30 seconds
    // difine a timer
    // if the timer is up to 30 seconds, display a message to re-entry

    return (
        <div>
            <p>只今、マッチング中です...</p>
            <p>{limitTime/1000}秒以内にマッチングが成立しない場合は、再度エントリーしてください</p>
            <Timer limitTime={limitTime} />
        </div>
    );
}

export default WaitMatching;