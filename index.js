let alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
let isFirstPlayersTurn = true;
let playerMovesLeft = 1; //Starts at 1 because first player's first turn is only one move, even though two is normal

let board = [];

//build html element board
for(let i = 0; i < BOARD_SIZE; i++){ 
    board.push([]);
    for(let j = 0; j < BOARD_SIZE; j++){
        let thisId = `${alphabet[i]}${alphabet[j]}`
        board[i].push(new BoardTile(thisId));
        document.getElementById("board").innerHTML += `<div class="cell" id="${thisId}"></div>`
        
        
    }
}


//draw starting pieces
populateStartingPieces();

//bind click events
bindClickEvents();

