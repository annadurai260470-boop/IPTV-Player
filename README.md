# IPTV Player

A modern, full-stack IPTV streaming application with React frontend and Express backend.

## Features

✅ **Live TV Channels** - Stream live television channels  
✅ **Movies** - Browse and watch movies  
✅ **TV Series** - Watch complete TV series with episode management  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Video Player** - Built-in video player with controls  
✅ **Modern UI** - Dark theme with red accent colors  

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ChannelGrid.tsx    - Grid component for channels/movies/series
│   │   └── VideoPlayer.tsx    - Full-featured video player
│   ├── api/
│   │   └── index.ts           - API client for backend
│   ├── types/
│   │   └── index.ts           - TypeScript type definitions
│   ├── styles/
│   │   ├── ChannelGrid.css    - Grid styling
│   │   ├── VideoPlayer.css    - Player styling
│   │   └── App.css            - App styling
│   ├── App.tsx                - Main app component
│   ├── main.tsx               - Entry point
│   └── vite-env.d.ts          - Vite environment types
├── server.js                  - Express backend
├── vite.config.ts             - Vite configuration
├── tsconfig.json              - TypeScript configuration
└── package.json               - Dependencies
```

## Installation

```bash
npm install
```

## Development

Start both frontend (Vite) and backend (Express) servers:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client  # Frontend on http://localhost:3000
npm run dev:server  # Backend on http://localhost:5000
```

## Production Build

```bash
npm run build
```

## Start Production Server

```bash
npm start
```

The application will be served on `http://localhost:5000`

## API Endpoints

### Channels
- `GET /channels` - Get list of live TV channels

### Movies
- `GET /movies` - Get list of available movies

### Series
- `GET /series` - Get list of TV series with episodes

## Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:5000
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, CSS3
- **Backend**: Node.js, Express, CORS
- **Video**: HTML5 Video Element with custom controls

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Author

IPTV Player Team
