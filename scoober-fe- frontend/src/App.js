import { io } from "socket.io-client";
import './App.css';
import { useContext, useEffect, useState } from "react";
import { customStyles, playerNames, websocketURL } from "./constants";
import { SBarContext } from 'generic_status_bar'
import logo from './assets/logo192.png'
import Modal from 'react-modal';
import tryagain from './assets/tryagain.jpg'
import won from './assets/won.png'

const socket = io(websocketURL)
window.socket = socket
function App() {
  const { updateSBar } = useContext(SBarContext)
  const [turn, setTurn] = useState(false)
  const [gameInfo, setGameInfo] = useState(null)
  const [attemps, setAttempts] = useState([])
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [/*isSingleUserGame*/, setisSingleUserGame] = useState(false)
  const [isOtherPlayerReady, setIsOtherPlayerReady] = useState(false)
  const [currentUser] = useState(`${playerNames[Math.floor(Math.random() * playerNames.length)]} ${Number((Math.random() * 100).toFixed(2))}`)

  // const [gameState, setGameState] = useState({
  //   error:false,
  //   connected
  // })

  useEffect(() => {
    socket.on("connect", function () {
      updateSBar('Ok', 'Connected')
    })
    socket.on('connect_error', function () {
      updateSBar('Error', `Failed to establish connection with server.`)
    })
    socket.on('game', (gameData) => {
      console.log(gameData)
      setIsGameStarted(true)
      setGameInfo(gameData)
      setAttempts(gameData.attemps)
      if (!isOtherPlayerReady && gameData.playerOne && gameData.playerTwo) {
        setIsOtherPlayerReady(true)
        updateSBar('Info', `New player has joined the game.`)
      }
      else if (!isOtherPlayerReady && gameData.playerOne && !gameData.playerTwo) {
        updateSBar('Info', 'Waiting for the other player to join the game.')
      }

      if (gameData.playerOne && gameData.playerTwo) {
        if (gameData.turn === currentUser) {
          setTurn(true)
          updateSBar('Ok', `Please make your move. Its your turn`)
        }
        else {
          setTurn(false)
          updateSBar('Warning', `Other player is making move. Its their turn`)
        }
      }

      if (typeof gameData.winner === 'string') {
        setGameOver(true)
        if (gameData.winner === currentUser)
          setIsWinner(true)
        else
          setIsWinner(false)
      }

    })
  }, []) // eslint-disable-line

  const joinGame = (isSingleUser) => {
    setisSingleUserGame(isSingleUser)
    socket.emit('newgame', {
      user: {
        id: currentUser
      },
      isSingleUser
    })
  }

  const makeMove = (step) => {
    let attempt = {
      gameId: gameInfo.id,
      number: step,
      user: { id: currentUser }
    }
    socket.emit('turn', attempt)
  }

  const getGameStatus = () => {
    if (isGameStarted) {
      if (isOtherPlayerReady) {
        return "Your game has started ..!!"
      }
      else {
        return "Waiting for 2nd player to join..!!"
      }
    }
    else {
      return "Please Select your oponent .. !!"
    }
  }

  return (
    <div className="App">
      {
        socket.connected ? (<>{!isOtherPlayerReady && <h3>{getGameStatus()}</h3>}
          {!isGameStarted && (<>
            <button onClick={() => joinGame(false)}>VS Player</button>
            <button onClick={() => joinGame(true)}>VS Computer</button>
          </>)}

          {isGameStarted && isOtherPlayerReady && (<>
            <h4>Starting number {gameInfo?.startingNumber}</h4>
            <div className='chatSection'>
              <div className='chatsWrapper'>
                {attemps.map(attempt => {
                  return (
                    <div key={attempt.newValue} className={`attempt ${attempt.user.id === currentUser ? 'rightpanel' : 'leftpanel'}`}>
                      <div className='profile'>
                        <img title={currentUser} className='logo' src={logo} alt={currentUser} />
                        <span className='chosennum'>{attempt.number}</span>
                      </div>
                      <div className='calcSection'>
                        <div className='formula'>{attempt.text}</div>
                        <div className='result'>{attempt.newValue}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {isGameStarted && isOtherPlayerReady && (
                <div className='actionbtns'>
                  <button disabled={!turn} onClick={() => makeMove(-1)}>-1</button>
                  <button disabled={!turn} onClick={() => makeMove(0)}>0</button>
                  <button disabled={!turn} onClick={() => makeMove(1)}>+1</button>
                </div>
              )}
            </div>
          </>)}

          <Modal
            isOpen={gameOver}
            onRequestClose={() => window.location.reload()}
            style={customStyles}>
            <div className='logoWrapper'>
              <h3>
                {isWinner ? "You've Won the game..!!" : "You Lost the game..!!"}
              </h3>
              {isWinner ? <img className='gameoverlogo' src={won} alt='' /> :
                <img className='gameoverlogo' src={tryagain} alt='' />}<br /><br />
              <button onClick={() => window.location.reload()}>Restart Game..!!</button>
            </div>
          </Modal></>) : (<h1>Your server does not seems to be running. Please check your server status</h1>)
      }

    </div>
  );
}

export default App;
