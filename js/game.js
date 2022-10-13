const checks = {
    checkForWin: function () {
        const fields = document.querySelectorAll('.game-field .row .field');

        let total = 0;
        for (let field of fields) {
            if (field.classList.contains("mine") && field.classList.contains("flagged")) total++;
        }
        if (total === game.mines) {
            alert('You won!')
            game.isGameOver = true;
        }
    }    
}

const domManipulation = {
    drawBoard: function () {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const rows = parseInt(urlParams.get('rows'));
        const cols = parseInt(urlParams.get('cols'));
        const mineCount = parseInt(urlParams.get('mines'));
        game.mines = mineCount;
        const minePlaces = util.getRandomMineIndexes(mineCount, cols, rows);

        //Set how many flags do we have
        game.flagsLeftCounter.setAttribute("value", mineCount.toString());
        game.flagsLeft = mineCount;

        let gameField = document.querySelector('.game-field');
        this.setGameFieldSize(gameField, rows, cols);
        let cellIndex = 0
        for (let row = 0; row < rows; row++) {
            const rowElement = this.addRow(gameField);
            for (let col = 0; col < cols; col++) {
                this.addCell(rowElement, row, col, minePlaces.has(cellIndex));
                cellIndex++;
            }
        }
    },

    setGameFieldSize: function (gameField, rows, cols) {
        gameField.style.width = (gameField.dataset.cellWidth * rows) + 'px';
        gameField.style.height = (gameField.dataset.cellHeight * cols) + 'px';
    },

    addRow: function (gameField) {
        gameField.insertAdjacentHTML(
            'beforeend',
            '<div class="row"></div>'
        );
        return gameField.lastElementChild;
    },

    addCell: function (rowElement, row, col, isMine) {
        rowElement.insertAdjacentHTML(
            'beforeend',
            `<div class="field${isMine ? ' mine' : ''}"
                        data-row="${row}"
                        data-col="${col}"></div>`);
    }
}

const util = {
    getRandomMineIndexes: function (mineCount, cols, rows) {
        const cellCount = cols * rows;
        let mines = new Set();
        do {
            mines.add(Math.round(Math.random() * (cellCount - 1)));
        } while (mines.size < mineCount && mines.size < cellCount);
        return mines;
    },
    
    getNeighbors: function (field){
    let row = Number(field.getAttribute('data-row'));
    let col = Number(field.getAttribute('data-col'));

    let neighbors = [];

    neighbors.push(this.getNode(row-1,col-1));
    neighbors.push(this.getNode(row-1,col));
    neighbors.push(this.getNode(row-1,col+1));
    neighbors.push(this.getNode(row,col-1));
    neighbors.push(this.getNode(row,col+1));
    neighbors.push(this.getNode(row+1,col-1));
    neighbors.push(this.getNode(row+1,col));
    neighbors.push(this.getNode(row+1,col+1));

    return neighbors.filter(x => x != null);
    },
    
    getNode: function (row, col) {
        return document.querySelector(`div[data-row="${row}"][data-col="${col}"]`);
    },
    
    countAdjacentMines: function (field) {
        let total = 0;
    
        function hasMine(node){
            return node.classList.contains('mine')
        }
    
        for (let neighbor of this.getNeighbors(field)) {
            if (hasMine(neighbor)) total++;
        }
    
        return total;
    },
    
    recur: function (field) {
        for (let neighbor of this.getNeighbors(field)) this.leftClick(neighbor)
    },

    leftClick: function (field) {
        //Start timer
        if (!game.isGameStarted) {
            timer.startTimer();
            game.isGameStarted = true;
        }
        if (game.isGameOver) return;
        if (field.classList.contains('open') || field.classList.contains('flagged')) return;
        if (field.classList.contains('mine')) {
            game.gameOver();
        } else {
            let total = util.countAdjacentMines(field);
    
            if (total !== 0) {
                field.classList.add('open');
                field.innerHTML = total;
                return;
            } else{
                field.classList.add('open');
                util.recur(field);
            }
        }
    
        field.classList.add('open');
    },
    
    //Right click
    addOrRemoveFlag: function (field) {
        //Start timer
        if (!game.isGameStarted) {
            timer.startTimer();
            game.isGameStarted = true;
        }
        
        if (!field.classList.contains('flagged') && game.flagsLeft > 0){
            field.classList.add('flagged');
            game.flagsLeft--;
            game.flagsLeftCounter.setAttribute("value", game.flagsLeft.toString());
            checks.checkForWin();
        } else {
            if (field.classList.contains('flagged')){
                field.classList.remove('flagged');
                game.flagsLeft++;
                game.flagsLeftCounter.setAttribute("value", game.flagsLeft.toString());
            }
        }
    }
}

const timer = {
    elapsedTime : 0,

    timerEl : document.querySelector('#elapsed-time-counter'),

    updateTime: function () {
        if (!game.isGameOver) {
            let seconds = this.elapsedTime % 60;
            let minutes = Math.floor(this.elapsedTime / 60);
            let hours = Math.floor(this.elapsedTime / 3600);
    
            seconds = seconds < 10 ? '0' + seconds : seconds;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            hours = hours < 10 ? '0' + hours : hours;
            
            let counter = `${hours} : ${minutes} : ${seconds}`;
    
            this.timerEl.setAttribute("value", counter);
            this.elapsedTime++;
        }
    },

    startTimer: function () {
        setInterval(()=>this.updateTime(), 1000)
    }
}

const game = {
    flagsLeftCounter: document.querySelector('#flags-left-counter'),
    isGameStarted : false,
    isGameOver : false,
    flagsLeft : 0,
    mines : 0,

    init: function () {
        //Create the board
        domManipulation.drawBoard();

        //What should happen when we click on a tile    
        this.initRightClick();
        this.initLeftClick();
    },
    
    initRightClick: function () {
        const fields = document.querySelectorAll('.game-field .row .field');

        for (let field of fields) {
            field.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                if (game.isGameOver) return;
                if (!field.classList.contains('opened')){
                    util.addOrRemoveFlag(field);
                }
            });
        }
    },

    initLeftClick: function () {
        const fields = document.querySelectorAll('.game-field .row .field');

        for (let field of fields) {
            field.addEventListener('click', () => util.leftClick(field));
        }
    },
        
    gameOver: function () {
        const fields = document.querySelectorAll('.game-field .row .field');
        for (let field of fields) {
            if (field.classList.contains("mine")) {
                field.classList.add("open")
            }
        }
    
        alert('Boom! Game over!');
        game.isGameOver = true;
    }
}

game.init();
