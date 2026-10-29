/**
 * MY GAME CENTRE - Advanced Tic-Tac-Toe
 * Supports 3x3 up to 8x8 + Custom boards, Single Player (AI) & 2-Player modes,
 * customizable win conditions, win-line highlighting, and smart AI.
 */

const TicTacToe = {
    // Game configuration
    size: 3,
    winLength: 3,
    mode: 'pvc', // 'pvc' (vs Computer) or 'pvp' (Two Players)
    
    // Game state
    board: [],
    currentPlayer: 'X', // 'X' is Player 1 (or Human), 'O' is Player 2 (or Computer)
    gameActive: false,
    moveCount: 0,
    isAiThinking: false,
    winningCells: [],
    
    // DOM elements cache
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadScores();
        this.updateSettingsDisplay();
        this.resetGame(false);
    },

    cacheElements() {
        this.elements = {
            view: document.getElementById('view-tictactoe'),
            boardContainer: document.getElementById('ttt-board'),
            modePvcBtn: document.getElementById('ttt-mode-pvc'),
            modePvpBtn: document.getElementById('ttt-mode-pvp'),
            sizeSelect: document.getElementById('ttt-size-select'),
            customSettingsRow: document.getElementById('ttt-custom-settings'),
            customSizeInput: document.getElementById('ttt-custom-size'),
            customWinInput: document.getElementById('ttt-custom-win'),
            applyCustomBtn: document.getElementById('ttt-apply-custom'),
            infoBanner: document.getElementById('ttt-info-banner'),
            turnIndicator: document.getElementById('ttt-turn-indicator'),
            restartBtn: document.getElementById('ttt-restart-btn'),
            resetScoresBtn: document.getElementById('ttt-reset-scores-btn'),
            
            // Scoreboard elements
            scoreLabel1: document.getElementById('ttt-score-label-1'),
            scoreLabel2: document.getElementById('ttt-score-label-2'),
            scoreVal1: document.getElementById('ttt-score-val-1'),
            scoreVal2: document.getElementById('ttt-score-val-2'),
            scoreValDraws: document.getElementById('ttt-score-val-draws'),
            
            // Result overlay
            resultOverlay: document.getElementById('ttt-result-overlay'),
            resultTitle: document.getElementById('ttt-result-title'),
            resultMessage: document.getElementById('ttt-result-message'),
            resultPlayAgainBtn: document.getElementById('ttt-result-play-again')
        };
    },

    bindEvents() {
        // Mode buttons
        this.elements.modePvcBtn.addEventListener('click', () => this.handleModeChange('pvc'));
        this.elements.modePvpBtn.addEventListener('click', () => this.handleModeChange('pvp'));

        // Size selector
        this.elements.sizeSelect.addEventListener('change', (e) => this.handleSizeSelect(e.target.value));

        // Custom size apply
        this.elements.applyCustomBtn.addEventListener('click', () => this.applyCustomSettings());

        // Restart button
        this.elements.restartBtn.addEventListener('click', () => this.resetGame(true));

        // Reset scores
        this.elements.resetScoresBtn.addEventListener('click', () => this.confirmResetScores());

        // Play again from result overlay
        this.elements.resultPlayAgainBtn.addEventListener('click', () => {
            this.hideResultOverlay();
            this.resetGame(true);
        });

        // Board clicks (event delegation)
        this.elements.boardContainer.addEventListener('click', (e) => {
            const cell = e.target.closest('.ttt-cell');
            if (cell) {
                const r = parseInt(cell.dataset.row, 10);
                const c = parseInt(cell.dataset.col, 10);
                this.handleCellClick(r, c);
            }
        });
    },

    loadScores() {
        const scores = Storage.getTTTScores(this.mode);
        if (this.mode === 'pvc') {
            this.elements.scoreLabel1.textContent = 'YOU (X)';
            this.elements.scoreLabel2.textContent = 'COMPUTER (O)';
            this.elements.scoreVal1.textContent = scores.wins || 0;
            this.elements.scoreVal2.textContent = scores.losses || 0;
            this.elements.scoreValDraws.textContent = scores.draws || 0;
        } else {
            this.elements.scoreLabel1.textContent = 'PLAYER 1 (X)';
            this.elements.scoreLabel2.textContent = 'PLAYER 2 (O)';
            this.elements.scoreVal1.textContent = scores.p1Wins || 0;
            this.elements.scoreVal2.textContent = scores.p2Wins || 0;
            this.elements.scoreValDraws.textContent = scores.draws || 0;
        }
    },

    confirmResetScores() {
        const modeName = this.mode === 'pvc' ? 'Player vs Computer' : 'Two Players';
        App.showConfirmModal(
            'Reset Scores?',
            `Are you sure you want to reset all Tic-Tac-Toe scores for ${modeName}? This action cannot be undone.`,
            () => {
                Storage.resetTTTScores(this.mode);
                this.loadScores();
                SoundManager.playClick();
                App.showToast('Tic-Tac-Toe scores reset to zero.');
            }
        );
    },

    handleModeChange(newMode) {
        if (newMode === this.mode) return;

        const switchMode = () => {
            this.mode = newMode;
            this.elements.modePvcBtn.classList.toggle('active', newMode === 'pvc');
            this.elements.modePvpBtn.classList.toggle('active', newMode === 'pvp');
            this.loadScores();
            this.resetGame(false);
            SoundManager.playClick();
        };

        if (this.moveCount > 0 && this.gameActive) {
            App.showConfirmModal(
                'Discard Active Match?',
                'A match is currently in progress. Switching game modes will reset the active board.',
                switchMode,
                () => {
                    // Revert mode buttons
                    this.elements.modePvcBtn.classList.toggle('active', this.mode === 'pvc');
                    this.elements.modePvpBtn.classList.toggle('active', this.mode === 'pvp');
                }
            );
        } else {
            switchMode();
        }
    },

    handleSizeSelect(val) {
        if (val === 'custom') {
            this.elements.customSettingsRow.classList.remove('hidden');
            return;
        } else {
            this.elements.customSettingsRow.classList.add('hidden');
        }

        const newSize = parseInt(val, 10);
        const newWin = newSize; // Default: winLength equals board dimension

        this.changeBoardDimensions(newSize, newWin);
    },

    applyCustomSettings() {
        let size = parseInt(this.elements.customSizeInput.value, 10);
        let win = parseInt(this.elements.customWinInput.value, 10);

        if (isNaN(size) || size < 3) size = 3;
        if (size > 10) size = 10;
        this.elements.customSizeInput.value = size;

        if (isNaN(win) || win < 3) win = 3;
        if (win > size) win = size;
        this.elements.customWinInput.value = win;

        this.changeBoardDimensions(size, win);
    },

    changeBoardDimensions(newSize, newWin) {
        const executeChange = () => {
            this.size = newSize;
            this.winLength = newWin;
            this.updateSettingsDisplay();
            this.resetGame(false);
            SoundManager.playClick();
        };

        if (this.moveCount > 0 && this.gameActive) {
            App.showConfirmModal(
                'Discard Active Match?',
                'A match is currently in progress. Changing the board size will reset the active board.',
                executeChange,
                () => {
                    // Revert select dropdown
                    const isStandard = this.winLength === this.size && this.size >= 3 && this.size <= 8;
                    this.elements.sizeSelect.value = isStandard ? String(this.size) : 'custom';
                    if (isStandard) {
                        this.elements.customSettingsRow.classList.add('hidden');
                    }
                }
            );
        } else {
            executeChange();
        }
    },

    updateSettingsDisplay() {
        this.elements.infoBanner.textContent = 
            `Board: ${this.size}×${this.size}  |  Win Condition: Connect ${this.winLength} in a row`;
    },

    resetGame(playSound = true) {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(''));
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.moveCount = 0;
        this.isAiThinking = false;
        this.winningCells = [];

        this.hideResultOverlay();
        this.renderBoard();
        this.updateTurnIndicator();

        if (playSound) {
            SoundManager.playClick();
        }
    },

    renderBoard() {
        const container = this.elements.boardContainer;
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        // Dynamically adjust font-size and cell max-size based on dimension
        const cellSize = Math.max(38, Math.min(85, Math.floor(450 / this.size)));
        const fontSize = Math.max(1.1, Math.min(2.5, (cellSize * 0.55) / 16));
        
        container.style.setProperty('--cell-size', `${cellSize}px`);
        container.style.setProperty('--cell-font-size', `${fontSize}rem`);

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = document.createElement('button');
                cell.className = 'ttt-cell';
                cell.type = 'button';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);
                
                const val = this.board[r][c];
                if (val) {
                    cell.textContent = val;
                    cell.classList.add(`symbol-${val.toLowerCase()}`, 'occupied');
                }
                container.appendChild(cell);
            }
        }
    },

    updateTurnIndicator() {
        if (!this.gameActive) return;

        if (this.mode === 'pvc') {
            if (this.currentPlayer === 'X') {
                this.elements.turnIndicator.innerHTML = 
                    `<span class="badge player-x">X</span> Your Turn`;
            } else {
                this.elements.turnIndicator.innerHTML = 
                    `<span class="badge player-o">O</span> Computer thinking...`;
            }
        } else {
            if (this.currentPlayer === 'X') {
                this.elements.turnIndicator.innerHTML = 
                    `<span class="badge player-x">X</span> Player 1's Turn`;
            } else {
                this.elements.turnIndicator.innerHTML = 
                    `<span class="badge player-o">O</span> Player 2's Turn`;
            }
        }
    },

    handleCellClick(r, c) {
        // Validation: must be active, empty cell, and not waiting for AI
        if (!this.gameActive || this.isAiThinking) return;
        if (this.board[r][c] !== '') return;

        // In PVC mode, only human moves on 'X'
        if (this.mode === 'pvc' && this.currentPlayer !== 'X') return;

        this.makeMove(r, c, this.currentPlayer);
    },

    makeMove(r, c, player) {
        this.board[r][c] = player;
        this.moveCount++;
        SoundManager.playMove(player === 'O');

        // Update DOM cell
        const cell = this.elements.boardContainer.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            cell.textContent = player;
            cell.classList.add(`symbol-${player.toLowerCase()}`, 'occupied', 'pop-in');
        }

        // Check for Win or Draw
        const winResult = this.checkWin(this.board, this.size, this.winLength);

        if (winResult) {
            this.handleGameEnd('win', winResult);
            return;
        }

        if (this.moveCount === this.size * this.size) {
            this.handleGameEnd('draw');
            return;
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateTurnIndicator();

        // If computer's turn in PVC mode
        if (this.mode === 'pvc' && this.currentPlayer === 'O') {
            this.isAiThinking = true;
            // Short realistic thinking delay for smooth UX
            setTimeout(() => {
                if (!this.gameActive) return;
                this.makeAiMove();
            }, 300);
        }
    },

    /**
     * AI Move Execution
     * Uses optimal minimax for 3x3, and ultra-fast smart heuristic evaluation for 4x4-8x8.
     */
    makeAiMove() {
        const move = this.getBestMove();
        this.isAiThinking = false;
        if (move && this.gameActive) {
            this.makeMove(move.r, move.c, 'O');
        }
    },

    getBestMove() {
        // If 3x3, use Minimax with full depth
        if (this.size === 3 && this.winLength === 3) {
            return this.getMinimaxMove();
        }

        // For larger boards (4x4 to 8x8+), use smart heuristic evaluation
        return this.getHeuristicMove();
    },

    getMinimaxMove() {
        let bestScore = -Infinity;
        let move = null;
        const availableMoves = this.getEmptyCells(this.board);

        // Fast center move opening
        if (this.board[1][1] === '') {
            return { r: 1, c: 1 };
        }

        for (const m of availableMoves) {
            this.board[m.r][m.c] = 'O';
            const score = this.minimax(this.board, 0, false, -Infinity, Infinity, 6);
            this.board[m.r][m.c] = '';
            if (score > bestScore) {
                bestScore = score;
                move = m;
            }
        }
        return move || availableMoves[0];
    },

    minimax(board, depth, isMaximizing, alpha, beta, maxDepth) {
        const result = this.checkWin(board, 3, 3);
        if (result) {
            return result.winner === 'O' ? 10 - depth : depth - 10;
        }
        if (this.getEmptyCells(board).length === 0 || depth >= maxDepth) {
            return 0;
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const m of this.getEmptyCells(board)) {
                board[m.r][m.c] = 'O';
                const evaluation = this.minimax(board, depth + 1, false, alpha, beta, maxDepth);
                board[m.r][m.c] = '';
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const m of this.getEmptyCells(board)) {
                board[m.r][m.c] = 'X';
                const evaluation = this.minimax(board, depth + 1, true, alpha, beta, maxDepth);
                board[m.r][m.c] = '';
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    },

    /**
     * Fast Heuristic AI for 4x4 through 8x8 boards:
     * 1. Immediate winning move check
     * 2. Immediate block opponent winning move check
     * 3. Two-in-a-row / fork threat creation and blocking
     * 4. Positional weighting (center preference, proximity to own marks)
     */
    getHeuristicMove() {
        const emptyCells = this.getEmptyCells(this.board);
        if (emptyCells.length === 0) return null;

        // 1. Check if AI can win immediately
        for (const cell of emptyCells) {
            this.board[cell.r][cell.c] = 'O';
            const win = this.checkWin(this.board, this.size, this.winLength);
            this.board[cell.r][cell.c] = '';
            if (win && win.winner === 'O') {
                return cell;
            }
        }

        // 2. Check if Human can win immediately on their next turn - BLOCK IT!
        for (const cell of emptyCells) {
            this.board[cell.r][cell.c] = 'X';
            const win = this.checkWin(this.board, this.size, this.winLength);
            this.board[cell.r][cell.c] = '';
            if (win && win.winner === 'X') {
                return cell;
            }
        }

        // 3. Check for (winLength - 1) threats
        let bestScore = -100000;
        let bestCell = emptyCells[0];

        const center = (this.size - 1) / 2;

        for (const cell of emptyCells) {
            let score = 0;

            // Distance to center bonus
            const distToCenter = Math.hypot(cell.r - center, cell.c - center);
            score += Math.max(0, (this.size - distToCenter) * 2);

            // Evaluate line potentials around this cell
            score += this.evaluateCellLines(cell.r, cell.c, 'O', 'X');

            // Add small jitter for organic play
            score += Math.random() * 0.5;

            if (score > bestScore) {
                bestScore = score;
                bestCell = cell;
            }
        }

        return bestCell;
    },

    evaluateCellLines(r, c, ai, human) {
        let totalScore = 0;
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];

        for (const [dr, dc] of directions) {
            // Count consecutive AI and Human marks along this axis
            const aiCount = this.countMarksInDirection(r, c, dr, dc, ai);
            const humanCount = this.countMarksInDirection(r, c, dr, dc, human);

            // Offensive score
            if (aiCount > 0) {
                totalScore += Math.pow(6, aiCount);
            }
            // Defensive score (blocking human streaks)
            if (humanCount > 0) {
                totalScore += Math.pow(5.5, humanCount);
            }
        }

        return totalScore;
    },

    countMarksInDirection(r, c, dr, dc, symbol) {
        let count = 0;
        // Check forward
        let currR = r + dr;
        let currC = c + dc;
        while (currR >= 0 && currR < this.size && currC >= 0 && currC < this.size && this.board[currR][currC] === symbol) {
            count++;
            currR += dr;
            currC += dc;
        }
        // Check backward
        currR = r - dr;
        currC = c - dc;
        while (currR >= 0 && currR < this.size && currC >= 0 && currC < this.size && this.board[currR][currC] === symbol) {
            count++;
            currR -= dr;
            currC -= dc;
        }
        return count;
    },

    getEmptyCells(board) {
        const cells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (board[r][c] === '') {
                    cells.push({ r, c });
                }
            }
        }
        return cells;
    },

    /**
     * Full win-detection algorithm for any N x N board with K-in-a-row condition.
     * Checks horizontal, vertical, and both diagonal directions.
     */
    checkWin(board, N, K) {
        // 1. Horizontal check
        for (let r = 0; r < N; r++) {
            for (let c = 0; c <= N - K; c++) {
                const mark = board[r][c];
                if (mark !== '') {
                    let match = true;
                    const cells = [];
                    for (let i = 0; i < K; i++) {
                        if (board[r][c + i] !== mark) {
                            match = false;
                            break;
                        }
                        cells.push({ r, c: c + i });
                    }
                    if (match) return { winner: mark, cells };
                }
            }
        }

        // 2. Vertical check
        for (let r = 0; r <= N - K; r++) {
            for (let c = 0; c < N; c++) {
                const mark = board[r][c];
                if (mark !== '') {
                    let match = true;
                    const cells = [];
                    for (let i = 0; i < K; i++) {
                        if (board[r + i][c] !== mark) {
                            match = false;
                            break;
                        }
                        cells.push({ r: r + i, c });
                    }
                    if (match) return { winner: mark, cells };
                }
            }
        }

        // 3. Diagonal Down-Right check (\)
        for (let r = 0; r <= N - K; r++) {
            for (let c = 0; c <= N - K; c++) {
                const mark = board[r][c];
                if (mark !== '') {
                    let match = true;
                    const cells = [];
                    for (let i = 0; i < K; i++) {
                        if (board[r + i][c + i] !== mark) {
                            match = false;
                            break;
                        }
                        cells.push({ r: r + i, c: c + i });
                    }
                    if (match) return { winner: mark, cells };
                }
            }
        }

        // 4. Diagonal Down-Left check (/)
        for (let r = 0; r <= N - K; r++) {
            for (let c = K - 1; c < N; c++) {
                const mark = board[r][c];
                if (mark !== '') {
                    let match = true;
                    const cells = [];
                    for (let i = 0; i < K; i++) {
                        if (board[r + i][c - i] !== mark) {
                            match = false;
                            break;
                        }
                        cells.push({ r: r + i, c: c - i });
                    }
                    if (match) return { winner: mark, cells };
                }
            }
        }

        return null;
    },

    handleGameEnd(outcome, winResult = null) {
        this.gameActive = false;
        this.isAiThinking = false;

        const scores = Storage.getTTTScores(this.mode);

        let title = '';
        let message = '';
        let titleClass = '';

        if (outcome === 'win') {
            const winner = winResult.winner;
            this.winningCells = winResult.cells;
            this.highlightWinningCells(winResult.cells);

            if (this.mode === 'pvc') {
                if (winner === 'X') {
                    title = 'YOU WON!';
                    message = `Congratulations! You connected ${this.winLength} in a row against the computer!`;
                    titleClass = 'result-win';
                    scores.wins = (scores.wins || 0) + 1;
                    SoundManager.playWin();
                } else {
                    title = 'YOU LOSE!';
                    message = 'The computer won this match. Don’t give up, try another strategy!';
                    titleClass = 'result-lose';
                    scores.losses = (scores.losses || 0) + 1;
                    SoundManager.playLose();
                }
            } else {
                if (winner === 'X') {
                    title = 'PLAYER 1 WINS!';
                    message = `Congratulations Player 1! You connected ${this.winLength} symbols to take the victory!`;
                    scores.p1Wins = (scores.p1Wins || 0) + 1;
                } else {
                    title = 'PLAYER 2 WINS!';
                    message = `Congratulations Player 2! You connected ${this.winLength} symbols to take the victory!`;
                    scores.p2Wins = (scores.p2Wins || 0) + 1;
                }
                titleClass = 'result-win';
                SoundManager.playWin();
            }
        } else {
            // Draw
            title = "IT'S A DRAW!";
            message = 'All cells are filled with no winning line. An evenly matched contest!';
            titleClass = 'result-draw';
            scores.draws = (scores.draws || 0) + 1;
            SoundManager.playDraw();
        }

        // Save scores & update DOM
        Storage.saveTTTScores(this.mode, scores);
        this.loadScores();

        // Update turn indicator with final match status
        this.elements.turnIndicator.innerHTML = `<span class="match-over-badge">MATCH OVER</span>`;

        // Show result overlay after a short delay so the winning line is seen
        setTimeout(() => {
            this.showResultOverlay(title, message, titleClass);
        }, 650);
    },

    highlightWinningCells(cells) {
        cells.forEach(({ r, c }) => {
            const el = this.elements.boardContainer.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (el) {
                el.classList.add('winning-cell');
            }
        });
    },

    showResultOverlay(title, message, titleClass) {
        this.elements.resultTitle.textContent = title;
        this.elements.resultTitle.className = `result-title ${titleClass}`;
        this.elements.resultMessage.textContent = message;
        this.elements.resultOverlay.classList.remove('hidden');
    },

    hideResultOverlay() {
        this.elements.resultOverlay.classList.add('hidden');
    }
};
