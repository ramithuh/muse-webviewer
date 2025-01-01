# Muse Webviewer

A web-based viewer for Muse app exports, built with Next.js and React. This tool allows you to view and interact with Muse boards directly in your browser.

[![Demo](https://img.shields.io/badge/Demo-muse.ramith.fyi-blue)](https://muse.ramith.fyi)
[![Discord](https://img.shields.io/badge/Discord-Join_Discussion-7289da?logo=discord&logoColor=white)](https://discord.com/channels/999340856781848767/1310636960586399857)

## Features

- **Board Visualization**: Renders Muse boards with their original layout and connections
- **Interactive Navigation**: Click through nested boards and documents
- **Support for Multiple Content Types**:
  - PDF documents with page previews
  - Text notes with formatting
  - URLs with preview cards
  - Images and ink drawings
  - Nested boards with proper scaling
- **Breadcrumb Navigation**: Easy navigation through board hierarchy
- **Edge Runtime**: Optimized for Edge Runtime

## Getting Started

```
# Clone the repository
git clone https://github.com/ramithuh/muse-webviewer

# Install dependencies
npm install

# Run the development server
npm run dev
```

## Usage

1. Export your Muse board using the Muse app
2. Place the exported files in the `/public` directory
3. Start the development server
4. Open http://localhost:3000 in your browser

## Project Structure

```
muse-webviewer/
├── app/                 # Next.js app directory
├── public/             # Static files and Muse exports
├── src/
│   ├── components/     # React components
│   └── lib/           # Utility functions
└── types/             # TypeScript definitions
```

## Technical Details

- Built with Next.js 14 and React
- TypeScript for type safety
- PDF.js for PDF rendering
- SVG-based connection lines
- Efficient board scaling and rendering
- Edge-optimized build configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
```
