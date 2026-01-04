# Billy's Adventure - Endless Runner Game

A Chrome dino-style endless runner game featuring Billy the cat!

## Features

- **Endless runner gameplay** with increasing difficulty
- **Three obstacle types**: Priest, Bird, and Mouse
- **Sprite animation support** for custom cat sprite sheets
- **Score tracking** with high score persistence
- **Responsive controls**: Space bar, mouse click, or touch
- **Beautiful graphics** with animated backgrounds and clouds

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the Vite development server at `http://localhost:3000` with hot module reloading.

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## How to Play

1. Start the dev server with `npm run dev` (or open `index.html` directly)
2. Click "Start Game" or press any key
3. Press **SPACE**, **CLICK**, or **TAP** to make Billy jump
4. Avoid the obstacles (priest, bird, mouse)
5. Try to beat your high score!

## Adding Your Assets

### Billy Sprite Sheet

Place your Billy spri # Main HTML file
├── style.css # Game styling
├── game.js # Game logic
├── package.json # Dependencies
├── vite.config.js # Vite configuration
├── .gitignore # Git ignore rules
├── README.md # This file
└── assets/ eet format\*\*:

- Horizontal sprite sheet (8 frames for running animation)
- All frames should be the same size
- Transparent background recommended

### Obstacle Images

Place your obstacle images in the `assets` folder:

- `assets/priest.png` - The priest character
- `assets/bird.png` - The flying bird
- `assets/mouse.png` - The running mouse

**Image recommendations**:

- PNG format with transparent backgrounds
- Appropriate sizes:
  - Priest: ~45x60 pixels
  - Bird: ~40x30 pixels
  - Mouse: ~35x25 pixels

## Project Structure

```
billy-game/
├── index.html       # Main HTML file
├── style.css        # Game styling
├── game.js          # Game logic
├── README.md        # This file
└── assets/          # Place your images here
    ├── billy-sprite.png
    ├── priest.png
    ├── bird.png
    └── mouse.png
```

## Customization

### Adjusting Game Difficulty

Edit the `CONFIG` object in `game.js`:

```javascript
const CONFIG = {
  gravity: 0.6, // Jump gravity
  jumpForce: -12, // Jump height
  gameSpeed: 6, // Initial speed
  speedIncrement: 0.001, // Speed increase rate
  obstacleSpawnInterval: 1500, // Time between obstacles (ms)
};
```

### Changing Sprite Animation

If your sprite sheet has a different number of frames, update line 68 in `game.js`:

```javascript
const currentFrame = Math.floor(this.animationFrame) % 8; // Change 8 to your frame count
```

## Browser Compatibility

Works in all modern browsers:

- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

## Tips

- The game speed gradually increases over time
- Birds fly high, mice run low, priests are in the middle
- Perfect your timing for consecutive obstacles
- High scores are saved in your browser

Enjoy playing with Billy! 🐱
