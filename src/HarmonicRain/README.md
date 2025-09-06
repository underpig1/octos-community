# Harmonic Rain

An interactive physics-based musical experience where falling balls create harmonic sounds by colliding with strings. The project has been completely modularized for better maintainability and extensibility.

## Features

- **Physics Simulation**: Realistic ball physics with gravity and collision detection
- **Musical Strings**: Create strings that produce piano-like tones based on length
- **Interactive Creation**: Drag to create strings, click to delete, drag endpoints to tune
- **Visual Effects**: String oscillation visualization with multiple layers
- **Audio Synthesis**: Web Audio API-based piano-like sound generation
- **Responsive Controls**: Adjustable gravity, spawn rate, and visual intensity

## Getting Started

### Prerequisites

- Modern web browser with ES6 module support
- Node.js 14+ (for development server)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Project

#### Development Server
```bash
npm run dev
```
This starts a local server at `http://localhost:8080`

#### Production
Simply serve the files with any static file server. The project uses ES6 modules, so no build step is required.

## Usage

### Controls

- **Mouse**: 
  - Left click and drag to create strings
  - Left click near strings to delete them
  - Drag string endpoints to adjust tuning
  - Drag spawner to move ball spawn location
- **Keyboard**:
  - `Esc`: Cancel string placement
  - `C`: Clear all strings
  - `M`: Toggle audio mute
  - `H`: Toggle help display
  - `R`: Reset simulation

### Creating Musical Strings

1. Click and drag on the canvas to create a string
2. String length determines the musical note (shorter = higher pitch)
3. Use the mouse wheel on string labels to fine-tune the pitch
4. Strings will oscillate visually when hit by balls

### Audio Features

- Piano-like sound synthesis using Web Audio API
- Reverb effects for spatial depth
- Dynamic velocity based on ball speed
- Stereo panning based on collision position

## Configuration

Key parameters can be adjusted in the options panel:

- **Gravity**: Controls ball fall speed (200-2000 px/s²)
- **Spawn Interval**: Ball spawn rate (100-2000 ms)
- **Visual Intensity**: String oscillation amplitude (0-200%)

## Browser Compatibility

- Chrome 61+
- Firefox 60+
- Safari 10.1+
- Edge 16+

## Development

### Adding New Features

1. **New Physics**: Extend `PhysicsEngine.js`
2. **New Audio**: Extend `AudioManager.js`
3. **New Visual Effects**: Extend `Renderer.js`
4. **New Input Methods**: Extend `InputManager.js`
5. **New UI Elements**: Extend `UIManager.js`

### Code Style

- ES6+ syntax with modules
- Class-based architecture
- Consistent naming conventions
- Clear separation of concerns

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Acknowledgments

- Web Audio API for audio synthesis
- Canvas API for rendering
- ES6 modules for clean architecture
