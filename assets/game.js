// Import assets for Vite bundling
import billySpriteSrc from "./sprites/billy-sprite.png";
import billyIdleSpriteSrc from "./sprites/billy-idle.png";
import birdSpriteSrc from "./sprites/bird-sprite.png";
import priestSpriteSrc from "./sprites/priest-sprite.png";
import mouseSpriteSrc from "./sprites/mouse-sprite.png";
import treatSpriteSrc from "./sprites/treat.png";
import backgroundDaySrc from "./sprites/background-day.png";
import backgroundNightSrc from "./sprites/background-night.png";
import baseSrc from "./sprites/base.png";
import swooshSrc from "./audio/swoosh.wav";
import pointSrc from "./audio/point.wav";
import hitSrc from "./audio/hit.wav";
import dieSrc from "./audio/die.wav";
// Import number sprites
import num0Src from "./sprites/0.png";
import num1Src from "./sprites/1.png";
import num2Src from "./sprites/2.png";
import num3Src from "./sprites/3.png";
import num4Src from "./sprites/4.png";
import num5Src from "./sprites/5.png";
import num6Src from "./sprites/6.png";
import num7Src from "./sprites/7.png";
import num8Src from "./sprites/8.png";
import num9Src from "./sprites/9.png";
// Import SVG icons
import volumeUpSrc from "./volume_up.svg";
import volumeOffSrc from "./volume_off.svg";
import playPauseSrc from "./play_pause.svg";

// Game Configuration
const CONFIG = {
  canvas: {
    width: 1000,
    height: 500,
  },
  gravity: 0.4,
  jumpForce: -14,
  gameSpeed: 5,
  speedIncrement: 0.001,
  groundLevel: 280,
  obstacleSpawnInterval: 2500, // Increased from 1500 to 2500ms
  obstacleSpawnVariance: 800, // Increased from 500 to 800ms
  treatSpawnChance: 0.08, // 8% chance to spawn treat instead of regular obstacle
};

// Cookie utility functions
function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === " ") cookie = cookie.substring(1);
    if (cookie.indexOf(nameEQ) === 0) return cookie.substring(nameEQ.length);
  }
  return null;
}

// Game State
const gameState = {
  isRunning: false,
  isPaused: false,
  isMuted: false,
  score: 0,
  highScore: parseInt(getCookie("billyHighScore")) || 0,
  gameSpeed: CONFIG.gameSpeed,
  frameCount: 0,
};

// Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", {
  alpha: false, // Disable transparency for better performance
  desynchronized: true, // Hint for better performance on mobile
});

// Disable image smoothing for crisp pixel art and better performance
ctx.imageSmoothingEnabled = false;

// Game Objects - declare early
let billy;
let obstacles = [];
let lastObstacleTime = 0;
let baseX = 0; // For scrolling ground

// Make canvas responsive
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  // Update config based on canvas size
  CONFIG.canvas.width = canvas.width;
  CONFIG.canvas.height = canvas.height;
  CONFIG.groundLevel = canvas.height - 112 - 98; // Ground at bottom (112px base height + 100px Billy height)

  // Update Billy's position if he exists
  if (billy) {
    billy.y = CONFIG.groundLevel;
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Billy (Player) Class
class Billy {
  constructor() {
    this.width = 100;
    this.height = 100;
    this.x = 70;
    this.y = CONFIG.groundLevel;
    this.velocityY = 0;
    this.isJumping = false;
    this.isFalling = false;
    this.animationFrame = 0;
    this.animationSpeed = 0.1; // Much slower animation
    this.spriteSheet = null;
    this.spriteLoaded = false;
    this.idleSpriteSheet = null;
    this.idleSpriteLoaded = false;

    // Hitbox adjustments
    this.hitboxOffsetX = 20;
    this.hitboxOffsetY = 60;
    this.hitboxWidth = 60; // 100 - 10 = 90
    this.hitboxHeight = 40;

    // Sprite sheet configuration: 2 rows x 4 columns = 8 frames
    // Row 1 (frames 0-3): idle, run states
    // Row 2 (frames 4-7): jump, fall, hit states
    this.sprites = {
      idle: { startFrame: 0, frames: 8, speed: 0.03 }, // billy-idle.png: 8 frames
      run: { startFrame: 1, frames: 3, speed: 0.167 }, // frames 3-4 (indices 2-3)
      jump: { startFrame: 3, frames: 2, speed: 0.1 }, // frames 4-5 (indices 3-4)
      fall: { startFrame: 5, frames: 1, speed: 0.017 }, // frame 6 (index 5)
      hit: { startFrame: 7, frames: 1, speed: 0.067 }, // frame 7 (index 6)
    };
    this.currentAnimation = "idle";
  }

  loadSprite(src) {
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    this.spriteSheet.onerror = () => {};
    this.spriteSheet.src = src;
  }

  loadIdleSprite(src) {
    this.idleSpriteSheet = new Image();
    this.idleSpriteSheet.onload = () => {
      this.idleSpriteLoaded = true;
    };
    this.idleSpriteSheet.onerror = () => {};
    this.idleSpriteSheet.src = src;
  }

  jump() {
    if (!this.isJumping) {
      this.velocityY = CONFIG.jumpForce;
      this.isJumping = true;
      // Play jump sound
      if (!gameState.isMuted && audioUnlocked) {
        audio.jump.currentTime = 0;
        audio.jump.play().catch(() => {});
      }
    }
  }

  update() {
    // Apply gravity
    this.velocityY += CONFIG.gravity;
    this.y += this.velocityY;

    // Determine animation state
    if (this.y < CONFIG.groundLevel - 5) {
      // In the air
      if (this.velocityY < 0) {
        this.currentAnimation = "jump";
      } else {
        this.currentAnimation = "fall";
      }
    } else {
      // On the ground - use run animation
      this.currentAnimation = "run";
    }

    // Ground collision
    if (this.y >= CONFIG.groundLevel) {
      this.y = CONFIG.groundLevel;
      this.velocityY = 0;
      this.isJumping = false;
      this.currentAnimation = "run";
    }

    // Update animation frame with animation-specific speed
    const anim = this.sprites[this.currentAnimation];
    this.animationFrame += anim.speed;
  }

  draw() {
    ctx.save();

    const anim = this.sprites[this.currentAnimation];

    // Use separate idle sprite if in idle state and loaded
    if (
      this.currentAnimation === "idle" &&
      this.idleSpriteLoaded &&
      this.idleSpriteSheet.complete
    ) {
      // billy-idle.png: 8 frames in 2 rows x 4 columns grid, each frame is 384x512
      const frameWidth = 384;
      const frameHeight = 512;
      const columns = 4;

      const currentFrame = Math.floor(this.animationFrame) % anim.frames;

      // Calculate row & column in grid (same as main sprite)
      const col = currentFrame % columns;
      const row = Math.floor(currentFrame / columns);
      const srcX = col * frameWidth;
      const srcY = row * frameHeight;

      ctx.drawImage(
        this.idleSpriteSheet,
        srcX,
        srcY,
        frameWidth,
        frameHeight,
        Math.round(this.x),
        Math.round(this.y),
        this.width,
        this.height
      );
    } else if (this.spriteLoaded && this.spriteSheet.complete) {
      // --- Sprite sheet config: 2 rows x 4 columns ---
      // Sprite is 1536x1024: 4 frames per row, 2 rows
      // Use main sprite for all animations including idle fallback
      const frameWidth = this.spriteSheet.width / 4; // 1536/4 = 384px
      const frameHeight = this.spriteSheet.height / 2; // 1024/2 = 512px
      const columns = 4;

      // --- Animation frame ---
      // For idle, use first frame from main sprite if idle sprite not loaded
      let currentFrame, frameIndex;
      if (this.currentAnimation === "idle") {
        currentFrame = 0;
        frameIndex = 0;
      } else {
        currentFrame = Math.floor(this.animationFrame) % anim.frames;
        frameIndex = anim.startFrame + currentFrame;
      }

      // --- Calculate row & column in grid ---
      const col = frameIndex % columns;
      const row = Math.floor(frameIndex / columns);
      const srcX = col * frameWidth;
      const srcY = row * frameHeight;

      ctx.drawImage(
        this.spriteSheet,
        srcX,
        srcY,
        frameWidth,
        frameHeight,
        Math.round(this.x),
        Math.round(this.y),
        this.width,
        this.height
      );
    }

    ctx.restore();
  }

  getCollisionBox() {
    // Use individual hitbox dimensions
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y + this.hitboxOffsetY,
      width: this.hitboxWidth,
      height: this.hitboxHeight,
    };
  }
}

// Update base position for scrolling
function updateBase() {
  baseX -= gameState.gameSpeed;
  // Reset when one full image has scrolled off screen
  // Add the width back to create seamless loop
  if (images.base.complete && baseX <= -images.base.width) {
    baseX += images.base.width;
  }
}

// Obstacle Class
class Obstacle {
  constructor(type) {
    this.type = type; // 'priest', 'bird', or 'mouse'
    this.spriteSheet = null;
    this.spriteLoaded = false;
    this.animationFrame = 0;
    this.animationSpeed = 0.03; // Slower animation speed
    this.hasCollided = false; // Track if collision occurred

    // Set dimensions and position based on type
    switch (type) {
      case "bird":
        this.width = 80;
        this.height = 80;
        this.y = CONFIG.groundLevel - 30; // Lower position, easier to catch at jump
        this.color = "#FF6B6B";
        this.isCatchable = true; // Can be caught for points
        // Hitbox adjustments: offsetX, offsetY, hitboxWidth, hitboxHeight
        this.hitboxOffsetX = 15;
        this.hitboxOffsetY = 20;
        this.hitboxWidth = 50; // 80 - 30 = 50
        this.hitboxHeight = 50;
        this.spriteSheet = preloadedSprites.bird;
        this.spriteLoaded = preloadedSprites.bird.complete;
        break;
      case "priest":
        this.width = 200;
        this.height = 200;
        this.y = CONFIG.groundLevel + 100; // At Billy's ground level
        this.color = "#000000";
        this.isCatchable = false; // Causes death
        // Hitbox adjustments: vertical rectangle
        this.hitboxOffsetX = 80; // More horizontal offset
        this.hitboxOffsetY = 80; // Less vertical offset
        this.hitboxWidth = 80; // Narrower
        this.hitboxHeight = 120; // Taller
        this.spriteSheet = preloadedSprites.priest;
        this.spriteLoaded = preloadedSprites.priest.complete;
        break;
      case "mouse":
        this.width = 80;
        this.height = 80;
        this.y = CONFIG.groundLevel + 100; // At Billy's ground level
        this.color = "#808080";
        this.isCatchable = true; // Can be caught for points
        // Hitbox adjustments
        this.hitboxOffsetX = 15;
        this.hitboxOffsetY = 50;
        this.hitboxWidth = 55;
        this.hitboxHeight = 30;
        this.spriteSheet = preloadedSprites.mouse;
        this.spriteLoaded = preloadedSprites.mouse.complete;
        break;
      case "treat":
        // Original resolution: 768x500, aspect ratio = 1.536
        this.width = 50;
        this.height = Math.round(50 / 1.536); // 32 to maintain aspect ratio
        this.y = CONFIG.groundLevel + 100; // At Billy's ground level
        this.color = "#FFD700";
        this.isCatchable = true; // Can be caught
        this.isTreat = true; // Special flag for treat powerup
        // Hitbox adjustments
        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
        this.hitboxWidth = 50;
        this.hitboxHeight = 32; // Adjusted for aspect ratio
        this.spriteSheet = preloadedSprites.treat;
        this.spriteLoaded = preloadedSprites.treat.complete;
        break;
    }

    // Spawn further off-screen for mobile performance (300px buffer)
    this.x = CONFIG.canvas.width + 300;
    this.speed = gameState.gameSpeed;
  }

  loadSprite(src) {
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    this.spriteSheet.onerror = () => {};
    this.spriteSheet.src = src;
  }

  update() {
    this.x -= this.speed;
    // Update animation frame
    this.animationFrame += this.animationSpeed;
  }

  draw() {
    ctx.save();

    if (this.spriteLoaded && this.spriteSheet.complete) {
      if (this.isTreat) {
        // Treat is a single frame image, no animation
        ctx.drawImage(
          this.spriteSheet,
          this.x,
          this.y - this.height,
          this.width,
          this.height
        );
      } else {
        // Sprite sheet: 3 frames, 1 row, 512x512 per frame
        // Frames 0-1: normal animation
        // Frame 2: collision/hit frame
        const frameWidth = 512;
        const frameHeight = 512;

        let currentFrame;
        if (this.hasCollided) {
          // Show collision frame (frame 2)
          currentFrame = 2;
        } else {
          // Normal animation: cycle through frames 0-1
          currentFrame = Math.floor(this.animationFrame) % 2;
        }

        const srcX = currentFrame * frameWidth;
        const srcY = 0;

        // Flip all obstacles horizontally to face Billy
        ctx.save();
        ctx.translate(this.x + this.width, this.y - this.height);
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.spriteSheet,
          srcX,
          srcY,
          frameWidth,
          frameHeight,
          0,
          0,
          this.width,
          this.height
        );
        ctx.restore();
      }
    }

    ctx.restore();
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }

  getCollisionBox() {
    // Use individual hitbox dimensions for each obstacle type
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y - this.height + this.hitboxOffsetY,
      width: this.hitboxWidth,
      height: this.hitboxHeight,
    };
  }
}

// Collision Detection
function checkCollision(box1, box2) {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
}

// Audio Assets
const audio = {
  jump: new Audio(swooshSrc),
  point: new Audio(pointSrc),
  hit: new Audio(hitSrc),
  die: new Audio(dieSrc),
};
// Preload and unlock audio for mobile
let audioUnlocked = false;
Object.values(audio).forEach((sound) => {
  sound.preload = "auto";
  sound.load();
});

function unlockAudio() {
  if (audioUnlocked) return;
  Object.values(audio).forEach((sound) => {
    sound
      .play()
      .then(() => {
        sound.pause();
        sound.currentTime = 0;
      })
      .catch(() => {});
  });
  audioUnlocked = true;
}
// Image Assets
const images = {
  background: new Image(),
  base: new Image(),
  numbers: [],
};

// Preload obstacle sprites for better mobile performance
const preloadedSprites = {
  bird: new Image(),
  priest: new Image(),
  mouse: new Image(),
  treat: new Image(),
};

// Load preloaded sprites
preloadedSprites.bird.src = birdSpriteSrc;
preloadedSprites.priest.src = priestSpriteSrc;
preloadedSprites.mouse.src = mouseSpriteSrc;
preloadedSprites.treat.src = treatSpriteSrc;

// Use night background if it's nighttime (6 PM - 6 AM)
const currentHour = new Date().getHours();
const isNightTime = currentHour >= 18 || currentHour < 6;
images.background.src = isNightTime ? backgroundNightSrc : backgroundDaySrc;

images.base.src = baseSrc;
// Load number sprites (0-9)
const numberSprites = [
  num0Src,
  num1Src,
  num2Src,
  num3Src,
  num4Src,
  num5Src,
  num6Src,
  num7Src,
  num8Src,
  num9Src,
];
for (let i = 0; i <= 9; i++) {
  const img = new Image();
  img.src = numberSprites[i];
  images.numbers[i] = img;
}

// Initialize Game
function init() {
  billy = new Billy();
  // Load Billy sprite sheets from sprites folder
  billy.loadSprite(billySpriteSrc);
  billy.loadIdleSprite(billyIdleSpriteSrc);

  obstacles = [];
  gameState.score = 0;
  gameState.gameSpeed = CONFIG.gameSpeed;
  gameState.frameCount = 0;
  lastObstacleTime = Date.now();

  document.getElementById("highScore").textContent = gameState.highScore;
}

// Spawn Obstacles
function spawnObstacle() {
  const now = Date.now();
  const timeSinceLastObstacle = now - lastObstacleTime;
  const spawnDelay =
    CONFIG.obstacleSpawnInterval +
    (Math.random() - 0.5) * CONFIG.obstacleSpawnVariance;

  if (timeSinceLastObstacle > spawnDelay) {
    // Check if last obstacle is far enough away (minimum 400px spacing)
    const minSpacing = 400;
    const lastObstacle = obstacles[obstacles.length - 1];

    if (lastObstacle && lastObstacle.x > CONFIG.canvas.width - minSpacing) {
      // Last obstacle is still too close to spawn point, skip this spawn
      return;
    }

    let randomType;

    // 15% chance to spawn treat, 85% chance for regular obstacles
    if (Math.random() < CONFIG.treatSpawnChance) {
      randomType = "treat";
    } else {
      const types = ["priest", "bird", "mouse"];
      randomType = types[Math.floor(Math.random() * types.length)];
    }

    const obstacle = new Obstacle(randomType);
    obstacles.push(obstacle);
    lastObstacleTime = now;
  }
}

// Update Game
function update() {
  // Always update Billy animation frame (even on start screen for idle animation)
  if (!gameState.isRunning && isStartScreen()) {
    billy.currentAnimation = "idle";
    const anim = billy.sprites[billy.currentAnimation];
    billy.animationFrame += anim.speed;
    return;
  }

  if (!gameState.isRunning || gameState.isPaused) return;

  gameState.frameCount++;

  // Update Billy
  billy.update();

  // Update scrolling ground
  updateBase();

  // Spawn obstacles
  spawnObstacle();

  // Update obstacles
  obstacles.forEach((obstacle) => {
    obstacle.speed = gameState.gameSpeed;
    obstacle.update();
  });

  // Remove off-screen obstacles
  obstacles = obstacles.filter((obstacle) => !obstacle.isOffScreen());

  // Check collisions
  const billyBox = billy.getCollisionBox();
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    const obstacleBox = obstacle.getCollisionBox();
    if (checkCollision(billyBox, obstacleBox) && !obstacle.hasCollided) {
      if (obstacle.isCatchable) {
        obstacle.hasCollided = true; // Mark as collided to prevent multiple scoring

        if (obstacle.isTreat) {
          // Caught a treat - 5 points and slow down the game!
          gameState.score += 5;
          gameState.gameSpeed = CONFIG.gameSpeed; // Reset speed to initial value
          if (!gameState.isMuted && audioUnlocked) {
            audio.point.currentTime = 0;
            audio.point.play().catch(() => {});
          }
          // Remove after a brief delay to show collision frame
          setTimeout(() => {
            const index = obstacles.indexOf(obstacle);
            if (index > -1) obstacles.splice(index, 1);
          }, 100);
        } else {
          // Caught a bird or mouse - 1 point!
          gameState.score += 1;
          if (!gameState.isMuted && audioUnlocked) {
            audio.point.currentTime = 0;
            audio.point.play().catch(() => {});
          }
          // Remove after a brief delay to show collision frame
          setTimeout(() => {
            const index = obstacles.indexOf(obstacle);
            if (index > -1) obstacles.splice(index, 1);
          }, 100);
        }
      } else {
        // Hit a priest - game over!
        obstacle.hasCollided = true; // Show collision frame

        // Put Billy on the ground if mid-air
        billy.y = CONFIG.groundLevel;
        billy.velocityY = 0;
        billy.isJumping = false;

        billy.currentAnimation = "hit"; // Trigger Billy's hit animation
        billy.animationFrame = 0; // Reset to start of hit animation

        if (!gameState.isMuted && audioUnlocked) {
          audio.hit.currentTime = 0;
          audio.hit.play().catch(() => {});
          setTimeout(() => {
            audio.die.currentTime = 0;
            audio.die.play().catch(() => {});
          }, 100);
        }

        // Delay game over to show hit animation
        setTimeout(() => {
          gameOver();
        }, 200);

        gameState.isRunning = false; // Stop game updates immediately
        return;
      }
    }
  }

  // Update score display (now handled by drawScore() in draw function)
  // No need to update DOM element

  // Increase speed gradually
  gameState.gameSpeed += CONFIG.speedIncrement;
}

// Draw Game
function drawGround() {
  const groundY = CONFIG.groundLevel + billy.height;

  // Draw Flappy Bird base sprite (scrolling ground) at the bottom
  if (images.base.complete) {
    const baseHeight = 112; // Standard Flappy Bird base height
    const baseY = CONFIG.canvas.height - baseHeight; // Position at bottom of screen
    const imageWidth = images.base.width;
    const overlap = 2; // Overlap by 2px to hide seams

    // Draw multiple copies to cover the entire screen width
    const numCopies = Math.ceil(CONFIG.canvas.width / imageWidth) + 1;
    for (let i = 0; i < numCopies; i++) {
      ctx.drawImage(
        images.base,
        baseX + i * (imageWidth - overlap),
        baseY,
        imageWidth,
        baseHeight
      );
    }
  } else {
    // Fallback if image not loaded
    ctx.strokeStyle = "#8B6F47";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CONFIG.canvas.width, groundY);
    ctx.stroke();
  }
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  // Draw Flappy Bird background
  if (images.background.complete) {
    // Scale background to fit canvas
    ctx.drawImage(
      images.background,
      0,
      0,
      CONFIG.canvas.width,
      CONFIG.canvas.height
    );
  } else {
    // Fallback gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  }

  // Draw ground
  drawGround();

  // Draw game objects
  billy.draw();
  obstacles.forEach((obstacle) => obstacle.draw());

  // Draw score using number sprites
  // Draw score (only when game is running or after game over)
  if (!isStartScreen()) {
    drawScore();
  }
}

// Draw score using sprite numbers
function drawScore() {
  const scoreStr = gameState.score.toString();
  const digitWidth = 24; // Width of each number sprite
  const digitHeight = 36; // Height of each number sprite
  const spacing = 4;
  const totalWidth = scoreStr.length * (digitWidth + spacing) - spacing;
  const startX = (CONFIG.canvas.width - totalWidth) / 2;
  const startY = 50;

  for (let i = 0; i < scoreStr.length; i++) {
    const digit = parseInt(scoreStr[i]);
    const img = images.numbers[digit];
    if (img && img.complete) {
      ctx.drawImage(
        img,
        startX + i * (digitWidth + spacing),
        startY,
        digitWidth,
        digitHeight
      );
    }
  }
}

// Game Loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Game Over
function gameOver() {
  gameState.isRunning = false;
  gameState.isPaused = false;

  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    setCookie("billyHighScore", gameState.highScore);
  }

  // Show game over screen
  document.getElementById("finalScore").textContent = gameState.score;
  document.getElementById("highScore").textContent = gameState.highScore;
  document.getElementById("gameOverScreen").classList.remove("hidden");
  document.getElementById("hud").classList.add("hidden");
  document.getElementById("pauseButton").classList.add("hidden");
}

// Start Game
function startGame() {
  // Unlock audio on first interaction
  unlockAudio();

  init();
  gameState.isRunning = true;
  gameState.isPaused = false;
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.add("hidden");
  document.getElementById("hud").classList.add("hidden"); // Hide text HUD
  document.getElementById("pauseButton").classList.remove("hidden");
}

// Toggle Pause
function togglePause() {
  if (!gameState.isRunning) return;

  gameState.isPaused = !gameState.isPaused;
  const pauseBtn = document.getElementById("pauseButton");
  const pauseImg = pauseBtn.querySelector("img");
  if (pauseImg) {
    pauseImg.style.transform = gameState.isPaused;
  }
}

// Check if game is in start state
function isStartScreen() {
  return (
    !gameState.isRunning && gameState.score === 0 && obstacles.length === 0
  );
}

// Event Listeners
document.getElementById("restartButton").addEventListener("click", startGame);

// Jump controls - space starts game or makes Billy jump
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (isStartScreen()) {
      startGame();
    } else if (gameState.isRunning) {
      billy.jump();
    }
  }
});

// Click anywhere starts game or makes Billy jump
canvas.addEventListener("click", () => {
  if (isStartScreen()) {
    startGame();
  } else if (gameState.isRunning) {
    billy.jump();
  }
});

// Touch support for mobile
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (isStartScreen()) {
    startGame();
  } else if (gameState.isRunning) {
    billy.jump();
  }
});

// Pause button
document.getElementById("pauseButton").addEventListener("click", togglePause);

// Mute button
document.getElementById("muteButton").addEventListener("click", () => {
  gameState.isMuted = !gameState.isMuted;
  const muteBtn = document.getElementById("muteButton");
  const muteImg = muteBtn.querySelector("img");
  if (muteImg) {
    muteImg.src = gameState.isMuted ? volumeOffSrc : volumeUpSrc;
  }
});

// Initialize and start game loop
init();
gameLoop();
