# MY GAME CENTRE 🎮

A premium, fully responsive, zero-dependency gaming web portal built with **HTML5, CSS3, and modern vanilla JavaScript**.

---

## 🌟 What is MY GAME CENTRE?

**MY GAME CENTRE** is an offline-ready arcade portal featuring three complete, fully functional games:

1. **Advanced Tic-Tac-Toe**: Selectable board sizes from 3×3 up to 8×8 (plus customizable dimensions up to 10×10), adjustable winning conditions, 2-player pass & play or single-player vs our smart AI, winning-line glowing highlights, and confirmation safeguards.
2. **Snake Arcade**: Classic continuous-movement neon snake with keyboard (Arrow keys & WASD) + mobile touch D-Pad and swipe gestures, golden bonus food, progressive difficulty, pause/resume, and high-score saving in `localStorage`.
3. **Rock Paper Scissors**: Single-Player vs Computer and Two Players on the Same Device featuring a dedicated **Pass the Device to Player 2** hidden-selection handover screen, battle arena animations, and round breakdowns.

---

## 📁 Project Structure

```
my-game-centre/
│
├── index.html           # Main single-page application entry point
├── style.css            # Dark cyberpunk neon theme, animations & responsive styles
├── README.md            # Documentation, how to run, and beginner guide
│
└── js/
    ├── storage.js       # LocalStorage manager for scores, high scores, and settings
    ├── audio.js         # Native Web Audio API synthesizer for arcade sound effects
    ├── tictactoe.js     # Advanced Tic-Tac-Toe game logic and AI engine
    ├── snake.js         # Canvas-based Snake game with D-Pad & touch controls
    ├── rps.js           # Rock Paper Scissors single-player & 2-player pass & play
    └── main.js          # Navigation routing, modal controllers, and app lifecycle
```

---

## 🚀 How to Launch MY GAME CENTRE on Your Laptop

Since **MY GAME CENTRE** runs on standard web technologies without external dependencies or backend servers, launching it is as simple as opening a file:

### Method 1: Double-Click (Easiest)
1. Open Windows File Explorer.
2. Navigate to:
   ```
   C:\Users\adity\.gemini\antigravity\scratch\my-game-centre
   ```
3. Double-click **`index.html`** to open it in your default browser (Google Chrome, Microsoft Edge, Firefox, Brave, etc.).

### Method 2: From PowerShell
Run this command in PowerShell to open it directly in your default web browser:
```powershell
Start-Process "C:\Users\adity\.gemini\antigravity\scratch\my-game-centre\index.html"
```

---

## 🎮 How to Test Each Game

### 1. Navigation & Sound
- Click any of the top navigation links (**Home**, **Tic-Tac-Toe**, **Snake**, **Rock Paper Scissors**) or game card buttons.
- Click the **🏠 Home** button inside any game to smoothly return to the dashboard without a page reload.
- Click **Sound: ON / OFF** in the navbar to test synthesized arcade beeps and chimes.
- Click **📊 Stats** to view your cumulative stats across all three games.

### 2. Advanced Tic-Tac-Toe
- **Board Sizes**: Try **3×3**, **4×4**, **5×5**, and **8×8**. Notice how the board physically re-renders into a dynamic grid with proportional symbol sizing.
- **Custom Size**: Select **Custom Size...**, enter `6` for Grid Size and `4` for Win Streak, then click **Apply Grid**.
- **Play vs Computer**: Make a move as **X**; the computer automatically responds as **O** with intelligent blocking and streak building.
- **Two Players**: Toggle to **Two Players** and take turns with a friend on the same laptop or phone.
- **Win Detection**: Connect consecutive marks horizontally, vertically, or diagonally. Notice the winning combination glow green and the prominent result overlay appear with the exact specified result messages (**YOU WON!**, **YOU LOSE!**, **PLAYER 1 WINS!**, **PLAYER 2 WINS!**, or **IT'S A DRAW!**).
- **Match Protection**: Try changing board size or mode mid-game. A custom neon confirmation modal will ask whether you want to discard the active match before resetting.

### 3. Snake Arcade
- Click **▶ Start Game** or press **Spacebar**.
- Steer using **Arrow Keys**, **WASD**, or the on-screen **D-Pad buttons** (▲ ◀ ▼ ▶).
- Eat red apples to grow and gain +10 points. Every 5 apples, a pulsating **Golden Bonus Star** (+30 points) appears with a limited timer!
- Test **Pause** (Spacebar or Pause button) and **Resume**.
- Test wall crash or self-tail collision. Upon crash, **GAME OVER!** appears. If you beat your personal record, a celebratory **NEW HIGH SCORE!** banner is displayed and saved in `localStorage`.

### 4. Rock Paper Scissors
- **vs Computer**: Select **Rock**, **Paper**, or **Scissors**. The arena will show animated battling hands and reveal the computer's choice with standard victory rules (Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock).
- **Two Players on Same Device**: Switch to **Two Players (Pass & Play)**:
  1. Player 1 chooses a weapon.
  2. Player 1's choice is immediately concealed.
  3. The **PASS THE DEVICE TO PLAYER 2** screen appears with a **Continue** button.
  4. Player 2 clicks **Continue** and selects their weapon.
  5. Both choices are revealed in the battle arena, and the winner is declared!

---

## 🛠️ How to Customize the Website Later

As a beginner, here are easy ways you can customize MY GAME CENTRE:

- **Change Theme Colors**: Open `style.css` and modify the CSS variables at the top under `:root` (`--neon-cyan`, `--neon-purple`, `--neon-pink`, `--neon-green`).
- **Adjust Snake Speed**: Open `js/snake.js` and change `baseSpeed: 150` (higher is slower, lower is faster).
- **Add Sound Effects**: Open `js/audio.js` to tweak oscillator frequencies and waveforms (`'sine'`, `'square'`, `'triangle'`, `'sawtooth'`).
- **Modify Tic-Tac-Toe Rules**: Open `js/tictactoe.js` to adjust default dimensions or add new preset sizes.

---

## 📋 Technology Summary
- **Frontend**: Semantic HTML5, CSS Grid, CSS Flexbox, Canvas 2D API.
- **JavaScript**: Modular vanilla JavaScript (ES6+).
- **Storage**: Browser `localStorage` with in-memory fallback.
- **Audio**: Web Audio API (100% native synthesizer, no MP3/WAV files required).
- **Backend / Dependencies**: None. 100% local and offline.
