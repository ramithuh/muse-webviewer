# Muse Webviewer
[![Demo](https://img.shields.io/badge/Demo-muse.ramith.fyi-blue)](https://muse.ramith.fyi)
[![Discord](https://img.shields.io/badge/Discord-Join_Discussion-7289da?logo=discord&logoColor=white)](https://discord.com/channels/999340856781848767/1310636960586399857)

This repo provides a web-based viewer for [Muse](https://museapp.com)* app exports, built with Next.js and React. 

This tool allows you to view and interact with boards created in [Muse](https://museapp.com) directly in your browser.

**_If you are new to Muse, it is an app for iPad and Mac that has been incredibly helpful for people who think well on canvases.
To learn more about that app check my posts below:_**

<p float="left">
  <a href="https://x.com/ramith__/status/1845374809347064309">
    <img src="https://github.com/user-attachments/assets/b9f461b1-8975-41a3-9f39-997dd9f3b3d9" width="38.5%" />
  </a>
  <a href="https://bsky.app/profile/ramith.fyi/post/3ldibkldr722r">
    <img src="https://github.com/user-attachments/assets/94b74f37-2b1f-4b0a-96d5-e003e3d399d5" width="49%" />
  </a>
</p>





## Features

- **Board Visualization**: Renders [Muse](https://museapp.com) boards with their original layout and connections
- **Interactive Navigation**: Click through nested boards and documents, similar to the native [Muse app](https://museapp.com/download) experience
- **Support for Multiple Content Types**:
  - PDF documents with page previews
  - Text notes with formatting
  - URLs with preview cards
  - Images and ink drawings (compatible with [Muse's](https://museapp.com) drawing tools)
  - Nested boards with proper scaling
- **Breadcrumb Navigation**: Easy navigation through board hierarchy

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

1. Export your board using the [Muse app](https://museapp.com/download)
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For discussions, join the [Muse Discord community](https://museapp.com/community) and check out the webviewer thread!

## License

MIT License
