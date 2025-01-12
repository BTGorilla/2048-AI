let gridDisplay, scoreDisplay, squares, score, moveHistory, largestNumber, moveSequence, directions;
const width = 4;

function createBoard() {
    gridDisplay.innerHTML = '';
    squares = Array.from({ length: width * width }, () => {
        const square = document.createElement("div");
        square.innerHTML = 0;
        gridDisplay.appendChild(square);
        return square;
    });
    generate();
    generate();
}

function handleKey(direction) {
    move(direction);
    combine(direction);
    move(direction);
    generate();
    checkWin();
    addColours();
}

function move(direction) {
    for (let i = 0; i < width; i++) {
        const row = Array.from({ length: width }, (_, j) =>
            parseInt(squares[directions[direction].index(i, j)].innerHTML)
        );
        const filteredRow = row.filter(num => num);
        const newRow = [...filteredRow, ...Array(width - filteredRow.length).fill(0)];
        newRow.forEach((value, j) =>
            squares[directions[direction].index(i, j)].innerHTML = value
        );
    }
}

function combine(direction) {
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < directions[direction].limit; j++) {
            const currentIndex = directions[direction].index(i, j);
            const nextIndex = currentIndex + directions[direction].step;
            if (squares[currentIndex].innerHTML === squares[nextIndex].innerHTML) {
                const combinedTotal = parseInt(squares[currentIndex].innerHTML) * 2;
                squares[currentIndex].innerHTML = combinedTotal;
                squares[nextIndex].innerHTML = 0;
                score += combinedTotal;
                scoreDisplay.textContent = score;

                if (combinedTotal > largestNumber) {
                    largestNumber = combinedTotal;
                }
            }
        }
    }
}

function generate() {
    const emptySquares = squares.filter(square => square.innerHTML == 0);
    if (emptySquares.length > 0) {
        const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
        randomSquare.innerHTML = 2;
        checkGameOver();
    }
}

function checkWin() {
    if (squares.some(square => square.innerHTML == 2048)) {
        alert("Congratulations! You reached 2048!");
        resetGame();
    }
}

let gameOver = false;

function checkGameOver() {
    if (squares.every(square => square.innerHTML != 0)) {
        if (!gameOver) {
            gameOver = true;
            endGame();
        }
        return true;
    }
    return false;
}

function endGame() {
    losses++;
    lossesDisplay.textContent = losses;
    resetGame();
}

function resetGame() {
    console.log("AI reached:", largestNumber);
    moveHistory.push({ score: largestNumber, moves: moveSequence });

    createBoard();
    score = 0;
    scoreDisplay.textContent = score;
    largestNumber = 0;
    moveSequence = [];
    gameOver = false;
}

function replicateMoves() {
    moveHistory.forEach(record => {
        record.moves.forEach((move, index) => {
            setTimeout(() => handleKey(move), 1000 * index);
        });
    });
}

function addColours() {
    const baseColors = [
        "#afa192", "#eee4da", "#ede0c8", "#f2b179", "#ffcea4",
        "#e8c064", "#ffab6e", "#fd9982", "#ead79c", "#76daff",
        "#beeaa5", "#d7d4f0"
    ];

    squares.forEach(square => {
        const value = parseInt(square.innerHTML);
        square.style.backgroundColor = value === 0 ? baseColors[0] :
            value > 0 && value <= 2048 ? baseColors[Math.log2(value)] : "";
    });
}

let QTable = {};
const learningRate = 0.1;
const discountFactor = 0.9;
const epsilon = 0.1;

function getStateKey() {
    return squares.map(square => square.innerHTML).join(',');
}

function chooseAction(stateKey) {
    if (Math.random() < epsilon) {
        return aiMoves[Math.floor(Math.random() * aiMoves.length)];
    } else {
        let bestAction = aiMoves[0];
        let bestQValue = QTable[stateKey] ? QTable[stateKey][bestAction] || 0 : 0;
        aiMoves.forEach(action => {
            const qValue = QTable[stateKey] ? QTable[stateKey][action] || 0 : 0;
            if (qValue > bestQValue) {
                bestQValue = qValue;
                bestAction = action;
            }
        });
        return bestAction;
    }
}

function updateQValue(stateKey, action, reward, nextStateKey) {
    if (!QTable[stateKey]) QTable[stateKey] = {};
    if (!QTable[nextStateKey]) QTable[nextStateKey] = {};
    const currentQValue = QTable[stateKey][action] || 0;
    const maxNextQValue = Math.max(...Object.values(QTable[nextStateKey]));
    QTable[stateKey][action] = currentQValue + learningRate * (reward + discountFactor * maxNextQValue - currentQValue);
}

function aiPlay() {
    const stateKey = getStateKey();
    const action = chooseAction(stateKey);

    handleKey(action);
    const nextStateKey = getStateKey();
    const reward = score;

    updateQValue(stateKey, action, reward, nextStateKey);

    if (!checkGameOver()) {
        setTimeout(aiPlay, 1);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    gridDisplay = document.querySelector(".grid");
    scoreDisplay = document.querySelector("#score");
    lossesDisplay = document.querySelector("#losses");
    squares = [];
    score = 0;
    losses = 0;
    moveHistory = [];
    largestNumber = 0;
    moveSequence = [];

    directions = {
        left: { index: (i, j) => i * width + j, step: 1, limit: 3 },
        right: { index: (i, j) => i * width + (width - 1 - j), step: -1, limit: 3 },
        up: { index: (i, j) => j * width + i, step: width, limit: 3 },
        down: { index: (i, j) => (width - 1 - j) * width + i, step: -width, limit: 3 }
    };

    createBoard();
    addColours();
    setInterval(addColours, 50);
    document.addEventListener("keydown", control);
    aiPlay();
});

function control(event) { }

function aiPlay() {
    const aiMoves = ['left', 'right', 'up'];
    const targetCorner = 0;

    function getLargestTile() {
        let largestTile = { value: 0, index: -1 };
        squares.forEach((square, index) => {
            const value = parseInt(square.innerHTML);
            if (value > largestTile.value) {
                largestTile.value = value;
                largestTile.index = index;
            }
        });
        return largestTile;
    }

    function evaluateBoard() {
        let score = 0;
        let maxTile = 0;
        let freeTiles = 0;
        let smoothness = 0;
        let monotonicity = 0;
        let zigZagScore = 0;

        squares.forEach((square, index) => {
            const value = parseInt(square.innerHTML);
            if (value > 0) {
                score += value;
                maxTile = Math.max(maxTile, value);

                if (index === targetCorner) {
                    score += value * 20;
                } else if (index === 1 || index === width) {
                    score += value * 10;
                }

                if (index % width !== 0) {
                    const leftValue = parseInt(squares[index - 1].innerHTML);
                    smoothness -= Math.abs(value - leftValue);
                }
                if (index >= width) {
                    const upValue = parseInt(squares[index - width].innerHTML);
                    smoothness -= Math.abs(value - upValue);
                }

                if (index > 0) {
                    const prevValue = parseInt(squares[index - 1].innerHTML);
                    if (value < prevValue) {
                        zigZagScore += value;
                    } else if (value > prevValue) {
                        zigZagScore -= value * 3;
                    }
                }

                if (index % width !== 0 && value === parseInt(squares[index - 1].innerHTML)) {
                    score += value * 5;
                }
                if (index >= width && value === parseInt(squares[index - width].innerHTML)) {
                    score += value * 5;
                }
            } else {
                freeTiles++;
            }
        });

        score += maxTile * 100;
        score += freeTiles * 50;
        score += smoothness * 2;
        score += zigZagScore * 3;
        return score;
    }

    function expectimax(depth) {
        if (depth === 0 || checkGameOver()) {
            return evaluateBoard();
        }

        let bestScore = -Infinity;
        aiMoves.forEach(move => {
            const originalSquares = squares.map(square => square.innerHTML);
            handleKey(move);
            let moveScore = expectimax(depth - 1);
            if (moveScore > bestScore) {
                bestScore = moveScore;
            }
            squares.forEach((square, index) => {
                square.innerHTML = originalSquares[index];
            });
        });

        return bestScore;
    }
    function makeBestMove() {
        const largestTile = getLargestTile();
        let bestMoves = [];
        let bestScore = -Infinity;

        aiMoves.forEach(move => {
            const originalSquares = squares.map(square => square.innerHTML);
            handleKey(move);
            let moveScore = expectimax(3);

            const newLargestTile = getLargestTile();
            if (newLargestTile.index === targetCorner) {
                moveScore += 2000;
            } else if (newLargestTile.index === 1 || newLargestTile.index === width) {
                moveScore += 1000;
            }

            let zigZagPenalty = 0;
            squares.forEach((square, index) => {
                if (index > 0) {
                    const prevValue = parseInt(squares[index - 1].innerHTML);
                    const currentValue = parseInt(square.innerHTML);
                    if (currentValue > prevValue) {
                        zigZagPenalty += currentValue * 3;
                    }
                }
            });
            moveScore -= zigZagPenalty;

            if (moveScore > bestScore) {
                bestScore = moveScore;
                bestMoves = [move];
            } else if (moveScore === bestScore) {
                bestMoves.push(move);
            }

            squares.forEach((square, index) => {
                square.innerHTML = originalSquares[index];
            });
        });

        if (bestMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * bestMoves.length);
            const bestMove = bestMoves[randomIndex];
            handleKey(bestMove);
            moveSequence.push(bestMove);
        }

        if (!checkGameOver()) {
            setTimeout(makeBestMove, 1); //moves per milisecond
        }
    }

    makeBestMove();
}