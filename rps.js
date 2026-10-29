/**
 * MY GAME CENTRE - Rock Paper Scissors
 * Features Single Player (vs Computer) and Two Players on Same Device with
 * secret selection handover screen, clear round explanations, and persistent scores.
 */

const RPS = {
    // Mode: 'pvc' (Single Player vs Computer) or 'pvp' (Two Players on Same Device)
    mode: 'pvc',

    // Game state
    p1Choice: null,
    p2Choice: null,
    computerChoice: null,
    isProcessing: false,
    currentStep: 'p1_turn', // 'p1_turn', 'handover', 'p2_turn', 'round_result'

    // Choices metadata
    choices: {
        rock: { name: 'Rock', icon: '✊', beats: 'scissors', verb: 'crushes' },
        paper: { name: 'Paper', icon: '✋', beats: 'rock', verb: 'covers' },
        scissors: { name: 'Scissors', icon: '✌️', beats: 'paper', verb: 'cuts' }
    },

    // Cached elements
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadScores();
        this.resetRound(false);
    },

    cacheElements() {
        this.elements = {
            view: document.getElementById('view-rps'),
            modePvcBtn: document.getElementById('rps-mode-pvc'),
            modePvpBtn: document.getElementById('rps-mode-pvp'),
            
            // Scoreboard elements
            label1: document.getElementById('rps-score-label-1'),
            label2: document.getElementById('rps-score-label-2'),
            val1: document.getElementById('rps-score-val-1'),
            val2: document.getElementById('rps-score-val-2'),
            valDraws: document.getElementById('rps-score-val-draws'),
            resetScoresBtn: document.getElementById('rps-reset-scores-btn'),

            // Turn instructions banner
            turnBanner: document.getElementById('rps-turn-banner'),

            // Choice picking section
            choicesContainer: document.getElementById('rps-choices-container'),
            rockBtn: document.getElementById('rps-choice-rock'),
            paperBtn: document.getElementById('rps-choice-paper'),
            scissorsBtn: document.getElementById('rps-choice-scissors'),

            // Handover screen (PvP)
            handoverContainer: document.getElementById('rps-handover-container'),
            handoverContinueBtn: document.getElementById('rps-handover-continue'),

            // Battle arena / Result section
            battleArena: document.getElementById('rps-battle-arena'),
            arenaP1Badge: document.getElementById('rps-arena-p1-badge'),
            arenaP2Badge: document.getElementById('rps-arena-p2-badge'),
            arenaP1Icon: document.getElementById('rps-arena-p1-icon'),
            arenaP2Icon: document.getElementById('rps-arena-p2-icon'),
            arenaP1Label: document.getElementById('rps-arena-p1-label'),
            arenaP2Label: document.getElementById('rps-arena-p2-label'),
            
            // Result overlay / box
            resultBox: document.getElementById('rps-result-box'),
            resultTitle: document.getElementById('rps-result-title'),
            resultDesc: document.getElementById('rps-result-desc'),
            playAgainBtn: document.getElementById('rps-play-again-btn')
        };
    },

    bindEvents() {
        // Mode switches
        this.elements.modePvcBtn.addEventListener('click', () => this.handleModeChange('pvc'));
        this.elements.modePvpBtn.addEventListener('click', () => this.handleModeChange('pvp'));

        // Choice buttons
        this.elements.rockBtn.addEventListener('click', () => this.handlePlayerSelect('rock'));
        this.elements.paperBtn.addEventListener('click', () => this.handlePlayerSelect('paper'));
        this.elements.scissorsBtn.addEventListener('click', () => this.handlePlayerSelect('scissors'));

        // Handover continue button (PvP)
        this.elements.handoverContinueBtn.addEventListener('click', () => this.continueToPlayer2());

        // Play Again button
        this.elements.playAgainBtn.addEventListener('click', () => this.resetRound(true));

        // Reset Scores button
        this.elements.resetScoresBtn.addEventListener('click', () => this.confirmResetScores());
    },

    loadScores() {
        const scores = Storage.getRPSScores(this.mode);
        if (this.mode === 'pvc') {
            this.elements.label1.textContent = 'YOU';
            this.elements.label2.textContent = 'COMPUTER';
            this.elements.val1.textContent = scores.wins || 0;
            this.elements.val2.textContent = scores.losses || 0;
            this.elements.valDraws.textContent = scores.draws || 0;
        } else {
            this.elements.label1.textContent = 'PLAYER 1';
            this.elements.label2.textContent = 'PLAYER 2';
            this.elements.val1.textContent = scores.p1Wins || 0;
            this.elements.val2.textContent = scores.p2Wins || 0;
            this.elements.valDraws.textContent = scores.draws || 0;
        }
    },

    confirmResetScores() {
        const modeName = this.mode === 'pvc' ? 'Player vs Computer' : 'Two Players';
        App.showConfirmModal(
            'Reset RPS Scores?',
            `Are you sure you want to reset all Rock Paper Scissors scores for ${modeName}?`,
            () => {
                Storage.resetRPSScores(this.mode);
                this.loadScores();
                SoundManager.playClick();
                App.showToast('Rock Paper Scissors scores reset to zero.');
            }
        );
    },

    handleModeChange(newMode) {
        if (newMode === this.mode) return;

        this.mode = newMode;
        this.elements.modePvcBtn.classList.toggle('active', newMode === 'pvc');
        this.elements.modePvpBtn.classList.toggle('active', newMode === 'pvp');
        
        this.loadScores();
        this.resetRound(false);
        SoundManager.playClick();
    },

    resetRound(playSound = true) {
        this.p1Choice = null;
        this.p2Choice = null;
        this.computerChoice = null;
        this.isProcessing = false;
        this.currentStep = 'p1_turn';

        // Reset UI sections
        this.elements.handoverContainer.classList.add('hidden');
        this.elements.battleArena.classList.add('hidden');
        this.elements.resultBox.classList.add('hidden');
        this.elements.choicesContainer.classList.remove('hidden');

        // Reset turn banner
        if (this.mode === 'pvc') {
            this.elements.turnBanner.innerHTML = 
                `<span>Choose your weapon to challenge the Computer</span>`;
        } else {
            this.elements.turnBanner.innerHTML = 
                `<span class="badge player-x">Player 1</span> Make your secret choice`;
        }

        if (playSound) {
            SoundManager.playClick();
        }
    },

    handlePlayerSelect(choice) {
        if (this.isProcessing) return;

        SoundManager.playClick();

        if (this.mode === 'pvc') {
            // Mode A: vs Computer
            this.p1Choice = choice;
            this.runComputerRound();
        } else {
            // Mode B: Two Players on Same Device
            if (this.currentStep === 'p1_turn') {
                // Step 1: Player 1 made choice.
                this.p1Choice = choice;
                // Step 2 & 3: Immediately hide selection and show handover screen!
                this.showHandoverScreen();
            } else if (this.currentStep === 'p2_turn') {
                // Step 5: Player 2 made choice.
                this.p2Choice = choice;
                // Step 6 & 7: Reveal both choices and calculate outcome.
                this.runPvpBattle();
            }
        }
    },

    /**
     * Mode A: Single Player vs Computer battle
     */
    runComputerRound() {
        this.isProcessing = true;
        this.elements.choicesContainer.classList.add('hidden');
        this.elements.battleArena.classList.remove('hidden');

        // Setup arena badges
        this.elements.arenaP1Badge.textContent = 'YOU';
        this.elements.arenaP2Badge.textContent = 'COMPUTER';

        // Animated countdown / shaking hands
        this.elements.arenaP1Icon.textContent = '✊';
        this.elements.arenaP2Icon.textContent = '✊';
        this.elements.arenaP1Icon.className = 'rps-arena-icon shake-left';
        this.elements.arenaP2Icon.className = 'rps-arena-icon shake-right';
        this.elements.arenaP1Label.textContent = 'Thinking...';
        this.elements.arenaP2Label.textContent = 'Thinking...';
        this.elements.turnBanner.innerHTML = '<span>Battling...</span>';

        // Choose computer weapon
        const choiceKeys = ['rock', 'paper', 'scissors'];
        this.computerChoice = choiceKeys[Math.floor(Math.random() * choiceKeys.length)];

        // Reveal choices after 700ms animation
        setTimeout(() => {
            this.elements.arenaP1Icon.className = 'rps-arena-icon pop-in';
            this.elements.arenaP2Icon.className = 'rps-arena-icon pop-in';
            
            this.elements.arenaP1Icon.textContent = this.choices[this.p1Choice].icon;
            this.elements.arenaP2Icon.textContent = this.choices[this.computerChoice].icon;
            this.elements.arenaP1Label.textContent = this.choices[this.p1Choice].name;
            this.elements.arenaP2Label.textContent = this.choices[this.computerChoice].name;

            this.resolveOutcome(this.p1Choice, this.computerChoice, false);
            this.isProcessing = false;
        }, 750);
    },

    /**
     * Mode B: Step 3 & 4 - Handover Screen
     */
    showHandoverScreen() {
        this.currentStep = 'handover';
        // Ensure no choices are shown
        this.elements.choicesContainer.classList.add('hidden');
        this.elements.battleArena.classList.add('hidden');
        this.elements.resultBox.classList.add('hidden');

        // Show prominent handover screen
        this.elements.handoverContainer.classList.remove('hidden');
        this.elements.turnBanner.innerHTML = '<span>Device Handover In Progress</span>';
    },

    /**
     * Mode B: Step 5 - Handover continue clicked
     */
    continueToPlayer2() {
        this.currentStep = 'p2_turn';
        SoundManager.playClick();

        this.elements.handoverContainer.classList.add('hidden');
        this.elements.choicesContainer.classList.remove('hidden');

        this.elements.turnBanner.innerHTML = 
            `<span class="badge player-o">Player 2</span> Make your choice`;
    },

    /**
     * Mode B: Step 6 & 7 - PvP Battle resolution
     */
    runPvpBattle() {
        this.isProcessing = true;
        this.elements.choicesContainer.classList.add('hidden');
        this.elements.battleArena.classList.remove('hidden');

        // Setup arena badges
        this.elements.arenaP1Badge.textContent = 'PLAYER 1';
        this.elements.arenaP2Badge.textContent = 'PLAYER 2';

        // Animated countdown / shaking hands
        this.elements.arenaP1Icon.textContent = '✊';
        this.elements.arenaP2Icon.textContent = '✊';
        this.elements.arenaP1Icon.className = 'rps-arena-icon shake-left';
        this.elements.arenaP2Icon.className = 'rps-arena-icon shake-right';
        this.elements.arenaP1Label.textContent = 'Revealing...';
        this.elements.arenaP2Label.textContent = 'Revealing...';
        this.elements.turnBanner.innerHTML = '<span>Revealing selections...</span>';

        setTimeout(() => {
            this.elements.arenaP1Icon.className = 'rps-arena-icon pop-in';
            this.elements.arenaP2Icon.className = 'rps-arena-icon pop-in';
            
            this.elements.arenaP1Icon.textContent = this.choices[this.p1Choice].icon;
            this.elements.arenaP2Icon.textContent = this.choices[this.p2Choice].icon;
            this.elements.arenaP1Label.textContent = this.choices[this.p1Choice].name;
            this.elements.arenaP2Label.textContent = this.choices[this.p2Choice].name;

            this.resolveOutcome(this.p1Choice, this.p2Choice, true);
            this.isProcessing = false;
        }, 750);
    },

    /**
     * Resolves round winner according to standard rules:
     * Rock beats Scissors, Scissors beats Paper, Paper beats Rock.
     */
    resolveOutcome(choice1, choice2, isPvp) {
        const scores = Storage.getRPSScores(this.mode);
        const c1Meta = this.choices[choice1];
        const c2Meta = this.choices[choice2];

        let title = '';
        let desc = '';
        let titleClass = '';

        if (choice1 === choice2) {
            // Draw
            title = "IT'S A DRAW!";
            desc = `Both selected ${c1Meta.name}. It's an even match!`;
            titleClass = 'result-draw';
            scores.draws = (scores.draws || 0) + 1;
            SoundManager.playDraw();
        } else if (c1Meta.beats === choice2) {
            // Player 1 wins
            if (!isPvp) {
                title = 'YOU WON!';
                desc = `${c1Meta.name} ${c1Meta.verb} ${c2Meta.name}! You defeated the computer!`;
                scores.wins = (scores.wins || 0) + 1;
            } else {
                title = 'PLAYER 1 WINS!';
                desc = `Player 1's ${c1Meta.name} ${c1Meta.verb} Player 2's ${c2Meta.name}!`;
                scores.p1Wins = (scores.p1Wins || 0) + 1;
            }
            titleClass = 'result-win';
            SoundManager.playWin();
        } else {
            // Player 2 / Computer wins
            if (!isPvp) {
                title = 'YOU LOSE!';
                desc = `${c2Meta.name} ${c2Meta.verb} ${c1Meta.name}! The computer claims this round!`;
                scores.losses = (scores.losses || 0) + 1;
                SoundManager.playLose();
            } else {
                title = 'PLAYER 2 WINS!';
                desc = `Player 2's ${c2Meta.name} ${c2Meta.verb} Player 1's ${c1Meta.name}!`;
                scores.p2Wins = (scores.p2Wins || 0) + 1;
                SoundManager.playWin();
            }
            titleClass = !isPvp ? 'result-lose' : 'result-win';
        }

        // Save scores & update DOM
        Storage.saveRPSScores(this.mode, scores);
        this.loadScores();

        // Show result box
        this.elements.resultTitle.textContent = title;
        this.elements.resultTitle.className = `rps-result-title ${titleClass}`;
        this.elements.resultDesc.textContent = desc;
        this.elements.resultBox.classList.remove('hidden');

        this.elements.turnBanner.innerHTML = `<span class="match-over-badge">ROUND COMPLETE</span>`;
    }
};
