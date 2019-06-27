const BOARD_SIZE = 11; //max size is probably 25 due to alphabet encoding


let highlightedTiles = []
let movingTile = null;

class BoardTile {
    constructor(id) {
        this.id = id;
        this.state = 0; // 0->empty, 1-> firstPlayer, 2-> secondPlayer
        this.elegibleForMovement = false;
        this.elem = () => {
            return document.getElementById(this.id);
        }
        this.highlightMovableTiles = () => {

            let possibleTiles = [];

            let thisX = alphabet.indexOf(this.id.substr(1, 1));
            let thisY = alphabet.indexOf(this.id.substr(0, 1));

            let xOffsets = [-1, 1];
            let yOffsets = [-1, 1];

            for (let offset of xOffsets) {
                if (!(thisX + offset >= BOARD_SIZE || thisX + offset < 0)) { //if not over or under bounds
                    let potentialInBoundsTile = BoardTile.fromId(alphabet[thisY] + alphabet[thisX + offset]);
                    if (potentialInBoundsTile.state == 0) {
                        possibleTiles.push(potentialInBoundsTile)
                    }
                }
            }


            for (let offset of yOffsets) {
                if (!(thisY + offset >= BOARD_SIZE || thisY + offset < 0)) { //if not over or under bounds
                    let potentialInBoundsTile = BoardTile.fromId(alphabet[thisY + offset] + alphabet[thisX]);
                    if (potentialInBoundsTile.state == 0) {
                        possibleTiles.push(potentialInBoundsTile)
                    }
                }
            }

            // console.log(possibleTiles);
            for (let oneTile of possibleTiles) {
                oneTile.elem().style.backgroundColor = "goldenrod";
                highlightedTiles.push(oneTile);
                oneTile.elegibleForMovement = true;
            }
        }

        this.updateState = (newState, pieceHTML = "") => {
            if (newState == 0) {
                this.elem().innerHTML = "";
                this.state = newState;
            } else if (newState == 1 || newState == 2) {
                console.log(pieceHTML)
                this.elem().innerHTML = pieceHTML;
                this.state = newState;
            }
        }
    }


    static executeMovement = (toTile) => {
        if (isFirstPlayersTurn) {
            toTile.updateState(1, movingTile.elem().innerHTML)
        } else {
            toTile.updateState(2, movingTile.elem().innerHTML)
        }

        movingTile.updateState(0);
        movingTile = null;
        BoardTile.clearHighlights();

        playerMovesLeft--;
        document.getElementById("movesIndicator").innerHTML = playerMovesLeft + " moves left";
        checkMoves();

    }


    static handleClick = (id) => {
        let tile = BoardTile.fromId(id)
        if ((tile.state == 1 && isFirstPlayersTurn) || (tile.state == 2 && !isFirstPlayersTurn)) {
            BoardTile.clearHighlights();
            tile.highlightMovableTiles();
            movingTile = tile;
        } else if (tile.elegibleForMovement) {
            this.executeMovement(tile)
        } else {
            BoardTile.clearHighlights();
        }
    }


    static clearHighlights = () => {
        for (let tile of highlightedTiles) {
            tile.elem().style.backgroundColor = "white"
            tile.elegibleForMovement = false;
        }
        highlightedTiles = [];
    }

    static fromId = (id) => {
        return board[alphabet.indexOf(id.substr(0, 1))][alphabet.indexOf(id.substr(1, 1))];
    }
}



function populateStartingPieces() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        document.getElementById(alphabet[0] + alphabet[i]).innerHTML = `<span class="playerOnePiece"></span>`;
        BoardTile.fromId(alphabet[0] + alphabet[i]).state = 1;
    }
    for (let i = 0; i < BOARD_SIZE; i++) {
        document.getElementById(alphabet[BOARD_SIZE - 1] + alphabet[i]).innerHTML = `<span class="playerTwoPiece"></span>`;
        BoardTile.fromId(alphabet[BOARD_SIZE - 1] + alphabet[i]).state = 2;
    }
}

function bindClickEvents() {
    Array.from(document.getElementsByClassName("cell")).forEach(elem => {
        let supportsTouch = false;
        if ('ontouchstart' in window) {
            //iOS & android
            supportsTouch = true;

        } else if (window.navigator.msPointerEnabled) {

            // Windows
            // To test for touch capable hardware 
            if (navigator.msMaxTouchPoints) {
                supportsTouch = true;
            }

        }

        if (supportsTouch) {
            elem.addEventListener("touchstart", function () {
                BoardTile.handleClick(elem.id);
            });

        } else {
            elem.addEventListener("click", function () {
                BoardTile.handleClick(elem.id);
            })
        }
    })
}

function checkMoves(){
    if(playerMovesLeft == 0){
        isFirstPlayersTurn = !isFirstPlayersTurn;
        playerMovesLeft = 2;
        document.getElementById("movesIndicator").innerHTML = playerMovesLeft + " moves left";
        if(isFirstPlayersTurn){
            document.getElementById("turnIndicator").innerHTML = "It is the First player's turn";
        }else{
            document.getElementById("turnIndicator").innerHTML = "It is the Second player's turn";
        }

    }else if(playerMovesLeft < 0){
        alert("playerMovesLeft is less than zero. This is a problem.")
    }
}