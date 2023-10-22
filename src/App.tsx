import React from 'react';
import './App.css';
import Game from './pages/Game';

function App() {
  const [userName, setUserName] = React.useState("");
  const [entry, setEntry] = React.useState(false);
  const [conn, setConn] = React.useState(false);

  const entryGame = () => {
    setConn(true);
    setEntry(true);
  }

  const exitGame = () => {
    setConn(false);
    setEntry(false);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Online Janken game</h1>
        {!entry ?
          <>
            <p>Input your name:</p>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
            <button onClick={entryGame}>Entry Game</button>
          </>
          :
          <>
            <Game userName={userName} setConn={setConn} exitGame={exitGame}/>
            <p>Your Name: {userName}</p>
            <button onClick={exitGame}>Exit Game</button>
          </>
        }
        {conn ? <p>Connected</p> : <p>Not Connected</p>}
      </header>
    </div>
  );
}

export default App;
