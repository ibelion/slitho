# Slitho Web Demo Implementation Plan (Stage 1)

Create a lightweight, ultra-fast web demo for the Godot project `slithosteam` by porting a vertical slice of Stage 1 (Overgrowth) into the existing `slitho` Javascript engine.

## Web Demo Limitations Report

> [!IMPORTANT]
> To ensure the demo is "very small" and high-performance, we are opting for a **JS/Canvas Reimplementation** rather than a direct Godot Web Export.

### Technical Constraints

1.  **Engine Divergence**: Mechanics (like segment physics) must be tuned to feel like the Godot version without the underlying physics engine.
2.  **Asset Conversion**: Shaders and complex particles from Godot will be replaced by lightweight Canvas/Particle-manager equivalents.
3.  **Manual Porting**: Logic changes in the Godot project won't automatically sync to the web demo.

### Performance Benchmarks

- **Target Size**: < 2MB (vs 20MB for Godot export).
- **Load Time**: < 500ms on broadband.
- **Compatibility**: Standard static hosting (GitHub Pages/Cloudflare) without requiring COOP/COEP headers.

## Selected Entities for Porting (Stage 1: Overgrowth)

### 🐍 Snake

- **Lash**: The base snake with standard segment-health mechanics.

> This approach "scraps" the existing heavy `slitho` engine in favor of a consolidated `demo.js` to meet performance targets.

## Proposed Changes

### [NEW] [demo.html](file:///C:/github2/slitho/demo.html)

- Minimal HTML5 structure with one `index.css` import and one `demo.js` import.
- Embedded SVG icons or minimal PNGs for UI.

### [NEW] [demo.js](file:///C:/github2/slitho/demo.js)

- **Engine Core**: Grid-based movement, fixed timestep loop, basic canvas renderer.
- **Entities**: 1 Snake (Lash), 5 Enemies (Rat, Wasp, Spider, Frog, Mantis).
- **Weapons**: 6 Weapons (Body Whip, Banshee Scream, Homing Missile, Acid Trail, Shock Tail, Phase Dash).
- **Redesign**: Godot-style main menu stack and HUD implemented in pure JS/CSS.

### [Port] Assets

- Port `PixeloidSansBold` and UI icons directly into the demo folder.

## Verification Plan

### Automated Tests

- Browser subagent verification of UI layout (checking element positions and CSS properties).
- Console log audit for system initialization.
- `browser_subagent` will verify:
  - Zero console errors on load at `http://localhost:3000`.
  - All 6 weapons trigger and damage entities.
  - All 5 enemies spawn and interact with the snake.

### Manual Verification

- Visual comparison between Godot screenshots/editor and the web demo.
- Playing the Stage 1 demo to confirm weapon/enemy functionality in the new UI.
  - All 5 enemies spawn and interact with the snake.
- **Real-time Preview**: User can watch changes at `http://localhost:3000`.
- **Cross-Reference**: Side-by-side comparison of "feel" between the Godot build and the Web Demo.
- **Size Audit**: Ensure total transferred bytes remain under the 2MB threshold.
