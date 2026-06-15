document.addEventListener('DOMContentLoaded', () => {
  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'correct':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;

      case 'incorrect':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(196.00, now);
        osc.frequency.linearRampToValueAtTime(130.81, now + 0.18);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;

      case 'victory':
        const winNotes = [523.25, 659.25, 783.99, 1046.50];
        winNotes.forEach((freq, idx) => {
          const oscN = audioCtx.createOscillator();
          const gainN = audioCtx.createGain();
          oscN.type = 'sine';
          oscN.frequency.setValueAtTime(freq, now + idx * 0.1);
          gainN.gain.setValueAtTime(0.08, now + idx * 0.1);
          gainN.gain.linearRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
          oscN.connect(gainN);
          gainN.connect(audioCtx.destination);
          oscN.start(now + idx * 0.1);
          oscN.stop(now + idx * 0.1 + 0.28);
        });
        break;

      case 'defeat':
        const loseNotes = [261.63, 207.65, 174.61];
        loseNotes.forEach((freq, idx) => {
          const oscN = audioCtx.createOscillator();
          const gainN = audioCtx.createGain();
          oscN.type = 'sawtooth';
          oscN.frequency.setValueAtTime(freq, now + idx * 0.14);
          gainN.gain.setValueAtTime(0.08, now + idx * 0.14);
          gainN.gain.linearRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
          oscN.connect(gainN);
          gainN.connect(audioCtx.destination);
          oscN.start(now + idx * 0.14);
          oscN.stop(now + idx * 0.14 + 0.4);
        });
        break;

      case 'hint':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
    }
  }

  const confettiCanvas = document.getElementById('confetti-canvas');
  const confettiCtx = confettiCanvas.getContext('2d');
  let confettiActive = false;
  let confettiParticles = [];
  
  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfettiCanvas);
  
  class ConfettiParticle {
    constructor() {
      this.x = Math.random() * confettiCanvas.width;
      this.y = Math.random() * confettiCanvas.height - confettiCanvas.height;
      this.size = Math.random() * 8 + 6;
      this.color = ['#22d3ee', '#f43f5e', '#facc15', '#ffffff', '#a78bfa'][Math.floor(Math.random() * 5)];
      this.speedY = Math.random() * 4 + 3;
      this.speedX = Math.random() * 2 - 1;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 4 - 2;
    }
    
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.rotation += this.rotationSpeed;
    }
    
    draw() {
      confettiCtx.save();
      confettiCtx.translate(this.x, this.y);
      confettiCtx.rotate(this.rotation * Math.PI / 180);
      confettiCtx.fillStyle = this.color;
      confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      confettiCtx.restore();
    }
  }
  
  function startConfetti() {
    resizeConfettiCanvas();
    confettiParticles = [];
    for (let i = 0; i < 150; i++) {
      confettiParticles.push(new ConfettiParticle());
    }
    confettiActive = true;
    animateConfetti();
  }
  
  function animateConfetti() {
    if (!confettiActive) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    let particlesOnScreen = false;
    confettiParticles.forEach(p => {
      p.update();
      p.draw();
      if (p.y < confettiCanvas.height) {
        particlesOnScreen = true;
      }
    });
    
    if (particlesOnScreen) {
      requestAnimationFrame(animateConfetti);
    } else {
      confettiActive = false;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  let gameMode = '1player';
  let activePlayer = 1;
  let wordSource = 'computer';
  let customWordGuesser = 1; 

  let customChallengeType = 'one-writer';
  let p1SecretWord = '';
  let p2SecretWord = '';
  let p1Category = '';
  let p2Category = '';
  let p1GuessedLetters = new Set();
  let p2GuessedLetters = new Set();
  let dualCustomWordStep = 0;

  let p1Name = 'Player 1';
  let p2Name = 'Player 2';
  
  let secretWord = '';
  let activeCategory = '';
  let guessedLetters = new Set();
  
  let p1Mistakes = 0;
  let p2Mistakes = 0;
  let gameActive = false;
  let hintsUsed = 0;
  const maxHints = 3;

  const stats = {
    p1Wins: 0,
    p2Wins: 0,
    computerWins: 0,
    playerStreak: 0
  };

  let activeCategoryKey = 'technology';
  let activeDifficulty = 'medium';

  const setupScreen = document.getElementById('setup-screen');
  const gameScreen = document.getElementById('game-screen');

  const mode1pBtn = document.getElementById('mode-1p');
  const mode2pBtn = document.getElementById('mode-2p');
  const p1NameGroup = document.getElementById('p1-name-group');
  const p2NameGroup = document.getElementById('p2-name-group');
  const p1NameInput = document.getElementById('p1-name-input');
  const p2NameInput = document.getElementById('p2-name-input');
  
  const setup2pSource = document.getElementById('setup-2p-source');
  const setup2pCustomMode = document.getElementById('setup-2p-custom-mode');
  const customModeControl = document.getElementById('custom-mode-control');
  const difficultyGroup = document.getElementById('difficulty-group');
  const categoryGrid = document.getElementById('category-grid');
  const difficultyControl = document.getElementById('difficulty-control');
  const wordSourceControl = document.getElementById('word-source-control');
  const startGameBtn = document.getElementById('start-game-btn');
  const backBtn = document.getElementById('back-btn');

  const infoCategory = document.getElementById('info-category');
  const infoScore = document.getElementById('info-score');
  const scoreLabel = document.getElementById('score-label');
  const turnAnnouncement = document.getElementById('turn-announcement');
  const wordDisplay = document.getElementById('word-display');
  const keyboard = document.getElementById('keyboard');
  
  const p1Container = document.getElementById('p1-container');
  const p2Container = document.getElementById('p2-container');
  const p1Label = document.getElementById('p1-label');
  const p2Label = document.getElementById('p2-label');
  const p1MistakesCounter = document.getElementById('p1-mistakes-counter');
  const p2MistakesCounter = document.getElementById('p2-mistakes-counter');
  
  const wordDisplayP1 = document.getElementById('word-display-p1');
  const wordDisplayP2 = document.getElementById('word-display-p2');
  const p1CatLabel = document.getElementById('p1-cat-label');
  const p2CatLabel = document.getElementById('p2-cat-label');
  
  const hintBtn = document.getElementById('hint-btn');
  const hintCountSpan = document.getElementById('hint-count');

  const menuBtn = document.getElementById('menu-btn');
  const resetBtn = document.getElementById('reset-btn');
  const nextWordBtn = document.getElementById('next-word-btn');

  const customWordModal = document.getElementById('custom-word-modal');
  const customWordTitle = document.getElementById('custom-word-title');
  const customWordPrompt = document.getElementById('custom-word-prompt');
  const modalCustomWordInput = document.getElementById('modal-custom-word-input');
  const modalCustomCategoryInput = document.getElementById('modal-custom-category-input');
  const modalToggleWordVisibilityBtn = document.getElementById('modal-toggle-word-visibility');
  const submitCustomWordBtn = document.getElementById('submit-custom-word-btn');

  const rulesModal = document.getElementById('rules-modal');
  const rulesBtn = document.getElementById('rules-btn');
  const closeRulesBtn = document.getElementById('close-rules-btn');
  const rulesOkBtn = document.getElementById('rules-ok-btn');

  const soundBtn = document.getElementById('sound-btn');
  const soundOnIcon = document.getElementById('sound-on-icon');
  const soundOffIcon = document.getElementById('sound-off-icon');

  const gameOverModal = document.getElementById('game-over-modal');
  const gameOverContent = document.getElementById('game-over-content');
  const modalStatusTitle = document.getElementById('modal-status-title');
  const modalStatusText = document.getElementById('modal-status-text');
  const modalRevealedWord = document.getElementById('modal-revealed-word');
  const modalStatsList = document.getElementById('modal-stats-list');
  const modalContinueBtn = document.getElementById('modal-continue-btn');
  const modalResetBtn = document.getElementById('modal-reset-btn');
  const modalMenuBtn = document.getElementById('modal-menu-btn');

  function initSetupScreen() {
    categoryGrid.innerHTML = '';
    
    Object.keys(WORD_CATEGORIES).forEach(catKey => {
      const cat = WORD_CATEGORIES[catKey];
      const btn = document.createElement('button');
      btn.className = `category-btn ${catKey === activeCategoryKey ? 'active' : ''}`;
      btn.textContent = cat.name;
      btn.dataset.category = catKey;
      btn.addEventListener('click', () => {
        playSound('click');
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategoryKey = catKey;
      });
      categoryGrid.appendChild(btn);
    });

    if (gameMode === '2player') {
      const customBtn = document.createElement('button');
      customBtn.className = `category-btn ${activeCategoryKey === 'custom' ? 'active' : ''}`;
      customBtn.textContent = "Custom Clue ✍️";
      customBtn.dataset.category = 'custom';
      customBtn.addEventListener('click', () => {
        playSound('click');
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        customBtn.classList.add('active');
        activeCategoryKey = 'custom';
      });
      categoryGrid.appendChild(customBtn);
    } else {
      if (activeCategoryKey === 'custom') {
        activeCategoryKey = 'technology';
      }
    }

    setThemeColor('var(--color-neutral)', 'var(--color-neutral-glow)');
  }

  function setThemeColor(color, glow) {
    document.documentElement.style.setProperty('--theme-color', color);
    document.documentElement.style.setProperty('--theme-glow', glow);
  }
  
  function showScreen(screen) {
    setupScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    screen.classList.remove('hidden');
    
    if (screen === gameScreen) {
      backBtn.classList.remove('hidden');
    } else {
      backBtn.classList.add('hidden');
    }
  }

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      initAudio();
      playSound('click');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
    }
  });

  rulesBtn.addEventListener('click', () => { playSound('click'); rulesModal.classList.remove('hidden'); });
  closeRulesBtn.addEventListener('click', () => { playSound('click'); rulesModal.classList.add('hidden'); });
  rulesOkBtn.addEventListener('click', () => { playSound('click'); rulesModal.classList.add('hidden'); });
  rulesModal.addEventListener('click', (e) => {
    if (e.target === rulesModal) { rulesModal.classList.add('hidden'); }
  });

  backBtn.addEventListener('click', () => {
    playSound('click');
    gameActive = false;
    customWordModal.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    resetModalStyles();
    showScreen(setupScreen);
    backBtn.classList.add('hidden');
  });

  mode1pBtn.addEventListener('click', () => {
    playSound('click');
    gameMode = '1player';
    mode1pBtn.classList.add('active');
    mode2pBtn.classList.remove('active');
    
    setup2pSource.classList.add('hidden');
    setup2pCustomMode.classList.add('hidden');
    difficultyGroup.classList.remove('hidden');
    p2NameGroup.classList.add('hidden');
    document.querySelector('.name-inputs-container').classList.remove('two-players');
    p1NameGroup.querySelector('label').textContent = "Player Name";
    
    initSetupScreen();
  });

  mode2pBtn.addEventListener('click', () => {
    playSound('click');
    gameMode = '2player';
    mode2pBtn.classList.add('active');
    mode1pBtn.classList.remove('active');

    setup2pSource.classList.remove('hidden');
    p2NameGroup.classList.remove('hidden');
    document.querySelector('.name-inputs-container').classList.add('two-players');
    p1NameGroup.querySelector('label').textContent = "Player 1 Name";
    
    if (wordSource === 'computer') {
      difficultyGroup.classList.remove('hidden');
      setup2pCustomMode.classList.add('hidden');
    } else {
      difficultyGroup.classList.add('hidden');
      setup2pCustomMode.classList.remove('hidden');
    }
    
    initSetupScreen();
  });

  difficultyControl.addEventListener('click', (e) => {
    const btn = e.target.closest('.segment-btn');
    if (!btn) return;
    playSound('click');
    difficultyControl.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeDifficulty = btn.dataset.diff;
  });

  wordSourceControl.addEventListener('click', (e) => {
    const btn = e.target.closest('.segment-btn');
    if (!btn) return;
    playSound('click');
    wordSourceControl.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    wordSource = btn.dataset.source;
    
    if (wordSource === 'computer') {
      difficultyGroup.classList.remove('hidden');
      setup2pCustomMode.classList.add('hidden');
    } else {
      difficultyGroup.classList.add('hidden');
      setup2pCustomMode.classList.remove('hidden');
    }
  });

  customModeControl.addEventListener('click', (e) => {
    const btn = e.target.closest('.segment-btn');
    if (!btn) return;
    playSound('click');
    customModeControl.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    customChallengeType = btn.dataset.customMode;
  });

  modalToggleWordVisibilityBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playSound('click');
    if (modalCustomWordInput.type === 'password') {
      modalCustomWordInput.type = 'text';
      modalToggleWordVisibilityBtn.textContent = '🙈';
    } else {
      modalCustomWordInput.type = 'password';
      modalToggleWordVisibilityBtn.textContent = '👁️';
    }
  });

  startGameBtn.addEventListener('click', () => {
    initAudio();
    
    p1Name = p1NameInput.value.trim() || 'Player 1';
    p2Name = p2NameInput.value.trim() || 'Player 2';

    if (p1Name === p2Name && gameMode === '2player') {
      p1Name += ' (P1)';
      p2Name += ' (P2)';
    }

    if (gameMode === '1player') {
      p2Name = 'Computer';
      const wordList = WORD_CATEGORIES[activeCategoryKey][activeDifficulty];
      secretWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
      activeCategory = WORD_CATEGORIES[activeCategoryKey].name;
      launchGameBoard();
    } else {
      if (wordSource === 'computer') {
        let catKey = activeCategoryKey;
        if (catKey === 'custom') {
          catKey = 'technology';
        }
        const list = WORD_CATEGORIES[catKey][activeDifficulty];
        secretWord = list[Math.floor(Math.random() * list.length)].toUpperCase();
        activeCategory = WORD_CATEGORIES[catKey].name;
        launchGameBoard();
      } else {
        if (customChallengeType === 'both-writers') {
          dualCustomWordStep = 1;
        } else {
          customWordGuesser = 1;
        }
        openCustomWordInputModal();
      }
    }
  });

  function openCustomWordInputModal() {
    modalCustomWordInput.value = '';
    modalCustomCategoryInput.value = '';
    
    let writerName = '';
    let guesserName = '';
    
    if (customChallengeType === 'both-writers') {
      if (dualCustomWordStep === 1) {
        writerName = p2Name;
        guesserName = p1Name;
      } else {
        writerName = p1Name;
        guesserName = p2Name;
      }
    } else {
      writerName = customWordGuesser === 1 ? p2Name : p1Name;
      guesserName = customWordGuesser === 1 ? p1Name : p2Name;
    }
    
    customWordTitle.textContent = `Write Word // ${writerName.toUpperCase()}`;
    
    const categoryName = activeCategoryKey === 'custom' ? 'Custom' : WORD_CATEGORIES[activeCategoryKey].name;
    customWordPrompt.innerHTML = `Hey <strong>${writerName}</strong>, enter a secret word for <strong>${guesserName}</strong>.<br>Category selected: <strong>${categoryName}</strong>`;

    const categoryGroup = document.getElementById('modal-category-group');
    if (activeCategoryKey === 'custom') {
      categoryGroup.classList.remove('hidden');
    } else {
      categoryGroup.classList.add('hidden');
    }
    
    backBtn.classList.remove('hidden');
    
    if (customChallengeType === 'both-writers') {
      if (dualCustomWordStep === 1) {
        setThemeColor('var(--color-p2)', 'var(--color-p2-glow)');
      } else {
        setThemeColor('var(--color-p1)', 'var(--color-p1-glow)');
      }
    } else {
      if (customWordGuesser === 1) {
        setThemeColor('var(--color-p2)', 'var(--color-p2-glow)');
      } else {
        setThemeColor('var(--color-p1)', 'var(--color-p1-glow)');
      }
    }

    customWordModal.classList.remove('hidden');
    modalCustomWordInput.focus();
  }

  submitCustomWordBtn.addEventListener('click', () => {
    const rawWord = modalCustomWordInput.value.trim().toUpperCase();
    
    if (!rawWord || !/^[A-Z\s\-]+$/.test(rawWord)) {
      playSound('incorrect');
      const content = customWordModal.querySelector('.modal-content');
      content.classList.add('shake-animation');
      content.addEventListener('animationend', () => {
        content.classList.remove('shake-animation');
      }, { once: true });
      modalCustomWordInput.focus();
      return;
    }

    let currentCategory = '';
    if (activeCategoryKey === 'custom') {
      const rawCategory = modalCustomCategoryInput.value.trim();
      currentCategory = rawCategory || 'Custom Clue';
    } else {
      currentCategory = WORD_CATEGORIES[activeCategoryKey].name;
    }

    if (customChallengeType === 'both-writers' && gameMode === '2player' && wordSource === 'custom') {
      if (dualCustomWordStep === 1) {
        p1SecretWord = rawWord;
        p1Category = currentCategory;
        dualCustomWordStep = 2;
        openCustomWordInputModal();
      } else {
        p2SecretWord = rawWord;
        p2Category = currentCategory;
        customWordModal.classList.add('hidden');
        launchGameBoard();
      }
    } else {
      secretWord = rawWord;
      activeCategory = currentCategory;
      customWordModal.classList.add('hidden');
      launchGameBoard();
    }
  });

  function launchGameBoard() {
    gameActive = true;
    guessedLetters.clear();
    p1GuessedLetters.clear();
    p2GuessedLetters.clear();
    p1Mistakes = 0;
    p2Mistakes = 0;
    hintsUsed = 0;

    p1Label.textContent = p1Name;
    p2Label.textContent = p2Name;

    const isDualChallenge = (gameMode === '2player' && wordSource === 'custom' && customChallengeType === 'both-writers');

    if (isDualChallenge) {
      gameScreen.classList.add('dual-challenge');
      
      p1Container.classList.remove('hidden');
      p2Container.classList.remove('hidden');
      hintBtn.classList.add('hidden');
      
      p1CatLabel.classList.remove('hidden');
      p2CatLabel.classList.remove('hidden');
      p1CatLabel.textContent = `Clue: ${p1Category}`;
      p2CatLabel.textContent = `Clue: ${p2Category}`;
      
      wordDisplayP1.classList.remove('hidden');
      wordDisplayP2.classList.remove('hidden');
      
      infoCategory.textContent = "Dual Challenge";
      scoreLabel.textContent = "Versus Score";
      updateStatsBar();

      activePlayer = 1;
      p1Container.classList.add('active-player');
      p2Container.classList.remove('active-player');

      setThemeColor('var(--color-p1)', 'var(--color-p1-glow)');
      turnAnnouncement.innerHTML = `<span style="color: var(--color-p1)">${p1Name.toUpperCase()}'S TURN</span>`;
    } else {
      gameScreen.classList.remove('dual-challenge');
      
      p1CatLabel.classList.add('hidden');
      p2CatLabel.classList.add('hidden');
      wordDisplayP1.classList.add('hidden');
      wordDisplayP2.classList.add('hidden');

      if (gameMode === '1player') {
        p2Container.classList.add('hidden');
        p1Container.classList.remove('active-player');
        p1Container.classList.remove('hidden');
        
        activePlayer = 1;
        
        hintBtn.classList.remove('hidden');
        hintCountSpan.textContent = maxHints - hintsUsed;

        infoCategory.textContent = activeCategory;
        scoreLabel.textContent = "Session Streak";
        updateStatsBar();

        setThemeColor('var(--color-neutral)', 'var(--color-neutral-glow)');
        turnAnnouncement.innerHTML = `<span style="color: var(--color-neutral)">DEFEND YOUR HANGMAN</span>`;
      } else {
        p1Container.classList.remove('hidden');
        p2Container.classList.remove('hidden');
        hintBtn.classList.add('hidden');
        infoCategory.textContent = activeCategory;
        scoreLabel.textContent = "Versus Score";
        updateStatsBar();

        if (wordSource === 'computer') {
          activePlayer = 1;
          p1Container.classList.add('active-player');
          p2Container.classList.remove('active-player');

          setThemeColor('var(--color-p1)', 'var(--color-p1-glow)');
          turnAnnouncement.innerHTML = `<span style="color: var(--color-p1)">${p1Name.toUpperCase()}'S TURN</span>`;
        } else {
          if (customWordGuesser === 1) {
            activePlayer = 1;
            p1Container.classList.add('active-player');
            p2Container.classList.remove('active-player');
            
            setThemeColor('var(--color-p1)', 'var(--color-p1-glow)');
            turnAnnouncement.innerHTML = `<span style="color: var(--color-p1)">${p1Name.toUpperCase()}'S GUESS ROUND</span>`;
          } else {
            activePlayer = 2;
            p2Container.classList.add('active-player');
            p1Container.classList.remove('active-player');

            setThemeColor('var(--color-p2)', 'var(--color-p2-glow)');
            turnAnnouncement.innerHTML = `<span style="color: var(--color-p2)">${p2Name.toUpperCase()}'S GUESS ROUND</span>`;
          }
        }
      }
    }

    createKeyboards();
    updateHangmanSVGs();
    renderWordDisplay();
    showScreen(gameScreen);
  }

  function createKeyboards() {
    const p1Kb = document.getElementById('keyboard-p1');
    const p2Kb = document.getElementById('keyboard-p2');
    p1Kb.innerHTML = '';
    p2Kb.innerHTML = '';
    
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    letters.split('').forEach(letter => {
      const keyBtn = document.createElement('button');
      keyBtn.className = 'key';
      keyBtn.id = `key-p1-${letter}`;
      keyBtn.textContent = letter;
      keyBtn.addEventListener('click', () => handleGuess(letter));
      p1Kb.appendChild(keyBtn);
    });
    
    letters.split('').forEach(letter => {
      const keyBtn = document.createElement('button');
      keyBtn.className = 'key';
      keyBtn.id = `key-p2-${letter}`;
      keyBtn.textContent = letter;
      keyBtn.addEventListener('click', () => handleGuess(letter));
      p2Kb.appendChild(keyBtn);
    });

    const deck = document.getElementById('keyboards-deck');
    if (gameMode === '2player') {
      deck.classList.add('two-keyboards');
      p2Kb.classList.remove('hidden');
      
      if (activePlayer === 1) {
        p1Kb.classList.remove('disabled');
        p2Kb.classList.add('disabled');
        enableKeyboardButtons('keyboard-p1');
        disableKeyboardButtons('keyboard-p2');
      } else {
        p2Kb.classList.remove('disabled');
        p1Kb.classList.add('disabled');
        enableKeyboardButtons('keyboard-p2');
        disableKeyboardButtons('keyboard-p1');
      }
    } else {
      deck.classList.remove('two-keyboards');
      p2Kb.classList.add('hidden');
      p1Kb.classList.remove('disabled');
      enableKeyboardButtons('keyboard-p1');
    }
  }

  function enableKeyboardButtons(keyboardId) {
    const kb = document.getElementById(keyboardId);
    const buttons = kb.querySelectorAll('.key');
    const isDualChallenge = (gameMode === '2player' && wordSource === 'custom' && customChallengeType === 'both-writers');
    
    buttons.forEach(btn => {
      const letter = btn.textContent;
      let alreadyGuessed = false;
      if (isDualChallenge) {
        alreadyGuessed = (keyboardId === 'keyboard-p1') ? p1GuessedLetters.has(letter) : p2GuessedLetters.has(letter);
      } else {
        alreadyGuessed = guessedLetters.has(letter);
      }
      btn.disabled = alreadyGuessed;
    });
  }

  function disableKeyboardButtons(keyboardId) {
    const kb = document.getElementById(keyboardId);
    const buttons = kb.querySelectorAll('.key');
    buttons.forEach(btn => {
      btn.disabled = true;
    });
  }

  function disableKeyForPlayer(playerNum, letter, statusClass) {
    const kbId = playerNum === 1 ? 'p1' : 'p2';
    const key = document.getElementById(`key-${kbId}-${letter}`);
    if (key) {
      key.classList.add(statusClass);
      key.disabled = true;
    }
  }

  function disableKeyOnAllKeyboards(letter, statusClass) {
    disableKeyForPlayer(1, letter, statusClass);
    disableKeyForPlayer(2, letter, statusClass);
  }

  function renderWordDisplayForSide(targetDisplay, wordText, guessedSet) {
    targetDisplay.innerHTML = '';
    wordText.split('').forEach(char => {
      const span = document.createElement('span');
      if (char === ' ') {
        span.className = 'letter-blank space';
        span.textContent = ' ';
      } else if (char === '-') {
        span.className = 'letter-blank';
        span.textContent = '-';
        span.classList.add('revealed');
      } else {
        span.className = 'letter-blank';
        if (guessedSet.has(char)) {
          span.textContent = char;
          span.classList.add('revealed');
        } else {
          span.textContent = '';
        }
      }
      targetDisplay.appendChild(span);
    });
  }

  function renderWordDisplay() {
    const isDualChallenge = (gameMode === '2player' && wordSource === 'custom' && customChallengeType === 'both-writers');
    
    if (isDualChallenge) {
      renderWordDisplayForSide(wordDisplayP1, p1SecretWord, p1GuessedLetters);
      renderWordDisplayForSide(wordDisplayP2, p2SecretWord, p2GuessedLetters);
    } else {
      wordDisplay.innerHTML = '';
      secretWord.split('').forEach(char => {
        const span = document.createElement('span');
        if (char === ' ') {
          span.className = 'letter-blank space';
          span.textContent = ' ';
        } else if (char === '-') {
          span.className = 'letter-blank';
          span.textContent = '-';
          span.classList.add('revealed');
        } else {
          span.className = 'letter-blank';
          if (guessedLetters.has(char)) {
            span.textContent = char;
            span.classList.add('revealed');
          } else {
            span.textContent = '';
          }
        }
        wordDisplay.appendChild(span);
      });
    }
  }

  function updateHangmanSVGs() {
    const p1Parts = document.querySelectorAll('.p1-part');
    p1Parts.forEach((part, index) => {
      if (index < p1Mistakes) {
        part.classList.add('visible');
      } else {
        part.classList.remove('visible');
      }
    });
    p1MistakesCounter.textContent = `Mistakes: ${p1Mistakes}/6`;

    const p2Parts = document.querySelectorAll('.p2-part');
    p2Parts.forEach((part, index) => {
      if (index < p2Mistakes) {
        part.classList.add('visible');
      } else {
        part.classList.remove('visible');
      }
    });
    p2MistakesCounter.textContent = `Mistakes: ${p2Mistakes}/6`;
  }

  function updateStatsBar() {
    if (gameMode === '1player') {
      infoScore.textContent = `Wins: ${stats.p1Wins} | Streak: ${stats.playerStreak}`;
    } else {
      infoScore.textContent = `${p1Name}: ${stats.p1Wins} | ${p2Name}: ${stats.p2Wins}`;
    }
  }

  function handleGuess(letter) {
    if (!gameActive) return;

    const isDualChallenge = (gameMode === '2player' && wordSource === 'custom' && customChallengeType === 'both-writers');

    if (isDualChallenge) {
      const activeGuessed = activePlayer === 1 ? p1GuessedLetters : p2GuessedLetters;
      if (activeGuessed.has(letter)) return;

      activeGuessed.add(letter);
      const activeWord = activePlayer === 1 ? p1SecretWord : p2SecretWord;

      if (activeWord.includes(letter)) {
        disableKeyForPlayer(activePlayer, letter, 'correct');
        playSound('correct');
        renderWordDisplay();

        if (isPlayerWordCompleted(activePlayer)) {
          endGame(true);
        }
      } else {
        disableKeyForPlayer(activePlayer, letter, 'incorrect');
        playSound('incorrect');
        shakeActiveScaffold();

        if (activePlayer === 1) {
          p1Mistakes++;
          updateHangmanSVGs();
          if (p1Mistakes >= 6) {
            endGame(false, 2);
          } else {
            switchGuessTurn(2);
          }
        } else {
          p2Mistakes++;
          updateHangmanSVGs();
          if (p2Mistakes >= 6) {
            endGame(false, 1);
          } else {
            switchGuessTurn(1);
          }
        }
      }
    } else {
      if (guessedLetters.has(letter)) return;

      guessedLetters.add(letter);

      if (secretWord.includes(letter)) {
        disableKeyOnAllKeyboards(letter, 'correct');
        playSound('correct');
        renderWordDisplay();

        if (isWordCompleted()) {
          endGame(true);
        }
      } else {
        disableKeyOnAllKeyboards(letter, 'incorrect');
        playSound('incorrect');
        shakeActiveScaffold();

        if (gameMode === '1player') {
          p1Mistakes++;
          updateHangmanSVGs();
          if (p1Mistakes >= 6) {
            endGame(false);
          }
        } else {
          if (wordSource === 'computer') {
            if (activePlayer === 1) {
              p1Mistakes++;
              updateHangmanSVGs();
              if (p1Mistakes >= 6) {
                endGame(false, 2);
              } else {
                switchGuessTurn(2);
              }
            } else {
              p2Mistakes++;
              updateHangmanSVGs();
              if (p2Mistakes >= 6) {
                endGame(false, 1);
              } else {
                switchGuessTurn(1);
              }
            }
          } else {
            if (customWordGuesser === 1) {
              p1Mistakes++;
              updateHangmanSVGs();
              if (p1Mistakes >= 6) {
                endGame(false);
              }
            } else {
              p2Mistakes++;
              updateHangmanSVGs();
              if (p2Mistakes >= 6) {
                endGame(false);
              }
            }
          }
        }
      }
    }
  }

  function shakeActiveScaffold() {
    const container = (gameMode === '1player' || activePlayer === 1) ? p1Container : p2Container;
    container.classList.add('shake-animation');
    container.addEventListener('animationend', () => {
      container.classList.remove('shake-animation');
    }, { once: true });
  }

  function switchGuessTurn(nextPlayer) {
    activePlayer = nextPlayer;
    if (activePlayer === 1) {
      p1Container.classList.add('active-player');
      p2Container.classList.remove('active-player');
      setThemeColor('var(--color-p1)', 'var(--color-p1-glow)');
      turnAnnouncement.innerHTML = `<span style="color: var(--color-p1)">${p1Name.toUpperCase()}'S TURN</span>`;
      
      document.getElementById('keyboard-p1').classList.remove('disabled');
      document.getElementById('keyboard-p2').classList.add('disabled');
      enableKeyboardButtons('keyboard-p1');
      disableKeyboardButtons('keyboard-p2');
    } else {
      p2Container.classList.add('active-player');
      p1Container.classList.remove('active-player');
      setThemeColor('var(--color-p2)', 'var(--color-p2-glow)');
      turnAnnouncement.innerHTML = `<span style="color: var(--color-p2)">${p2Name.toUpperCase()}'S TURN</span>`;

      document.getElementById('keyboard-p2').classList.remove('disabled');
      document.getElementById('keyboard-p1').classList.add('disabled');
      enableKeyboardButtons('keyboard-p2');
      disableKeyboardButtons('keyboard-p1');
    }
  }

  function isPlayerWordCompleted(playerNum) {
    const word = playerNum === 1 ? p1SecretWord : p2SecretWord;
    const guessed = playerNum === 1 ? p1GuessedLetters : p2GuessedLetters;
    return word.split('').every(char => 
      char === ' ' || char === '-' || guessed.has(char)
    );
  }

  function isWordCompleted() {
    return secretWord.split('').every(char => 
      char === ' ' || char === '-' || guessedLetters.has(char)
    );
  }

  hintBtn.addEventListener('click', () => {
    if (!gameActive || gameMode !== '1player' || hintsUsed >= maxHints) return;

    const unguessed = secretWord.split('').filter(char => 
      char !== ' ' && char !== '-' && !guessedLetters.has(char)
    );

    if (unguessed.length > 0) {
      const randChar = unguessed[Math.floor(Math.random() * unguessed.length)];
      hintsUsed++;
      hintCountSpan.textContent = maxHints - hintsUsed;
      playSound('hint');
      handleGuess(randChar);
    }
  });

  function endGame(wordGuessed, winnerOverride = null) {
    gameActive = false;

    gameOverContent.classList.remove('victory', 'defeat');
    modalStatusTitle.classList.remove('text-win', 'text-lose');

    const isDualChallenge = (gameMode === '2player' && wordSource === 'custom' && customChallengeType === 'both-writers');

    if (isDualChallenge) {
      modalRevealedWord.innerHTML = `${p1Name}: <span style="color:var(--color-p1)">${p1SecretWord}</span><br>${p2Name}: <span style="color:var(--color-p2)">${p2SecretWord}</span>`;
    } else {
      modalRevealedWord.textContent = secretWord;
    }
    modalStatsList.innerHTML = '';

    if (gameMode === '1player') {
      if (wordGuessed) {
        playSound('victory');
        startConfetti();
        stats.p1Wins++;
        stats.playerStreak++;

        gameOverContent.classList.add('victory');
        modalStatusTitle.textContent = "VICTORY";
        modalStatusTitle.classList.add('text-win');
        modalStatusText.textContent = `${p1Name} decoded the system core!`;
      } else {
        playSound('defeat');
        stats.computerWins++;
        stats.playerStreak = 0;

        gameOverContent.classList.add('defeat');
        modalStatusTitle.textContent = "DEFEAT";
        modalStatusTitle.classList.add('text-lose');
        modalStatusText.textContent = `${p1Name} got hung in the terminal.`;
      }

      modalStatsList.innerHTML = `
        <div class="modal-stat-row">
          <span>Mistakes Made:</span>
          <span>${p1Mistakes} / 6</span>
        </div>
        <div class="modal-stat-row">
          <span>Hints Used:</span>
          <span>${hintsUsed}</span>
        </div>
        <div class="modal-stat-row">
          <span>Current Streak:</span>
          <span>${stats.playerStreak}</span>
        </div>
      `;
    } else {
      let winnerName = "";
      let winnerColor = "var(--color-success)";
      let reason = "";

      if (isDualChallenge) {
        let winnerNum = 0;
        if (wordGuessed) {
          winnerNum = activePlayer;
          reason = `${winnerNum === 1 ? p1Name : p2Name} guessed their word correctly!`;
        } else {
          winnerNum = winnerOverride;
          reason = `${winnerNum === 1 ? p2Name : p1Name} got hung!`;
        }

        if (winnerNum === 1) {
          playSound('victory');
          startConfetti();
          stats.p1Wins++;
          winnerName = p1Name;
          winnerColor = "var(--color-p1)";
          gameOverContent.classList.add('victory');
        } else if (winnerNum === 2) {
          playSound('victory');
          startConfetti();
          stats.p2Wins++;
          winnerName = p2Name;
          winnerColor = "var(--color-p2)";
          gameOverContent.classList.add('victory');
        }
      } else if (wordSource === 'computer') {
        let winnerNum = 0;
        if (winnerOverride) {
          winnerNum = winnerOverride;
          reason = `${winnerNum === 1 ? p2Name : p1Name} exceeded mistake limits!`;
        } else {
          if (p1Mistakes < p2Mistakes) {
            winnerNum = 1;
            reason = `${p1Name} had fewer mistakes!`;
          } else if (p2Mistakes < p1Mistakes) {
            winnerNum = 2;
            reason = `${p2Name} had fewer mistakes!`;
          } else {
            winnerNum = 0;
            reason = "Equal mistakes! It is a tie match.";
          }
        }

        if (winnerNum === 1) {
          playSound('victory');
          startConfetti();
          stats.p1Wins++;
          winnerName = p1Name;
          winnerColor = "var(--color-p1)";
          gameOverContent.classList.add('victory');
        } else if (winnerNum === 2) {
          playSound('victory');
          startConfetti();
          stats.p2Wins++;
          winnerName = p2Name;
          winnerColor = "var(--color-p2)";
          gameOverContent.classList.add('victory');
        } else {
          playSound('victory');
          winnerName = "DRAW";
          gameOverContent.classList.add('victory');
        }
      } else {
        const guesser = customWordGuesser === 1 ? p1Name : p2Name;
        const writer = customWordGuesser === 1 ? p2Name : p1Name;

        if (wordGuessed) {
          playSound('victory');
          startConfetti();
          if (customWordGuesser === 1) {
            stats.p1Wins++;
            winnerName = p1Name;
            winnerColor = "var(--color-p1)";
          } else {
            stats.p2Wins++;
            winnerName = p2Name;
            winnerColor = "var(--color-p2)";
          }
          reason = `${guesser} guessed the word correctly!`;
          gameOverContent.classList.add('victory');
        } else {
          playSound('victory');
          if (customWordGuesser === 1) {
            stats.p2Wins++;
            winnerName = p2Name;
            winnerColor = "var(--color-p2)";
          } else {
            stats.p1Wins++;
            winnerName = p1Name;
            winnerColor = "var(--color-p1)";
          }
          reason = `${guesser} got hung! ${writer} wins the round.`;
          gameOverContent.classList.add('defeat');
        }
      }

      if (winnerName === "DRAW") {
        modalStatusTitle.textContent = "TIE MATCH";
        modalStatusTitle.className = "";
        modalStatusText.textContent = reason;
      } else {
        modalStatusTitle.textContent = `${winnerName.toUpperCase()} WINS!`;
        modalStatusTitle.style.color = winnerColor;
        modalStatusText.textContent = reason;
      }

      modalStatsList.innerHTML = `
        <div class="modal-stat-row">
          <span>${p1Name} Mistakes:</span>
          <span>${p1Mistakes} / 6</span>
        </div>
        <div class="modal-stat-row">
          <span>${p2Name} Mistakes:</span>
          <span>${p2Mistakes} / 6</span>
        </div>
        <div class="modal-stat-row" style="margin-top: 0.5rem; border-top: 2px solid var(--color-black); padding-top: 0.5rem;">
          <span>Scores:</span>
          <span>${stats.p1Wins} - ${stats.p2Wins}</span>
        </div>
      `;
    }

    updateStatsBar();

    setTimeout(() => {
      gameOverModal.classList.remove('hidden');
    }, 600);
  }

  modalContinueBtn.addEventListener('click', () => {
    playSound('click');
    gameOverModal.classList.add('hidden');
    resetModalStyles();
    
    if (gameMode === '1player') {
      const wordList = WORD_CATEGORIES[activeCategoryKey][activeDifficulty];
      secretWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
      launchGameBoard();
    } else {
      if (wordSource === 'computer') {
        let catKey = activeCategoryKey;
        if (catKey === 'custom') {
          catKey = 'technology';
        }
        const list = WORD_CATEGORIES[catKey][activeDifficulty];
        secretWord = list[Math.floor(Math.random() * list.length)].toUpperCase();
        activeCategory = WORD_CATEGORIES[catKey].name;
        launchGameBoard();
      } else {
        if (customChallengeType === 'both-writers') {
          dualCustomWordStep = 1;
        } else {
          customWordGuesser = customWordGuesser === 1 ? 2 : 1;
        }
        openCustomWordInputModal();
      }
    }
  });

  nextWordBtn.addEventListener('click', () => {
    playSound('click');
    if (gameMode === '1player') {
      const wordList = WORD_CATEGORIES[activeCategoryKey][activeDifficulty];
      secretWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
      launchGameBoard();
    } else {
      if (wordSource === 'computer') {
        let catKey = activeCategoryKey;
        if (catKey === 'custom') {
          catKey = 'technology';
        }
        const list = WORD_CATEGORIES[catKey][activeDifficulty];
        secretWord = list[Math.floor(Math.random() * list.length)].toUpperCase();
        activeCategory = WORD_CATEGORIES[catKey].name;
        launchGameBoard();
      } else {
        if (customChallengeType === 'both-writers') {
          dualCustomWordStep = 1;
        } else {
          customWordGuesser = customWordGuesser === 1 ? 2 : 1;
        }
        openCustomWordInputModal();
      }
    }
  });

  modalResetBtn.addEventListener('click', () => {
    playSound('click');
    gameOverModal.classList.add('hidden');
    resetModalStyles();
    
    stats.p1Wins = 0;
    stats.p2Wins = 0;
    stats.computerWins = 0;
    stats.playerStreak = 0;
    updateStatsBar();

    if (gameMode === '1player') {
      const wordList = WORD_CATEGORIES[activeCategoryKey][activeDifficulty];
      secretWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
      launchGameBoard();
    } else {
      if (wordSource === 'computer') {
        let catKey = activeCategoryKey;
        if (catKey === 'custom') {
          catKey = 'technology';
        }
        const list = WORD_CATEGORIES[catKey][activeDifficulty];
        secretWord = list[Math.floor(Math.random() * list.length)].toUpperCase();
        activeCategory = WORD_CATEGORIES[catKey].name;
        launchGameBoard();
      } else {
        if (customChallengeType === 'both-writers') {
          dualCustomWordStep = 1;
        } else {
          customWordGuesser = 1;
        }
        openCustomWordInputModal();
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    playSound('click');
    stats.p1Wins = 0;
    stats.p2Wins = 0;
    stats.computerWins = 0;
    stats.playerStreak = 0;
    updateStatsBar();
  });

  modalMenuBtn.addEventListener('click', () => {
    playSound('click');
    gameOverModal.classList.add('hidden');
    resetModalStyles();
    showScreen(setupScreen);
  });

  menuBtn.addEventListener('click', () => {
    playSound('click');
    gameActive = false;
    showScreen(setupScreen);
  });

  function resetModalStyles() {
    modalStatusTitle.style.color = '';
    gameOverContent.style.borderColor = '';
    backBtn.classList.add('hidden');
  }

  window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    if (document.activeElement === p1NameInput || 
        document.activeElement === p2NameInput || 
        document.activeElement === modalCustomWordInput || 
        document.activeElement === modalCustomCategoryInput) {
      return;
    }

    if (!gameOverModal.classList.contains('hidden') || 
        !rulesModal.classList.contains('hidden') || 
        !customWordModal.classList.contains('hidden')) {
      return;
    }

    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      const isDualChallenge = (gameMode === '2player' && wordSource === 'custom' && customChallengeType === 'both-writers');
      const activeGuessed = isDualChallenge 
        ? (activePlayer === 1 ? p1GuessedLetters : p2GuessedLetters)
        : guessedLetters;
      
      if (!activeGuessed.has(key)) {
        handleGuess(key);
      }
    }
  });

  initSetupScreen();
});
