/**
 * MY GAME CENTRE - Core Application Controller
 * Handles SPA navigation, modal dialogs, audio toggle, and game lifecycle management.
 */

const App = {
    currentView: 'home',
    confirmCallback: null,

    // Cached elements
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateSoundButtonUI();

        // Initialize games
        TicTacToe.init();
        SnakeGame.init();
        RPS.init();

        // Handle initial URL hash or default to home
        const initialHash = window.location.hash.replace('#', '');
        if (['tictactoe', 'snake', 'rps'].includes(initialHash)) {
            this.navigateTo(initialHash, false);
        } else {
            this.navigateTo('home', false);
        }
    },

    cacheElements() {
        this.elements = {
            views: {
                home: document.getElementById('view-home'),
                tictactoe: document.getElementById('view-tictactoe'),
                snake: document.getElementById('view-snake'),
                rps: document.getElementById('view-rps')
            },
            navLinks: document.querySelectorAll('.nav-link[data-view]'),
            soundToggleBtn: document.getElementById('sound-toggle-btn'),
            statsBtn: document.getElementById('stats-modal-btn'),
            
            // Confirm Modal
            confirmModal: document.getElementById('modal-confirm'),
            confirmTitle: document.getElementById('confirm-title'),
            confirmMessage: document.getElementById('confirm-message'),
            confirmOkBtn: document.getElementById('confirm-btn-ok'),
            confirmCancelBtn: document.getElementById('confirm-btn-cancel'),

            // Rules Modal
            rulesModal: document.getElementById('modal-rules'),
            rulesTitle: document.getElementById('rules-title'),
            rulesContent: document.getElementById('rules-content'),
            rulesCloseBtn: document.getElementById('rules-close-btn'),

            // Stats Modal
            statsModal: document.getElementById('modal-stats'),
            statsContent: document.getElementById('stats-content'),
            statsCloseBtn: document.getElementById('stats-close-btn'),
            statsResetAllBtn: document.getElementById('stats-reset-all-btn'),

            // Toast
            toast: document.getElementById('toast-notification')
        };
    },

    bindEvents() {
        // Navigation clicks
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                this.navigateTo(view);
            });
        });

        // Homepage Game Card Play buttons
        document.querySelectorAll('.game-card [data-play-game]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const game = btn.dataset.playGame;
                this.navigateTo(game);
            });
        });

        // "Home" button inside all games
        document.querySelectorAll('.btn-home-nav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('home');
            });
        });

        // "How to Play" buttons inside games
        document.querySelectorAll('[data-rules-for]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const gameKey = btn.dataset.rulesFor;
                this.showRulesModal(gameKey);
            });
        });

        // Sound toggle
        this.elements.soundToggleBtn.addEventListener('click', () => {
            const enabled = SoundManager.toggleSound();
            this.updateSoundButtonUI();
            this.showToast(enabled ? 'Sound Effects Enabled' : 'Sound Effects Muted');
        });

        // Stats button
        this.elements.statsBtn.addEventListener('click', () => {
            this.showStatsModal();
        });

        // Confirm modal buttons
        this.elements.confirmOkBtn.addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            this.hideConfirmModal();
        });

        this.elements.confirmCancelBtn.addEventListener('click', () => {
            if (this.cancelCallback) {
                this.cancelCallback();
            }
            this.hideConfirmModal();
            SoundManager.playClick();
        });

        // Close on modal backdrop click
        [this.elements.confirmModal, this.elements.rulesModal, this.elements.statsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal === this.elements.confirmModal && this.cancelCallback) {
                        this.cancelCallback();
                    }
                    modal.classList.add('hidden');
                    SoundManager.playClick();
                }
            });
        });

        // Rules modal close
        this.elements.rulesCloseBtn.addEventListener('click', () => {
            this.elements.rulesModal.classList.add('hidden');
            SoundManager.playClick();
        });

        // Stats modal close
        this.elements.statsCloseBtn.addEventListener('click', () => {
            this.elements.statsModal.classList.add('hidden');
            SoundManager.playClick();
        });

        // Reset all stats
        this.elements.statsResetAllBtn.addEventListener('click', () => {
            this.showConfirmModal(
                'Reset All Website Statistics?',
                'This will erase all recorded wins, losses, draws, and high scores across Tic-Tac-Toe, Snake, and Rock Paper Scissors.',
                () => {
                    Storage.resetAllStats();
                    TicTacToe.loadScores();
                    SnakeGame.loadHighScore();
                    RPS.loadScores();
                    this.renderStatsContent();
                    SoundManager.playClick();
                    this.showToast('All gaming statistics have been reset.');
                }
            );
        });

        // Close modals with Escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.cancelCallback) {
                    this.cancelCallback();
                }
                this.hideConfirmModal();
                this.elements.rulesModal.classList.add('hidden');
                this.elements.statsModal.classList.add('hidden');
            }
        });

        // Handle browser Back / Forward buttons
        window.addEventListener('popstate', (e) => {
            const view = (e.state && e.state.view) || 'home';
            this.navigateTo(view, false);
        });
    },

    navigateTo(viewName, pushHistory = true) {
        if (!this.elements.views[viewName]) {
            viewName = 'home';
        }

        // Leave current game cleanly
        if (this.currentView === 'snake' && viewName !== 'snake') {
            SnakeGame.pauseGame();
        }

        this.currentView = viewName;

        // Toggle active views
        Object.keys(this.elements.views).forEach(key => {
            const viewEl = this.elements.views[key];
            if (key === viewName) {
                viewEl.classList.remove('hidden');
                viewEl.classList.add('active');
            } else {
                viewEl.classList.add('hidden');
                viewEl.classList.remove('active');
            }
        });

        // Update active nav links
        this.elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update history
        if (pushHistory) {
            history.pushState({ view: viewName }, '', viewName === 'home' ? '#' : `#${viewName}`);
        }

        SoundManager.playClick();
    },

    updateSoundButtonUI() {
        const isEnabled = SoundManager.isEnabled();
        this.elements.soundToggleBtn.setAttribute('aria-label', isEnabled ? 'Mute Sound' : 'Enable Sound');
        this.elements.soundToggleBtn.innerHTML = isEnabled 
            ? `<span class="icon">🔊</span><span class="btn-text">Sound: ON</span>`
            : `<span class="icon">🔇</span><span class="btn-text">Sound: OFF</span>`;
        this.elements.soundToggleBtn.classList.toggle('muted', !isEnabled);
    },

    showConfirmModal(title, message, onConfirm, onCancel = null) {
        this.confirmCallback = onConfirm;
        this.cancelCallback = onCancel;
        this.elements.confirmTitle.textContent = title;
        this.elements.confirmMessage.textContent = message;
        this.elements.confirmModal.classList.remove('hidden');
    },

    hideConfirmModal() {
        this.confirmCallback = null;
        this.cancelCallback = null;
        this.elements.confirmModal.classList.add('hidden');
    },

    showRulesModal(gameKey) {
        SoundManager.playClick();
        let title = '';
        let html = '';

        if (gameKey === 'tictactoe') {
            title = 'How to Play: Advanced Tic-Tac-Toe';
            html = `
                <div class="rules-block">
                    <h4>🎯 Objective</h4>
                    <p>Connect consecutive matching symbols in a straight line horizontally, vertically, or diagonally.</p>
                </div>
                <div class="rules-block">
                    <h4>📏 Board Sizes & Winning Conditions</h4>
                    <ul>
                        <li><strong>3×3 Board:</strong> Connect 3 symbols in a row.</li>
                        <li><strong>4×4 Board:</strong> Connect 4 symbols in a row.</li>
                        <li><strong>5×5 Board:</strong> Connect 5 symbols in a row.</li>
                        <li><strong>6×6 to 8×8 Boards:</strong> Connect N symbols in a row (or choose Custom).</li>
                        <li><strong>Custom Board:</strong> Choose dimensions from 3×3 up to 10×10 and adjust your winning condition length!</li>
                    </ul>
                </div>
                <div class="rules-block">
                    <h4>🕹️ Modes</h4>
                    <ul>
                        <li><strong>vs Computer:</strong> Challenge our smart AI engine!</li>
                        <li><strong>Two Players:</strong> Play together on the same screen (Player 1 = X, Player 2 = O).</li>
                    </ul>
                </div>
            `;
        } else if (gameKey === 'snake') {
            title = 'How to Play: Snake';
            html = `
                <div class="rules-block">
                    <h4>🎯 Objective</h4>
                    <p>Control the hungry cyber-snake, eat neon apples, grow longer, and set the highest score without crashing!</p>
                </div>
                <div class="rules-block">
                    <h4>⌨️ Controls</h4>
                    <ul>
                        <li><strong>Keyboard:</strong> Arrow Keys or WASD to change direction.</li>
                        <li><strong>Spacebar:</strong> Pause / Resume or Start match.</li>
                        <li><strong>Touch / Mobile:</strong> On-screen D-Pad buttons or direct swipe gestures across the canvas.</li>
                    </ul>
                </div>
                <div class="rules-block">
                    <h4>🍎 Scoring & Difficulty</h4>
                    <ul>
                        <li><strong>Red Apple:</strong> +10 points & snake grows by 1 segment.</li>
                        <li><strong>Golden Diamond Star:</strong> Spawns every 5 food items! Worth +30 points before it expires.</li>
                        <li><strong>Speed:</strong> Game speed gradually increases as your score climbs!</li>
                        <li><strong>Game Over:</strong> Colliding with the canvas walls or your own body ends the round.</li>
                    </ul>
                </div>
            `;
        } else if (gameKey === 'rps') {
            title = 'How to Play: Rock Paper Scissors';
            html = `
                <div class="rules-block">
                    <h4>🎯 Rules of Engagement</h4>
                    <ul>
                        <li>✊ <strong>Rock</strong> crushes ✌️ <strong>Scissors</strong></li>
                        <li>✌️ <strong>Scissors</strong> cuts ✋ <strong>Paper</strong></li>
                        <li>✋ <strong>Paper</strong> covers ✊ <strong>Rock</strong></li>
                        <li>Identical weapons result in a Draw!</li>
                    </ul>
                </div>
                <div class="rules-block">
                    <h4>👥 Two-Player Pass & Play Flow</h4>
                    <ol>
                        <li>Player 1 chooses Rock, Paper, or Scissors in secret.</li>
                        <li>Player 1's choice is instantly concealed behind the <strong>Pass the Device</strong> screen.</li>
                        <li>Hand the device to Player 2 and tap Continue.</li>
                        <li>Player 2 locks in their choice.</li>
                        <li>Both selections are revealed simultaneously with the round outcome!</li>
                    </ol>
                </div>
            `;
        }

        this.elements.rulesTitle.textContent = title;
        this.elements.rulesContent.innerHTML = html;
        this.elements.rulesModal.classList.remove('hidden');
    },

    showStatsModal() {
        SoundManager.playClick();
        this.renderStatsContent();
        this.elements.statsModal.classList.remove('hidden');
    },

    renderStatsContent() {
        const tttPvc = Storage.getTTTScores('pvc');
        const tttPvp = Storage.getTTTScores('pvp');
        const snakeHigh = Storage.getSnakeHighScore();
        const snakeGames = Storage.getSnakeTotalGames();
        const rpsPvc = Storage.getRPSScores('pvc');
        const rpsPvp = Storage.getRPSScores('pvp');

        this.elements.statsContent.innerHTML = `
            <div class="stats-card">
                <h3>🎮 Tic-Tac-Toe</h3>
                <div class="stats-row">
                    <span>vs Computer:</span>
                    <strong>${tttPvc.wins} Wins | ${tttPvc.losses} Losses | ${tttPvc.draws} Draws</strong>
                </div>
                <div class="stats-row">
                    <span>Two Players:</span>
                    <strong>P1: ${tttPvp.p1Wins} | P2: ${tttPvp.p2Wins} | Draws: ${tttPvp.draws}</strong>
                </div>
            </div>

            <div class="stats-card">
                <h3>🐍 Snake Arcade</h3>
                <div class="stats-row">
                    <span>All-Time High Score:</span>
                    <strong class="highlight-cyan">${snakeHigh} pts</strong>
                </div>
                <div class="stats-row">
                    <span>Games Played:</span>
                    <strong>${snakeGames}</strong>
                </div>
            </div>

            <div class="stats-card">
                <h3>✂️ Rock Paper Scissors</h3>
                <div class="stats-row">
                    <span>vs Computer:</span>
                    <strong>${rpsPvc.wins} Wins | ${rpsPvc.losses} Losses | ${rpsPvc.draws} Draws</strong>
                </div>
                <div class="stats-row">
                    <span>Two Players:</span>
                    <strong>P1: ${rpsPvp.p1Wins} | P2: ${rpsPvp.p2Wins} | Draws: ${rpsPvp.draws}</strong>
                </div>
            </div>
        `;
    },

    showToast(message) {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2200);
    }
};

// Expose to window for global access
window.Storage = Storage;
window.SoundManager = SoundManager;
window.TicTacToe = TicTacToe;
window.SnakeGame = SnakeGame;
window.RPS = RPS;
window.App = App;

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
