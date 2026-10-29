/**
 * MY GAME CENTRE - Local Storage & State Management
 * Handles persistent storage for scores, high scores, and user preferences.
 */

const STORAGE_KEYS = {
    TTT_PVC: 'mgc_ttt_pvc_scores',
    TTT_PVP: 'mgc_ttt_pvp_scores',
    SNAKE_HIGHSCORE: 'mgc_snake_highscore',
    SNAKE_TOTAL_GAMES: 'mgc_snake_total_games',
    RPS_PVC: 'mgc_rps_pvc_scores',
    RPS_PVP: 'mgc_rps_pvp_scores',
    SOUND_ENABLED: 'mgc_sound_enabled'
};

// Memory fallback in case localStorage is restricted or throws an error
const memoryStore = {};

const Storage = {
    isAvailable() {
        try {
            const testKey = '__mgc_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    get(key, defaultValue = null) {
        if (this.isAvailable()) {
            try {
                const item = localStorage.getItem(key);
                return item !== null ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn(`Storage get error for ${key}:`, e);
                return defaultValue;
            }
        }
        return memoryStore.hasOwnProperty(key) ? memoryStore[key] : defaultValue;
    },

    set(key, value) {
        if (this.isAvailable()) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn(`Storage set error for ${key}:`, e);
            }
        }
        memoryStore[key] = value;
        return true;
    },

    remove(key) {
        if (this.isAvailable()) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn(`Storage remove error for ${key}:`, e);
            }
        }
        delete memoryStore[key];
    },

    // Tic-Tac-Toe Scores
    getTTTScores(mode = 'pvc') {
        const key = mode === 'pvp' ? STORAGE_KEYS.TTT_PVP : STORAGE_KEYS.TTT_PVC;
        if (mode === 'pvp') {
            return this.get(key, { p1Wins: 0, p2Wins: 0, draws: 0 });
        }
        return this.get(key, { wins: 0, losses: 0, draws: 0 });
    },

    saveTTTScores(mode, scores) {
        const key = mode === 'pvp' ? STORAGE_KEYS.TTT_PVP : STORAGE_KEYS.TTT_PVC;
        this.set(key, scores);
    },

    resetTTTScores(mode) {
        if (mode === 'pvp') {
            const initial = { p1Wins: 0, p2Wins: 0, draws: 0 };
            this.set(STORAGE_KEYS.TTT_PVP, initial);
            return initial;
        } else {
            const initial = { wins: 0, losses: 0, draws: 0 };
            this.set(STORAGE_KEYS.TTT_PVC, initial);
            return initial;
        }
    },

    // Snake High Score
    getSnakeHighScore() {
        return this.get(STORAGE_KEYS.SNAKE_HIGHSCORE, 0);
    },

    saveSnakeHighScore(score) {
        this.set(STORAGE_KEYS.SNAKE_HIGHSCORE, score);
    },

    getSnakeTotalGames() {
        return this.get(STORAGE_KEYS.SNAKE_TOTAL_GAMES, 0);
    },

    incrementSnakeGames() {
        const games = this.getSnakeTotalGames() + 1;
        this.set(STORAGE_KEYS.SNAKE_TOTAL_GAMES, games);
        return games;
    },

    resetSnakeScores() {
        this.set(STORAGE_KEYS.SNAKE_HIGHSCORE, 0);
        this.set(STORAGE_KEYS.SNAKE_TOTAL_GAMES, 0);
    },

    // Rock Paper Scissors Scores
    getRPSScores(mode = 'pvc') {
        const key = mode === 'pvp' ? STORAGE_KEYS.RPS_PVP : STORAGE_KEYS.RPS_PVC;
        if (mode === 'pvp') {
            return this.get(key, { p1Wins: 0, p2Wins: 0, draws: 0 });
        }
        return this.get(key, { wins: 0, losses: 0, draws: 0 });
    },

    saveRPSScores(mode, scores) {
        const key = mode === 'pvp' ? STORAGE_KEYS.RPS_PVP : STORAGE_KEYS.RPS_PVC;
        this.set(key, scores);
    },

    resetRPSScores(mode) {
        if (mode === 'pvp') {
            const initial = { p1Wins: 0, p2Wins: 0, draws: 0 };
            this.set(STORAGE_KEYS.RPS_PVP, initial);
            return initial;
        } else {
            const initial = { wins: 0, losses: 0, draws: 0 };
            this.set(STORAGE_KEYS.RPS_PVC, initial);
            return initial;
        }
    },

    // Sound Setting
    getSoundEnabled() {
        return this.get(STORAGE_KEYS.SOUND_ENABLED, true);
    },

    setSoundEnabled(enabled) {
        this.set(STORAGE_KEYS.SOUND_ENABLED, !!enabled);
    },

    // Clear all stats
    resetAllStats() {
        this.resetTTTScores('pvc');
        this.resetTTTScores('pvp');
        this.resetSnakeScores();
        this.resetRPSScores('pvc');
        this.resetRPSScores('pvp');
    }
};
