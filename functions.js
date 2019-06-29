const BOARD_SIZE = 11; //max size is probably 25 due to alphabet encoding


let highlightedTiles = [];
let exchangingTiles = [];
let frozenTiles = [];
let selectedTile = null;

let placeablePieces = 0;

const EXCHANGE_BACKGROUND_COLOR = "lightgreen";
const EXCHANGE_BACKGROUND_COLOR_RGB = "rgb(144,238,144)"; //Bad workaround

class BoardTile {
    constructor(id) {
        this.id = id;
        this.state = 0; // 0->empty, 1-> firstPlayer, 2-> secondPlayer
        this.elegibleForMovement = false;
        this.elegibleToBeTraded = false;
        this.elegibleToBeLineAttacked = false;
        this.elegibleForPlacement = false;
        this.frozen = false;
        this.canBeginExchange = false;
        this.exchangeProgress = 0;
        this.resetOnHighlightClear = ["elegibleToBeTraded", "elegibleToBeLineAttacked", "elegibleForMovement"];
        this.lineData = {
            horiz: {
                keystone: false,
                directions: [],
                length: 0
            },
            vert: {
                keystone: false,
                directions: [],
                length: 0
            }
        }
        this.elem = () => {
            return document.getElementById(this.id);
        }

        this.getNeighborInDirection = (direction) => {
            let thisX = alphabet.indexOf(this.id.substr(1, 1));
            let thisY = alphabet.indexOf(this.id.substr(0, 1));
            let offset = 0;

            if (direction.toLowerCase() == "left" || direction.toLowerCase() == "up") {
                offset = -1;
            } else if (direction.toLowerCase() == "down" || direction.toLowerCase() == "right") {
                offset = 1;
            } else {
                alert("Passed bad direction to this.getNeighborInDirection")
            }

            if (direction.toLowerCase() == "left" || direction.toLowerCase() == "right") {
                if (!(thisX + offset >= BOARD_SIZE || thisX + offset < 0)) { //if not over or under bounds
                    let potentialInBoundsTile = BoardTile.fromId(alphabet[thisY] + alphabet[thisX + offset]);
                    return potentialInBoundsTile
                }
                return null;
            } else if (direction.toLowerCase() == "up" || direction.toLowerCase() == "down") {
                if (!(thisY + offset >= BOARD_SIZE || thisY + offset < 0)) { //if not over or under bounds
                    let potentialInBoundsTile = BoardTile.fromId(alphabet[thisY + offset] + alphabet[thisX]);
                    return potentialInBoundsTile;
                }
                return null;
            } else {
                alert("Again, bad direction at getNeighborInDirection");
            }
        }


        this.getNeighboringTiles = () => {
            let possibleTiles = [];

            let directions = ["UP", "DOWN", "LEFT", "RIGHT"]

            for (let dir of directions) {
                let dirNeighbor = this.getNeighborInDirection(dir)
                if (dirNeighbor !== null) {
                    possibleTiles.push(dirNeighbor)
                }
            }

            return possibleTiles;

        }

        this.playFreezeAnimation = () => {
            let r = 137;
            let g = 216;
            let b = 230;
            let a = 1;
            this.elem().style.background = `rgb(${r},${g},${b})`;
            let colorAnim = setInterval(() => {
                // r += 5;
                // g += 5;
                // b += 5;
                this.elem().style.background = `rgba(${r},${g},${b},${a})`;

                clearInterval(colorAnim);
                // this.elem().style.background = `rgb(255,255,255)`;

            }, 250)
        }

        this.getLineStatus = () => {

            this.lineData = {
                horiz: {
                    keystone: false,
                    directions: [],
                    length: 0
                },
                vert: {
                    keystone: false,
                    directions: [],
                    length: 0
                }
            }


            let horizLineTiles = [this];

            let horizDirections = ["left", "right"];

            let vertLineTiles = [this];

            let vertDirections = ["up", "down"];

            for (let hD of horizDirections) {
                let horizNeighbor = this.getNeighborInDirection(hD);
                let tState = this.state;
                while (horizNeighbor !== null && horizNeighbor.state == tState && horizNeighbor.exchangeProgress == 0) {
                    if (horizDirections.indexOf(hD) == 0) {
                        horizLineTiles.unshift(horizNeighbor);
                    } else {
                        horizLineTiles.push(horizNeighbor);

                    }
                    horizNeighbor = horizNeighbor.getNeighborInDirection(hD);
                }
            }


            for (let vD of vertDirections) {
                let vertNeighbor = this.getNeighborInDirection(vD);
                let tState = this.state;
                while (vertNeighbor !== null && vertNeighbor.state == tState && vertNeighbor.exchangeProgress == 0) {
                    if (vertDirections.indexOf(vD) == 0) {
                        vertLineTiles.unshift(vertNeighbor);
                    } else {
                        vertLineTiles.push(vertNeighbor);
                    }
                    vertNeighbor = vertNeighbor.getNeighborInDirection(vD);
                }
            }


            if (horizLineTiles[0] == this && horizLineTiles.length > 1) {
                this.lineData.horiz.keystone = true;
                this.lineData.horiz.directions.push("LEFT")
            } else if (horizLineTiles[horizLineTiles.length - 1] == this && horizLineTiles.length > 1) {
                this.lineData.horiz.keystone = true;
                this.lineData.horiz.directions.push("RIGHT")
            }

            if (vertLineTiles[0] == this && vertLineTiles.length > 1) {
                this.lineData.vert.keystone = true;
                this.lineData.vert.directions.push("UP")
            } else if (vertLineTiles[vertLineTiles.length - 1] == this && vertLineTiles.length > 1) {
                this.lineData.vert.keystone = true;
                this.lineData.vert.directions.push("DOWN")
            }



            this.lineData.horiz.length = horizLineTiles.length;

            this.lineData.vert.length = vertLineTiles.length;

            return this.lineData;
        }

        this.maybeHighlightLine = () => {
            this.getLineStatus();
            if (this.lineData.horiz.directions.length > 1) {
                alert("horizlinedata directions length > 1. Uhho");
                throw ("horizlinedata length > 1. Uhho");
            }

            if (this.lineData.horiz.directions.length !== 0) {
                let neighborInHorizDir = this.getNeighborInDirection(this.lineData.horiz.directions[0]);
                if (neighborInHorizDir !== null && neighborInHorizDir.state !== this.state) {
                    if (neighborInHorizDir.getLineStatus().horiz.length < this.lineData.horiz.length) {
                        //if attacking player is of longer length than defending line

                        let keystones = [this, neighborInHorizDir];
                        for (let ks of keystones) {
                            let color = (this == ks) ? "orange" : "darkorange";
                            ks.elem().style.backgroundColor = color;
                            highlightedTiles.push(ks);
                            ks.elegibleToBeLineAttacked = true;

                            if (ks.lineData.horiz.length > 1) {
                                let lineFlow = (ks.lineData.horiz.directions[0].toLowerCase() === "right") ? "left" : "right";

                                let nextMemberOfThisLine = ks.getNeighborInDirection(lineFlow);

                                while (nextMemberOfThisLine !== null && nextMemberOfThisLine.state === ks.state && nextMemberOfThisLine.exchangeProgress == 0) {
                                    nextMemberOfThisLine.elem().style.backgroundColor = color;
                                    highlightedTiles.push(nextMemberOfThisLine);
                                    nextMemberOfThisLine = nextMemberOfThisLine.getNeighborInDirection(lineFlow);
                                }
                            }
                        }
                    }
                }
            }

            if (this.lineData.vert.directions.length !== 0) {
                let neighborInVertDir = this.getNeighborInDirection(this.lineData.vert.directions[0]);
                if (neighborInVertDir !== null && neighborInVertDir.state !== this.state) {
                    if (neighborInVertDir.getLineStatus().vert.length < this.lineData.vert.length) {
                        //if attacking player is of longer length than defending line

                        let keystones = [this, neighborInVertDir];
                        for (let ks of keystones) {
                            let color = (this == ks) ? "orange" : "darkorange";
                            ks.elem().style.backgroundColor = color;
                            highlightedTiles.push(ks);
                            ks.elegibleToBeLineAttacked = true;

                            if (ks.lineData.vert.length > 1) {
                                // console.log(ks);
                                let lineFlow = (ks.lineData.vert.directions[0].toUpperCase() === "UP") ? "DOWN" : "UP";
                                let nextMemberOfThisLine = ks.getNeighborInDirection(lineFlow);
                                highlightedTiles.push(ks);
                                while (nextMemberOfThisLine !== null && nextMemberOfThisLine.state === ks.state && nextMemberOfThisLine.exchangeProgress == 0) {
                                    nextMemberOfThisLine.elem().style.backgroundColor = color;
                                    nextMemberOfThisLine.elegibleToBeLineAttacked = true;
                                    highlightedTiles.push(nextMemberOfThisLine);
                                    nextMemberOfThisLine = nextMemberOfThisLine.getNeighborInDirection(lineFlow);
                                }
                            }
                        }

                    }
                }
            }

        }


        this.highlightPossibleActions = () => {
            let neighboringTiles = this.getNeighboringTiles();
            if (this.canBeginExchange && ((this.state == 1 && isFirstPlayersTurn) || (this.state == 2 && !isFirstPlayersTurn))) {
                this.elem().style.backgroundColor = EXCHANGE_BACKGROUND_COLOR;
            }
            for (let t of neighboringTiles) {
                if (t.state == 0) { //open tile, available for movement
                    if (!this.frozen) {
                        t.elem().style.backgroundColor = "goldenrod";
                        highlightedTiles.push(t);
                        t.elegibleForMovement = true;
                    } else {
                        this.playFreezeAnimation();
                    }
                } else if ((t.state == 1 && !isFirstPlayersTurn) || (t.state == 2 && isFirstPlayersTurn)) { //tile contains an enemy
                    let lineInfo = t.getLineStatus();
                    if (this.getLineStatus().horiz.keystone || this.getLineStatus().vert.keystone && playerMovesLeft > 1) {
                        //proper line battle, two lines in one
                        this.maybeHighlightLine();
                    } else {
                        if (!lineInfo.horiz.keystone && !lineInfo.vert.keystone) {
                            t.elem().style.backgroundColor = "crimson";
                            highlightedTiles.push(t);
                            t.elegibleToBeTraded = true;
                        }
                    }

                }
            }
        }

        this.tradeWith = (tradingPartner) => {
            this.updateState(0);
            tradingPartner.updateState(0);
            BoardTile.clearHighlights();
            selectedTile = null;
            chargeMoves();
            BoardTile.checkWinner();
        }

        this.takeLineAttackFrom = (attacker) => {
            this.updateState(0);
            BoardTile.clearHighlights();
            selectedTile = null;
            chargeMoves(2);
            BoardTile.checkWinner();
        }

        this.beginExchange = () => {
            this.exchangeProgress++;
            chargeMoves();
            this.elem().style.backgroundColor = EXCHANGE_BACKGROUND_COLOR;
            BoardTile.clearHighlights();
            exchangingTiles.push(this);
            let colorLoop = setInterval(() => {
                if(this.elem().style.backgroundColor == "white"){
                    this.elem().style.backgroundColor = EXCHANGE_BACKGROUND_COLOR;
                }
                if(this.exchangeProgress == 0){
                    clearInterval(colorLoop);
                    this.cancelExchange();
                }
            }, 50)
        }

        this.checkExchange = () => {
            if (this.exchangeProgress >= 2) {
                this.updateState(0);
                this.canBeginExchange = false;
                this.exchangeProgress = 0;
                this.elem().style.backgroundColor = "white";
                placeablePieces = 2;
                let numOpenTiles = 0;
                let idDeterminer = (isFirstPlayersTurn) ? alphabet[0] : alphabet[BOARD_SIZE - 1];
                for (let i = 0; i < BOARD_SIZE; i++) {
                    let targetTile = BoardTile.fromId(idDeterminer + alphabet[i]);
                    targetTile.elegibleForPlacement = true;
                    if (targetTile.state == 0) {
                        numOpenTiles++;
                        targetTile.elem().style.backgroundColor = EXCHANGE_BACKGROUND_COLOR;
                    }
                }

                if (numOpenTiles == 1) {
                    placeablePieces = 1;
                } else if (numOpenTiles == 0) {
                    BoardTile.clearExchangeableTiles();
                }
            }
        }

        this.place = () => {

            if (isFirstPlayersTurn) {
                this.updateState(1, `<span class="playerOnePiece"></span>`)
            } else {
                this.updateState(2, `<span class="playerTwoPiece"></span>`)
            }
            this.frozen = true;
            frozenTiles.push(this);
            placeablePieces--;
            if (placeablePieces == 0) {
                BoardTile.clearExchangeableTiles();
            }
        }

        this.cancelExchange = () => {
            this.exchangeProgress = 0;
            exchangingTiles.splice(exchangingTiles.indexOf(this), 1);
            this.elem().style.backgroundColor = "white";
        }

        this.updateState = (newState, pieceHTML = "") => {
            if (newState == 0) {
                this.elem().innerHTML = "";
                this.state = newState;
            } else if (newState == 1 || newState == 2) {

                this.elem().innerHTML = pieceHTML;
                this.state = newState;
            }
        }
    }


    static executeMovement = (toTile) => {
        if (isFirstPlayersTurn) {
            toTile.updateState(1, selectedTile.elem().innerHTML)
        } else {
            toTile.updateState(2, selectedTile.elem().innerHTML)
        }

        selectedTile.updateState(0);
        selectedTile.canBeginExchange = false;
        selectedTile = null;
        BoardTile.clearHighlights();


        let potentialEnemyTiles = toTile.getNeighboringTiles();
        for (let pET of potentialEnemyTiles) {
            if ((pET.state == 1 && !isFirstPlayersTurn) || (pET.state == 2 && isFirstPlayersTurn)) {
                toTile.frozen = true;
                pET.cancelExchange();
                frozenTiles.push(toTile);
            }
        }

        if (toTile.id.substr(0, 1) === "a" && !isFirstPlayersTurn) {
            toTile.canBeginExchange = true;
        } else if (toTile.id.substr(0, 1) === alphabet[BOARD_SIZE - 1] && isFirstPlayersTurn) {
            toTile.canBeginExchange = true;
        } else {
            toTile.canBeginExchange = false;
        }
        chargeMoves();
        BoardTile.checkWinner();

    }

    static clearExchangeableTiles = () => {
        placeablePieces = 0;
        let idDeterminer = (isFirstPlayersTurn) ? alphabet[0] : alphabet[BOARD_SIZE - 1];
        for (let i = 0; i < BOARD_SIZE; i++) {
            let targetTile = BoardTile.fromId(idDeterminer + alphabet[i]);
            targetTile.elegibleForPlacement = false;
            targetTile.elem().style.backgroundColor = "white";
        }
        BoardTile.clearHighlights();
    }

    static checkWinner = () => {
        let p1Count = 0;
        let p2Count = 0;
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j].state == 1) {
                    p1Count++;
                } else if (board[i][j].state == 2) {
                    p2Count++;
                }
            }
        }
        if (p1Count === 0 || p2Count === 0) {
            let winner = (p1Count === 0) ? "Player 2" : "Player 1";
            alert(winner + " has won!");
        }
    }


    static handleClick = (id) => {
        let tile = BoardTile.fromId(id)
        if (placeablePieces == 0) {
            if (((tile.state == 1 && isFirstPlayersTurn) || (tile.state == 2 && !isFirstPlayersTurn)) && tile.elem().style.backgroundColor !== EXCHANGE_BACKGROUND_COLOR) {
                console.log("highlighting")
                BoardTile.clearHighlights();
                tile.highlightPossibleActions();
                selectedTile = tile;
            } else if (tile.elegibleForMovement) {
                this.executeMovement(tile)
            } else if (tile.elegibleToBeTraded) {
                tile.tradeWith(selectedTile);
            } else if (tile.elegibleToBeLineAttacked) {
                tile.takeLineAttackFrom(selectedTile);
            } else if (tile.canBeginExchange && tile.elem().style.backgroundColor == EXCHANGE_BACKGROUND_COLOR && tile.exchangeProgress === 0) {
                console.log("Begin exchange");
                tile.beginExchange();
            } else {
                console.log("clearing")

                BoardTile.clearHighlights();
            }
        } else {
            if (tile.elegibleForPlacement && tile.state == 0) {
                tile.place();
            } else {
                alert("You must place pieces first")
            }
        }

    }


    static clearHighlights = () => {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                let tile = board[i][j];
                if (tile.exchangeProgress === 0) {
                    tile.elem().style.backgroundColor = "white";
                }

                for (let p of tile.resetOnHighlightClear) {
                    tile[p] = false;
                }

                tile.lineData = {
                    horiz: {
                        keystone: false,
                        directions: [],
                        length: 0
                    },
                    vert: {
                        keystone: false,
                        directions: [],
                        length: 0
                    }
                }
            }
            highlightedTiles = [];
        }
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
            }, {passive: true});

        } else {
            elem.addEventListener("click", function () {
                BoardTile.handleClick(elem.id);
            })
        }
    });

    document.getElementById("passBtn").addEventListener("click", function() {
        chargeMoves(playerMovesLeft);
    })
}

function chargeMoves(valueToCharge = 1) {
    playerMovesLeft -= valueToCharge;
    checkMoves();
}


function checkMoves() {

    document.getElementById("movesIndicator").innerHTML = playerMovesLeft + " moves left";

    if (playerMovesLeft == 0) {
        isFirstPlayersTurn = !isFirstPlayersTurn;
        BoardTile.checkWinner();
        playerMovesLeft = 2;
        for (let exchangingTile of exchangingTiles) {
            if ((exchangingTile.state == 1 && isFirstPlayersTurn) || (exchangingTile.state == 2 && !isFirstPlayersTurn)) {
                exchangingTile.exchangeProgress++;
                chargeMoves();
                exchangingTile.checkExchange();
            }
        }
        for (let frozenTile of frozenTiles) {
            frozenTile.frozen = false;
        }
        document.getElementById("movesIndicator").innerHTML = playerMovesLeft + " moves left";
        if (isFirstPlayersTurn) {
            document.getElementById("turnIndicator").innerHTML = "It is the First player's turn";
        } else {
            document.getElementById("turnIndicator").innerHTML = "It is the Second player's turn";
        }

    } else if (playerMovesLeft < 0) {
        alert("playerMovesLeft is less than zero. This is a problem.")
    }
}


function checkIfBoardIsCorect() {
    //build html element board
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            let lookingAt = board[i][j];

            if (
                lookingAt.elegibleForMovement === false &&
                lookingAt.frozen === false &&
                lookingAt.elegibleToBeLineAttacked === false &&
                lookingAt.elegibleToBeTraded === false &&
                lookingAt.lineData.horiz.length === 0 &&
                lookingAt.lineData.vert.length === 0
            ) {
                console.log("Board seems correct")
            } else {
                console.log("board is not correct at [" + i + "][" + j)
            }

        }
    }
}