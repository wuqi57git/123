const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const SCREEN_WIDTH = 480;
const SCREEN_HEIGHT = 640;
const PLAYER_SIZE = 50;
const BULLET_SIZE = 10;
const BULLET_SPEED = 10;
const PLAYER_SPEED = 5;
const SHOT_COOLDOWN = 300;

let gameState = 'start';
let score = 0;
let lives = 3;
let combo = 0;
let gameTime = 0;

let player = {
    x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
    y: SCREEN_HEIGHT - PLAYER_SIZE - 20,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    lastShotTime: 0
};

let bullets = [];
let enemies = [];
let explosions = [];
let keys = {};

let enemySpawnTimer = 0;
let enemySpawnInterval = 2000;
let maxEnemies = 10;

function initGame() {
    player = {
        x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2,
        y: SCREEN_HEIGHT - PLAYER_SIZE - 20,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        lastShotTime: 0
    };
    bullets = [];
    enemies = [];
    explosions = [];
    score = 0;
    lives = 3;
    combo = 0;
    gameTime = 0;
    enemySpawnTimer = 0;
    enemySpawnInterval = 2000;
}

function spawnEnemy() {
    if (enemies.length >= maxEnemies) return;

    const rand = Math.random();
    let type, size, speed, hp, scoreValue;

    if (rand < 0.6) {
        type = 'basic';
        size = 40;
        speed = 2 + gameTime / 30000;
        hp = 1;
        scoreValue = 100;
    } else if (rand < 0.9) {
        type = 'fast';
        size = 35;
        speed = 4 + gameTime / 20000;
        hp = 1;
        scoreValue = 200;
    } else {
        type = 'boss';
        size = 80;
        speed = 1;
        hp = 10;
        scoreValue = 500;
    }

    enemies.push({
        id: Date.now() + Math.random(),
        x: Math.random() * (SCREEN_WIDTH - size),
        y: -size,
        type,
        size,
        speed,
        hp,
        maxHp: hp,
        score: scoreValue,
        direction: Math.random() > 0.5 ? 1 : -1
    });
}

function shoot() {
    const now = Date.now();
    if (now - player.lastShotTime < SHOT_COOLDOWN) return;

    bullets.push({
        id: Date.now(),
        x: player.x + player.width / 2 - BULLET_SIZE / 2,
        y: player.y,
        width: BULLET_SIZE,
        height: BULLET_SIZE
    });

    player.lastShotTime = now;
}

function updatePlayer() {
    if (keys['ArrowUp'] || keys['KeyW']) {
        player.y = Math.max(0, player.y - PLAYER_SPEED);
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        player.y = Math.min(SCREEN_HEIGHT - player.height, player.y + PLAYER_SPEED);
    }
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x = Math.max(0, player.x - PLAYER_SPEED);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x = Math.min(SCREEN_WIDTH - player.width, player.x + PLAYER_SPEED);
    }
    if (keys['Space']) {
        shoot();
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= BULLET_SPEED;
        return bullet.y > -BULLET_SIZE;
    });
}

function updateEnemies() {
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        
        if (enemy.type === 'boss') {
            enemy.x += enemy.direction * 1.5;
            if (enemy.x <= 0 || enemy.x >= SCREEN_WIDTH - enemy.size) {
                enemy.direction *= -1;
            }
        }

        if (enemy.y > SCREEN_HEIGHT) {
            gameOver();
            return false;
        }
        return true;
    });
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const bulletCenterX = bullet.x + BULLET_SIZE / 2;
            const bulletCenterY = bullet.y + BULLET_SIZE / 2;
            const enemyCenterX = enemy.x + enemy.size / 2;
            const enemyCenterY = enemy.y + enemy.size / 2;
            const distance = Math.sqrt(
                Math.pow(bulletCenterX - enemyCenterX, 2) +
                Math.pow(bulletCenterY - enemyCenterY, 2)
            );

            if (distance < (BULLET_SIZE + enemy.size) / 3) {
                enemy.hp--;
                
                if (enemy.hp <= 0) {
                    createExplosion(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, enemy.size);
                    combo++;
                    let addScore = enemy.score;
                    if (combo >= 5) {
                        addScore += 50 * Math.floor(combo / 5);
                    }
                    score += addScore;
                    updateScoreDisplay();
                    enemies.splice(enemyIndex, 1);
                }
                bullets.splice(bulletIndex, 1);
            }
        });
    });

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    enemies.forEach((enemy, index) => {
        const enemyCenterX = enemy.x + enemy.size / 2;
        const enemyCenterY = enemy.y + enemy.size / 2;
        const distance = Math.sqrt(
            Math.pow(playerCenterX - enemyCenterX, 2) +
            Math.pow(playerCenterY - enemyCenterY, 2)
        );

        if (distance < (player.width + enemy.size) / 3) {
            createExplosion(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, enemy.size);
            enemies.splice(index, 1);
            lives--;
            combo = 0;
            updateLivesDisplay();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
}

function createExplosion(x, y, size) {
    explosions.push({
        x,
        y,
        radius: size / 2,
        maxRadius: size,
        alpha: 1
    });
}

function updateExplosions() {
    explosions = explosions.filter(exp => {
        exp.radius += 2;
        exp.alpha -= 0.05;
        return exp.alpha > 0;
    });
}

function drawPlayer() {
    ctx.save();
    
    ctx.fillStyle = '#4a90d9';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height * 0.7);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#6ab0ff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y + 10);
    ctx.lineTo(player.x + player.width - 10, player.y + player.height - 10);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height * 0.5);
    ctx.lineTo(player.x + 10, player.y + player.height - 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height * 0.6, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();
        const gradient = ctx.createRadialGradient(
            bullet.x + BULLET_SIZE / 2,
            bullet.y + BULLET_SIZE / 2,
            0,
            bullet.x + BULLET_SIZE / 2,
            bullet.y + BULLET_SIZE / 2,
            BULLET_SIZE / 2
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bullet.x + BULLET_SIZE / 2, bullet.y + BULLET_SIZE / 2, BULLET_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        
        let color, secondaryColor;
        if (enemy.type === 'basic') {
            color = '#ff4757';
            secondaryColor = '#ff6b81';
        } else if (enemy.type === 'fast') {
            color = '#3742fa';
            secondaryColor = '#5352ed';
        } else {
            color = '#ffd700';
            secondaryColor = '#ffa502';
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.size / 2, enemy.y + enemy.size);
        ctx.lineTo(enemy.x + enemy.size, enemy.y);
        ctx.lineTo(enemy.x + enemy.size / 2, enemy.y + enemy.size * 0.3);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.size / 2, enemy.y + enemy.size - 8);
        ctx.lineTo(enemy.x + enemy.size - 8, enemy.y + 8);
        ctx.lineTo(enemy.x + enemy.size / 2, enemy.y + enemy.size * 0.4);
        ctx.lineTo(enemy.x + 8, enemy.y + 8);
        ctx.closePath();
        ctx.fill();
        
        if (enemy.type === 'boss') {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
        }
        
        ctx.restore();
    });
}

function drawExplosions() {
    explosions.forEach(exp => {
        ctx.save();
        ctx.globalAlpha = exp.alpha;
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#ffd700');
        gradient.addColorStop(0.6, '#ff6b35');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function draw() {
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % SCREEN_WIDTH;
        const y = ((i * 53) + gameTime / 50) % SCREEN_HEIGHT;
        const size = (i % 3) + 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) * 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawExplosions();
}

function gameLoop(timestamp) {
    if (gameState !== 'playing') return;

    gameTime = timestamp;
    
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateExplosions();
    checkCollisions();
    
    enemySpawnTimer += 16;
    if (enemySpawnTimer >= enemySpawnInterval) {
        spawnEnemy();
        enemySpawnTimer = 0;
        enemySpawnInterval = Math.max(500, 2000 - gameTime / 100);
    }
    
    draw();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    initGame();
    updateScoreDisplay();
    updateLivesDisplay();
    gameState = 'playing';
    hideScreen('startScreen');
    hideScreen('gameOverScreen');
    requestAnimationFrame(gameLoop);
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showScreen('pauseScreen');
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        hideScreen('pauseScreen');
        requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    gameState = 'ended';
    document.getElementById('finalScore').textContent = score;
    showScreen('gameOverScreen');
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = score;
}

function updateLivesDisplay() {
    const livesEl = document.getElementById('lives');
    livesEl.textContent = '❤️'.repeat(lives);
}

function showScreen(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideScreen(id) {
    document.getElementById(id).classList.add('hidden');
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (e.code === 'Enter') {
        if (gameState === 'start' || gameState === 'ended') {
            startGame();
        }
    } else if (e.code === 'Escape') {
        if (gameState === 'playing') {
            pauseGame();
        } else if (gameState === 'paused') {
            resumeGame();
        }
    }
    
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

showScreen('startScreen');
hideScreen('pauseScreen');
hideScreen('gameOverScreen');