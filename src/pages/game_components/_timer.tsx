import {useState} from 'react';

type Props = {
    limitTime: number
}

const Timer = ({limitTime}: Props) => {
    const [timer, setTimer] = useState(limitTime/1000);
    setTimeout(() => {
        setTimer(timer - 1);
    }, 1000);

    return (
        <p>残り: {timer} 秒</p>
    )
};

export default Timer;