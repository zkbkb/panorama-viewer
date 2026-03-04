# 360° Panorama Viewer

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
