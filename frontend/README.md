# ExplainCanvas Frontend

React-based interactive canvas application for ExplainCanvas.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

App will open at http://localhost:3000

## Features

- **Drawing Tools**: Pencil, Rectangle, Circle, Arrow, Line, Text, Eraser, Laser Pointer
- **Color Palette**: 8 preset colors
- **Stroke Width**: Thin, Medium, Thick options
- **Undo/Redo**: Full drawing history
- **Recording**: Canvas + audio capture
- **AI Chat**: Context-aware conversations

## Build for Production

```bash
npm run build
```

Creates optimized production build in `build/` folder.

## Browser Requirements

- Modern browser with MediaRecorder API support
- Microphone access for recording
- Recommended: Chrome, Edge, Firefox (latest versions)
