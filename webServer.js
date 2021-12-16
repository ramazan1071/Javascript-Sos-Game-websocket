const http = require('http')
const WebSocket = require('websocket').server
const games = {}
const clients = {}
const CROSS_SYMBOL = 's'
const CIRCLE_SYMBOL = 'o'
const WIN_STATES = Array([0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6])

const httpServer = http.createServer((request, response) => {
    // 
})

const socketServer = new WebSocket({
    'httpServer': httpServer
})
socketServer.on('request', request => {
    const connection = request.accept(null, request.origin)
    connection.on('open', connectionOpened)
    connection.on('close', () => {})
    connection.on('message', messageHandler)

    const clientId = Math.round(Math.random() * 100) + Math.round(Math.random() * 100) + Math.round(Math.random() * 100)
    clients[clientId] = { 'clientId': clientId, 'connection': connection }
    connection.send(JSON.stringify({ 'method': 'connect', 'clientId': clients[clientId].clientId }))
    sendAvailableGames()
})

httpServer.listen(8080, () => { console.log('server listening on port 8080') })

function connectionOpened() {
    connection.send('connection with server opend')
}

function messageHandler(message) {
    const msg = JSON.parse(message.utf8Data)
    let player = {}
    switch (msg.method) {
        case 'create':
            // create logic
            player = {
                'clientId': msg.clientId,
                'symbol': CROSS_SYMBOL,
                'isTurn': true,
                'wins': 0,
                'lost': 0
            }
            const gameId = Math.round(Math.random() * 100) + Math.round(Math.random() * 100) + Math.round(Math.random() * 100)
            const board = [
                '', '', '',
                '', '', '',
                '', '', ''
            ]
            games[gameId] = {
                'gameId': gameId,
                'players': Array(player),
                'board': board
            }
            const payLoad = {
                'method': 'create',
                'game': games[gameId]
            }
            const conn = clients[msg.clientId].connection
            conn.send(JSON.stringify(payLoad))
            sendAvailableGames()
            break;
        case 'join':
            // join game logic
            player = {
                'clientId': msg.clientId,
                'symbol': CIRCLE_SYMBOL,
                'isTurn': false,
                'wins': 0,
                'lost': 0
            }
            games[msg.gameId].players.push(player)

            clients[msg.clientId].connection.send(JSON.stringify({
                'method': 'join',
                'game': games[msg.gameId]
            }))

            makeMove(games[msg.gameId])
            break

        case 'makeMove':
            console.log('before makeMove' + msg.game.gameId)
            games[msg.game.gameId].board = msg.game.board

            let currPlayer
            let playerSymbol
            msg.game.players.forEach((player) => {
                if (player.isTurn) {
                    currPlayer = player.clientId
                    playerSymbol = player.symbol
                }
            })
            let isWinner = false
            console.log(`game borad is ${games[msg.game.gameId].board}`)
            checkWin();
           
            
            function checkWin() {
                checkRows();
                checkColumns();
                checkDiagonals();
                
            }
            
            function checkRows() {
                
                let row1=false;
                row1=games[msg.game.gameId].board[0] =='s' && games[msg.game.gameId].board[2] == 's' && games[msg.game.gameId].board[1] == 'o'
                let row2 = games[msg.game.gameId].board[3]=='s' && games[msg.game.gameId].board[5] === 's' && games[msg.game.gameId].board[4]=== 'o';
                let row3 = games[msg.game.gameId].board[6] =='s' && games[msg.game.gameId].board[8] === 's' && games[msg.game.gameId].board[7] === 'o';
            
               
            
                if (row1 || row2 || row3) {
                  
                    isWinner = true;
                }
              
            }
            function checkColumns() {
                let col1 = games[msg.game.gameId].board[0] =='s' && games[msg.game.gameId].board[6] === 's' && games[msg.game.gameId].board[3]=== 'o';
                let col2 = games[msg.game.gameId].board[1] =='s' && games[msg.game.gameId].board[7] === 's' && games[msg.game.gameId].board[4]=== 'o';
                let col3 =games[msg.game.gameId].board[2] =='s' && games[msg.game.gameId].board[8]=== 's' && games[msg.game.gameId].board[5]=== 'o';
            
            
            
                if (col1 || col2 || col3) {
                    
                    isWinner = true;
                }
               
            }
            function checkDiagonals() {
                let dia1 = games[msg.game.gameId].board[0] ==='s' && games[msg.game.gameId].board[8]  === 's' && games[msg.game.gameId].board[4]  === 'o';
                let dia2 =games[msg.game.gameId].board[2]==='s' && games[msg.game.gameId].board[6] === 's' && games[msg.game.gameId].board[4] === 'o';
            
                if (dia1 || dia2) {
                   
                    isWinner = true;
                }
                
            }

            isWinner=isWinner;

            console.log(`isWinner = ${isWinner} symbol= ${playerSymbol}`)
            let isDraw=false;
            let ctr=0;
            if (isWinner) {
                const payLoad = {
                    'method': 'gameEnds',
                    'winner': playerSymbol
                }
                console.log(`isWinner = ${isWinner} symbol= ${playerSymbol}`)
                games[msg.game.gameId].players.forEach(player => {
                    clients[player.clientId].connection.send(JSON.stringify(payLoad))
                })
                break
            }
            // logic for draw goes herer
         
            else {
                
                for(var i=0;i<9;i++)
                {
                    
                    if(games[msg.game.gameId].board[i]!="")
                    {
                        ctr+=1;

                    }
                    else
                    {
                    ctr+=0;
                    }   
                    
                }
                if(ctr==9)
                {
                 
                    

                    isDraw=true;
                }

                if (isDraw) {
                    const payLoad = {
                        'method': 'draw',
                    }
                    games[msg.game.gameId].players.forEach(player => {
                        clients[player.clientId].connection.send(JSON.stringify(payLoad))
                    })
                    break
                }
            }
            games[msg.game.gameId].players.forEach((player) => {
                player.isTurn = !player.isTurn
            })
            makeMove(games[msg.game.gameId])
            break
    }
}


function makeMove(game) {
    const payLoad = {
        'method': 'updateBoard',
        'game': game
    }
    game.board.forEach(cell => console.log(`  ${cell}`))
    game.players.forEach((player) => {
        console.log(`player ${player.clientId}`)
        clients[player.clientId].connection.send(JSON.stringify(payLoad))
    })

}

function sendAvailableGames() {

    const allGames = []
    for (const k of Object.keys(games)) {
        if (games[k].players.length < 2) {
            allGames.push(games[k].gameId)
        }
    }
    const payLoad = { 'method': 'gamesAvail', 'games': allGames }
    for (const c of Object.keys(clients))

    { clients[c].connection.send(JSON.stringify(payLoad)) }
}