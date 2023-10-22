import Timer from "./_timer"

type User = {
    username: string
    connectionId: string
}

type Props = {
    users: User[]
    limitTime: number
}

const GameStart = ({users, limitTime}: Props) => {

    return (
        <div>
            <h1>ゲームを開始します</h1>
            <p>{users[0].username} vs {users[1].username}</p>
            <Timer limitTime={limitTime} />
        </div>
    );
}

export default GameStart;