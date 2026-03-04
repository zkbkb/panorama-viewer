# 360° Panorama Viewer

[![Cloudflare Pages](https://img.shields.io/website?url=https%3A%2F%2Fpanorama-view.pages.dev&label=Cloudflare%20Pages&logo=cloudflare&logoColor=white)](https://panorama-view.pages.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)

A mobile-first web application for viewing equirectangular panorama images in immersive 360°. Upload a panorama photo, explore it by dragging or using your phone's gyroscope.

**Live Demo**: [https://panorama-view.pages.dev](https://panorama-view.pages.dev)

## Features

- **Upload & View** — Drag-and-drop or click to upload equirectangular panorama images (JPG, PNG, WebP)
- **360° Rendering** — Smooth panoramic viewing on an inverted sphere with Three.js
- **Touch & Mouse** — Drag to pan, pinch or scroll to zoom (FOV 30°–110°)
- **Gyroscope** — Enable device orientation tracking to explore by physically moving your phone (iOS permission handled automatically)
- **Hybrid Input** — Gyroscope and touch drag work together; drag to adjust, tap recenter to reset
- **Fullscreen** — Fullscreen toggle on desktop browsers
- **Mobile-First** — Dark theme, responsive layout, 44px+ touch targets

## Usage Guide

1. **Upload a panorama** — Open the app and drag-and-drop (or click to select) an equirectangular panorama image.
2. **Look around** — Drag with your finger or mouse to pan the view. Pinch (mobile) or scroll (desktop) to zoom in/out.
3. **Enable gyroscope** (mobile) — Tap the gyroscope button (bottom-right) to explore by moving your phone. On iOS you'll be prompted to grant motion permission.
4. **Drag to adjust** — While gyroscope is active, you can still drag to fine-tune the viewing direction.
5. **Recenter** — Tap the crosshair button to snap the view back to the panorama center.
6. **Horizon lock** — Tap the level icon to keep the horizon perfectly level, preventing roll when tilting your phone.
7. **Fullscreen** (desktop) — Tap the expand button in the top-right corner for an immersive fullscreen experience.

## Tech Stack

- [Vite](https://vite.dev/) — Build tool
- [React 18](https://react.dev/) — UI framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling
- [Three.js](https://threejs.org/) — WebGL 3D rendering
- [Cloudflare Pages](https://pages.cloudflare.com/) — Hosting

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

[MIT](./LICENSE)
