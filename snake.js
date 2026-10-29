/**
 * MY GAME CENTRE - Snake Game
 * HTML5 Canvas arcade snake with WASD / Arrow keys, touch D-pad & swipe support,
 * gradual difficulty scaling, pause/resume, high score persistence, and neon visuals.
 */

const SnakeGame = {
    // Canvas & Grid settings
    canvas: null,
    ctx: null,
    gridSize: 20, // 20x20 tiles
    tileCount: 20,
    tileSize: 20,

    // Game state
    snake: [],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    inputQueue: [],
    food: { x: 5, y: 5 },
    goldenFood: null,
    goldenFoodTimer: 0,
    score: 0,
    highScore: 0,
    foodEatenCount: 0,

    // Loop & timing
    gameLoopId: null,
    isRunning: false,
    isPaused: false,
    baseSpeed: 150, // ms per tick
    currentSpeed: 150,
    minSpeed: 65,

    // DOM Elements
    elements: {},

    init() {
        this.cacheElements();
        this.setupCanvas();
        this.bindEvents();
        this.loadHighScore();
        this.resetGame(false);
    },

    cacheElements() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.elements = {
            currentScore: document.getElementById('snake-current-score'),
            highScore: document.getElementById('snake-high-score'),
            startBtn: document.getElementById('snake-start-btn'),
            pauseBtn: document.getElementById('snake-pause-btn'),
            resumeBtn: document.getElementById('snake-resume-btn'),
            restartBtn: document.getElementById('snake-restart-btn'),
            resetScoresBtn: document.getElementById('snake-reset-scores-btn'),
            
            // Overlays
            startOverlay: document.getElementById('snake-start-overlay'),
            pauseOverlay: document.getElementById('snake-pause-overlay'),
            gameOverOverlay: document.getElementById('snake-game-over-overlay'),
            gameOverTitle: document.getElementById('snake-game-over-title'),
            finalScoreEl: document.getElementById('snake-final-score'),
            highScoreBanner: document.getElementById('snake-new-highscore-badge'),
            playAgainBtn: document.getElementById('snake-play-again-btn'),
            overlayStartBtn: document.getElementById('snake-overlay-start-btn'),
            overlayResumeBtn: document.getElementById('snake-overlay-resume-btn'),

            // D-Pad buttons
            dpadUp: document.getElementById('snake-btn-up'),
            dpadDown: document.getElementById('snake-btn-down'),
            dpadLeft: document.getElementById('snake-btn-left'),
            dpadRight: document.getElementById('snake-btn-right')
        };
    },

    setupCanvas() {
        // Set canvas resolution for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.min(460, window.innerWidth - 40);
        
        this.canvas.width = 440 * dpr;
        this.canvas.height = 440 * dpr;
        this.canvas.style.width = `${Math.min(440, displayWidth)}px`;
        this.canvas.style.height = `${Math.min(440, displayWidth)}px`;

        this.ctx.scale(dpr, dpr);
        this.tileSize = 440 / this.gridSize;
    },

    bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Start / Pause / Resume / Restart buttons
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.elements.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        if (this.elements.overlayStartBtn) {
            this.elements.overlayStartBtn.addEventListener('click', () => this.startGame());
        }
        if (this.elements.overlayResumeBtn) {
            this.elements.overlayResumeBtn.addEventListener('click', () => this.resumeGame());
        }
        this.elements.playAgainBtn.addEventListener('click', () => {
            this.elements.gameOverOverlay.classList.add('hidden');
            this.startGame();
        });

        // Reset high score button
        this.elements.resetScoresBtn.addEventListener('click', () => this.confirmResetScore());

        // D-Pad Touch / Click buttons
        this.setupDPadButton(this.elements.dpadUp, { x: 0, y: -1 });
        this.setupDPadButton(this.elements.dpadDown, { x: 0, y: 1 });
        this.setupDPadButton(this.elements.dpadLeft, { x: -1, y: 0 });
        this.setupDPadButton(this.elements.dpadRight, { x: 1, y: 0 });

        // Touch Swipe on Canvas
        this.setupTouchGestures();

        // Responsive resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
        });
    },

    setupDPadButton(btn, dir) {
        if (!btn) return;
        const trigger = (e) => {
            e.preventDefault();
            this.queueDirection(dir);
        };
        btn.addEventListener('touchstart', trigger, { passive: false });
        btn.addEventListener('click', trigger);
    },

    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                const diffX = e.changedTouches[0].clientX - touchStartX;
                const diffY = e.changedTouches[0].clientY - touchStartY;
                const minSwipe = 25;

                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (Math.abs(diffX) > minSwipe) {
                        this.queueDirection(diffX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
                    }
                } else {
                    if (Math.abs(diffY) > minSwipe) {
                        this.queueDirection(diffY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
                    }
                }
            }
        }, { passive: true });
    },

    loadHighScore() {
        this.highScore = Storage.getSnakeHighScore();
        this.elements.highScore.textContent = this.highScore;
    },

    confirmResetScore() {
        App.showConfirmModal(
            'Reset Snake High Score?',
            'Are you sure you want to reset your Snake high score back to 0?',
            () => {
                Storage.resetSnakeScores();
                this.loadHighScore();
                SoundManager.playClick();
                App.showToast('Snake high score reset to zero.');
            }
        );
    },

    handleKeyDown(e) {
        // Only handle keys if Snake view is visible
        const snakeView = document.getElementById('view-snake');
        if (!snakeView || !snakeView.classList.contains('active')) return;

        // Spacebar toggles pause/resume
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.isRunning) {
                if (this.isPaused) this.resumeGame();
                else this.pauseGame();
            } else if (!this.elements.gameOverOverlay.classList.contains('hidden')) {
                this.elements.gameOverOverlay.classList.add('hidden');
                this.startGame();
            } else {
                this.startGame();
            }
            return;
        }

        let newDir = null;
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                newDir = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 'KeyS':
                newDir = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'KeyA':
                newDir = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'KeyD':
                newDir = { x: 1, y: 0 };
                break;
        }

        if (newDir) {
            e.preventDefault();
            this.queueDirection(newDir);
        }
    },

    queueDirection(dir) {
        if (!this.isRunning || this.isPaused) return;

        // Get last planned direction (either from queue or current)
        const lastDir = this.inputQueue.length > 0 
            ? this.inputQueue[this.inputQueue.length - 1] 
            : this.direction;

        // Prevent immediate 180-degree reversal
        if (dir.x !== -lastDir.x || dir.y !== -lastDir.y) {
            // Avoid duplicate queued direction
            if (dir.x !== lastDir.x || dir.y !== lastDir.y) {
                // Buffer at most 2 inputs to prevent queue lag
                if (this.inputQueue.length < 2) {
                    this.inputQueue.push(dir);
                }
            }
        }
    },

    startGame() {
        this.resetGame(false);
        this.isRunning = true;
        this.isPaused = false;

        this.elements.startOverlay.classList.add('hidden');
        this.elements.pauseOverlay.classList.add('hidden');
        this.elements.gameOverOverlay.classList.add('hidden');

        this.elements.startBtn.classList.add('hidden');
        this.elements.pauseBtn.classList.remove('hidden');
        this.elements.resumeBtn.classList.add('hidden');

        SoundManager.playClick();
        this.runLoop();
    },

    pauseGame() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        clearTimeout(this.gameLoopId);

        this.elements.pauseOverlay.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.resumeBtn.classList.remove('hidden');
        SoundManager.playClick();
    },

    resumeGame() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;

        this.elements.pauseOverlay.classList.add('hidden');
        this.elements.pauseBtn.classList.remove('hidden');
        this.elements.resumeBtn.classList.add('hidden');
        SoundManager.playClick();

        this.runLoop();
    },

    restartGame() {
        clearTimeout(this.gameLoopId);
        this.startGame();
    },

    resetGame(playSound = true) {
        clearTimeout(this.gameLoopId);
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.foodEatenCount = 0;
        this.currentSpeed = this.baseSpeed;
        this.inputQueue = [];

        // Starting snake in center: 3 tiles moving right
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        this.goldenFood = null;
        this.goldenFoodTimer = 0;
        this.spawnFood();

        this.elements.currentScore.textContent = '0';
        this.loadHighScore();

        this.elements.startBtn.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.resumeBtn.classList.add('hidden');

        this.draw();

        if (playSound) {
            SoundManager.playClick();
        }
    },

    spawnFood() {
        let valid = false;
        let candidate = null;

        while (!valid) {
            candidate = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            valid = !this.snake.some(seg => seg.x === candidate.x && seg.y === candidate.y);
            if (this.goldenFood && candidate.x === this.goldenFood.x && candidate.y === this.goldenFood.y) {
                valid = false;
            }
        }
        this.food = candidate;
    },

    spawnGoldenFood() {
        let valid = false;
        let candidate = null;

        while (!valid) {
            candidate = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            valid = !this.snake.some(seg => seg.x === candidate.x && seg.y === candidate.y) &&
                    (candidate.x !== this.food.x || candidate.y !== this.food.y);
        }
        this.goldenFood = candidate;
        this.goldenFoodTimer = 45; // 45 ticks before expiring
    },

    runLoop() {
        if (!this.isRunning || this.isPaused) return;

        this.update();
        this.draw();

        if (this.isRunning) {
            this.gameLoopId = setTimeout(() => this.runLoop(), this.currentSpeed);
        }
    },

    update() {
        // Consume next buffered direction if available
        if (this.inputQueue.length > 0) {
            this.direction = this.inputQueue.shift();
        }

        // Calculate new head position
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // 1. Check Wall Collisions
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.handleCrash();
            return;
        }

        // 2. Check Self Collisions
        if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.handleCrash();
            return;
        }

        // Move head forward
        this.snake.unshift(head);

        // Check if ate normal food
        let ateFood = false;
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.foodEatenCount++;
            ateFood = true;
            SoundManager.playEat(false);
            this.spawnFood();

            // Check if golden food should spawn (every 5 normal foods)
            if (this.foodEatenCount % 5 === 0 && !this.goldenFood) {
                this.spawnGoldenFood();
            }

            // Increase speed gradually
            this.currentSpeed = Math.max(this.minSpeed, this.baseSpeed - Math.floor(this.foodEatenCount * 3));
        }

        // Check if ate golden food
        if (this.goldenFood && head.x === this.goldenFood.x && head.y === this.goldenFood.y) {
            this.score += 30;
            ateFood = true;
            SoundManager.playEat(true);
            this.goldenFood = null;
        }

        // Countdown golden food
        if (this.goldenFood) {
            this.goldenFoodTimer--;
            if (this.goldenFoodTimer <= 0) {
                this.goldenFood = null;
            }
        }

        // If no food eaten, remove tail
        if (!ateFood) {
            this.snake.pop();
        }

        // Update score display
        this.elements.currentScore.textContent = this.score;

        // Realtime highscore display update
        if (this.score > this.highScore) {
            this.elements.highScore.textContent = this.score;
        }
    },

    handleCrash() {
        this.isRunning = false;
        clearTimeout(this.gameLoopId);
        SoundManager.playCrash();

        // Increment total games
        Storage.incrementSnakeGames();

        // High score check
        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
            this.highScore = this.score;
            Storage.saveSnakeHighScore(this.highScore);
            this.elements.highScore.textContent = this.highScore;
            setTimeout(() => SoundManager.playHighScore(), 300);
        }

        // Show Game Over overlay
        this.elements.finalScoreEl.textContent = this.score;
        this.elements.gameOverTitle.textContent = 'GAME OVER!';

        if (isNewRecord && this.score > 0) {
            this.elements.highScoreBanner.classList.remove('hidden');
        } else {
            this.elements.highScoreBanner.classList.add('hidden');
        }

        this.elements.gameOverOverlay.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.resumeBtn.classList.add('hidden');
        this.elements.startBtn.classList.remove('hidden');
    },

    draw() {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const totalSize = 440;

        // Clear canvas with deep neon background
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, totalSize, totalSize);

        // Draw subtle grid lines
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * ts, 0);
            ctx.lineTo(i * ts, totalSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * ts);
            ctx.lineTo(totalSize, i * ts);
            ctx.stroke();
        }

        // Draw Normal Food (Neon Red/Pink Apple with glow)
        if (this.food) {
            const fx = this.food.x * ts + ts / 2;
            const fy = this.food.y * ts + ts / 2;
            const r = ts / 2 - 3;

            ctx.save();
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.arc(fx, fy, r, 0, Math.PI * 2);
            ctx.fill();

            // Little highlight reflection
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(fx - r / 3, fy - r / 3, r / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw Golden Bonus Food if active (Glowing Star/Diamond)
        if (this.goldenFood) {
            const gx = this.goldenFood.x * ts + ts / 2;
            const gy = this.goldenFood.y * ts + ts / 2;
            const gr = ts / 2 - 2;

            ctx.save();
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 16;
            ctx.fillStyle = '#ffd700';

            // Pulsing diamond
            const pulse = Math.sin(Date.now() / 150) * 2;
            ctx.beginPath();
            ctx.moveTo(gx, gy - gr - pulse);
            ctx.lineTo(gx + gr + pulse, gy);
            ctx.lineTo(gx, gy + gr + pulse);
            ctx.lineTo(gx - gr - pulse, gy);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Draw Snake Body & Head
        this.snake.forEach((seg, index) => {
            const x = seg.x * ts;
            const y = seg.y * ts;
            const pad = 1.5;

            ctx.save();
            if (index === 0) {
                // Snake Head: bright cyan with glow
                ctx.shadowColor = '#00f5ff';
                ctx.shadowBlur = 14;
                ctx.fillStyle = '#00f5ff';

                // Rounded head
                this.drawRoundedRect(ctx, x + pad, y + pad, ts - pad * 2, ts - pad * 2, 6);
                ctx.fill();

                // Eyes on head
                ctx.fillStyle = '#080d1a';
                const eyeOffset = ts / 4;
                const eyeSize = 3;
                let eye1 = { x: x + eyeOffset, y: y + eyeOffset };
                let eye2 = { x: x + ts - eyeOffset, y: y + eyeOffset };

                if (this.direction.x === 1) { // Moving right
                    eye1 = { x: x + ts - 5, y: y + 5 };
                    eye2 = { x: x + ts - 5, y: y + ts - 5 };
                } else if (this.direction.x === -1) { // Moving left
                    eye1 = { x: x + 5, y: y + 5 };
                    eye2 = { x: x + 5, y: y + ts - 5 };
                } else if (this.direction.y === 1) { // Moving down
                    eye1 = { x: x + 5, y: y + ts - 5 };
                    eye2 = { x: x + ts - 5, y: y + ts - 5 };
                } else if (this.direction.y === -1) { // Moving up
                    eye1 = { x: x + 5, y: y + 5 };
                    eye2 = { x: x + ts - 5, y: y + 5 };
                }

                ctx.beginPath();
                ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
                ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Snake Body: cyan to emerald gradient with slight glow
                const alpha = Math.max(0.4, 1 - (index / (this.snake.length + 5)));
                ctx.shadowColor = 'rgba(0, 245, 255, 0.4)';
                ctx.shadowBlur = 6;
                ctx.fillStyle = index % 2 === 0 ? `rgba(0, 245, 255, ${alpha})` : `rgba(5, 255, 161, ${alpha})`;
                this.drawRoundedRect(ctx, x + pad, y + pad, ts - pad * 2, ts - pad * 2, 4);
                ctx.fill();
            }
            ctx.restore();
        });
    },

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
};
