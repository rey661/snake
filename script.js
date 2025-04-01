document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const startButton = document.getElementById('start-btn');
    const resetButton = document.getElementById('reset-btn');
    const gameOverlay = document.getElementById('game-overlay');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    // Game constants
    const BOX_SIZE = 20;
    const GRID_SIZE = canvas.width / BOX_SIZE;
    const COLORS = {
        snakeHead: '#05d9e8',
        snakeBody: '#00ff87',
        food: '#ff2a6d',
        glow: {
            head: '#05d9e8',
            body: '#00ff87',
            food: '#ff2a6d'
        }
    };

    // Game variables
    let snake = [];
    let food = {};
    let direction = null;
    let nextDirection = null;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameRunning = false;
    let animationFrameId;
    let lastRenderTime = 0;
    const GAME_SPEED = 100; // ms per frame

    // Initialize the game
    function initGame() {
        snake = [
            {x: 9 * BOX_SIZE, y: 10 * BOX_SIZE}
        ];
        generateFood();
        direction = null;
        nextDirection = null;
        score = 0;
        updateScoreDisplay();
    }

    // Generate food at random position
    function generateFood() {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE) * BOX_SIZE,
            y: Math.floor(Math.random() * GRID_SIZE) * BOX_SIZE
        };

        // Make sure food doesn't appear on snake
        for (let segment of snake) {
            if (food.x === segment.x && food.y === segment.y) {
                generateFood();
                return;
            }
        }
    }

    // Main game loop
    function gameLoop(currentTime) {
        if (!gameRunning) return;

        animationFrameId = requestAnimationFrame(gameLoop);

        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
        if (secondsSinceLastRender < GAME_SPEED / 1000) return;

        lastRenderTime = currentTime;

        update();
        draw();
    }

    // Update game state
    function update() {
        // Update direction with buffered input
        if (nextDirection) {
            direction = nextDirection;
            nextDirection = null;
        }

        if (!direction) return;

        // Get head position
        let headX = snake[0].x;
        let headY = snake[0].y;

        // Move based on direction
        if (direction === 'LEFT') headX -= BOX_SIZE;
        if (direction === 'UP') headY -= BOX_SIZE;
        if (direction === 'RIGHT') headX += BOX_SIZE;
        if (direction === 'DOWN') headY += BOX_SIZE;

        // Check if snake eats food
        if (headX === food.x && headY === food.y) {
            score++;
            updateScoreDisplay();
            generateFood();
            // Don't remove tail - snake grows
        } else {
            // Remove tail if no food eaten
            snake.pop();
        }

        // Add new head
        const newHead = {x: headX, y: headY};

        // Check for collisions
        if (
            headX < 0 || headY < 0 ||
            headX >= canvas.width || headY >= canvas.height ||
            collision(newHead, snake)
        ) {
            gameOver();
            return;
        }

        snake.unshift(newHead);
    }

    // Draw the game state
    function draw() {
        // Clear the canvas with semi-transparent overlay for motion blur effect
        ctx.fillStyle = 'rgba(5, 1, 15, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw snake
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            const isHead = i === 0;

            // Main segment
            ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snakeBody;
            ctx.fillRect(segment.x, segment.y, BOX_SIZE, BOX_SIZE);

            // Glow effect
            ctx.shadowColor = isHead ? COLORS.glow.head : COLORS.glow.body;
            ctx.shadowBlur = 15;
            ctx.fillRect(segment.x, segment.y, BOX_SIZE, BOX_SIZE);
            ctx.shadowBlur = 0;

            // Segment border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.strokeRect(segment.x, segment.y, BOX_SIZE, BOX_SIZE);
        }

        // Draw food
        ctx.fillStyle = COLORS.food;
        ctx.fillRect(food.x, food.y, BOX_SIZE, BOX_SIZE);

        // Food glow
        ctx.shadowColor = COLORS.glow.food;
        ctx.shadowBlur = 20;
        ctx.fillRect(food.x, food.y, BOX_SIZE, BOX_SIZE);
        ctx.shadowBlur = 0;

        // Pulsing effect for food
        const pulseSize = Math.sin(Date.now() / 200) * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(
            food.x + BOX_SIZE/4 - pulseSize/2,
            food.y + BOX_SIZE/4 - pulseSize/2,
            BOX_SIZE/2 + pulseSize,
            BOX_SIZE/2 + pulseSize
        );
    }

    // Check for collision with self
    function collision(head, array) {
        return array.some(segment => head.x === segment.x && head.y === segment.y);
    }

    // Update score display with leading zeros
    function updateScoreDisplay() {
        scoreElement.textContent = String(score).padStart(3, '0');
    }

    // Update high score display
    function updateHighScoreDisplay() {
        highScoreElement.textContent = String(highScore).padStart(3, '0');
    }

    // Game over
    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);

        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            updateHighScoreDisplay();
        }

        // Show game over overlay
        gameOverlay.style.display = 'flex';
        gameOverlay.innerHTML = `
            <h2>GAME OVER</h2>
            <p>Score: ${score}</p>
            <button id="restart-btn">PLAY AGAIN</button>
        `;

        document.getElementById('restart-btn').addEventListener('click', startGame);
    }

    // Start the game
    function startGame() {
        if (gameRunning) {
            // Pause game
            gameRunning = false;
            cancelAnimationFrame(animationFrameId);
            gameOverlay.style.display = 'flex';
            gameOverlay.innerHTML = `
                <h2>PAUSED</h2>
                <button id="resume-btn">RESUME</button>
            `;
            document.getElementById('resume-btn').addEventListener('click', startGame);
            return;
        }

        // Start new game or resume
        if (direction === null) {
            initGame();
        }

        gameRunning = true;
        gameOverlay.style.display = 'none';
        lastRenderTime = 0;
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Reset the game
    function resetGame() {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
        initGame();
        gameOverlay.style.display = 'flex';
        gameOverlay.innerHTML = `
            <h2>NEON SNAKE</h2>
            <button id="start-btn">START GAME</button>
        `;
        document.getElementById('start-btn').addEventListener('click', startGame);
        draw();
    }

    // Handle keyboard input
    function handleKeyDown(e) {
        if (!gameRunning && (e.key === ' ' || e.key === 'Enter')) {
            startGame();
            return;
        }

        // Buffer the next direction to prevent 180-degree turns
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            if (direction !== 'RIGHT') nextDirection = 'LEFT';
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            if (direction !== 'DOWN') nextDirection = 'UP';
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            if (direction !== 'LEFT') nextDirection = 'RIGHT';
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            if (direction !== 'UP') nextDirection = 'DOWN';
        }
    }

    // Mobile controls
    upBtn.addEventListener('click', () => { if (direction !== 'DOWN') nextDirection = 'UP'; });
    downBtn.addEventListener('click', () => { if (direction !== 'UP') nextDirection = 'DOWN'; });
    leftBtn.addEventListener('click', () => { if (direction !== 'RIGHT') nextDirection = 'LEFT'; });
    rightBtn.addEventListener('click', () => { if (direction !== 'LEFT') nextDirection = 'RIGHT'; });

    // Event listeners
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    document.addEventListener('keydown', handleKeyDown);

    // Initialize
    highScoreElement.textContent = String(highScore).padStart(3, '0');
    resetGame();
});