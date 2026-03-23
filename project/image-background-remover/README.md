# Image Background Remover

A web app to remove image backgrounds using Remove.bg API and Next.js.

## Features

- Upload images and remove backgrounds automatically
- Preview results with transparent background
- Download processed images as PNG
- No storage - all processing in memory
- Fast and secure

## Tech Stack

- Frontend: Next.js 15 + React 19
- Styling: Tailwind CSS
- API: Remove.bg
- Language: TypeScript

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file and add your Remove.bg API key:
   ```
   REMOVEBG_API_KEY=your_api_key_here
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## Get Remove.bg API Key

Visit [https://www.remove.bg/api](https://www.remove.bg/api) to get your free API key.
