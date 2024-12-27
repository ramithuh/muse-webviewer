"use client"
import React, { useState, useEffect } from 'react';
import { Card } from './card'

import board from '../../../public/board/contents.json'


// Sample board structure - replace this with your actual board data
const DEFAULT_BOARD = {
  root: "root-id",
  documents: {
    "root-id": {
      type: "board",
      label: "Example Board",
      cards: []
    }
  }
};

// Helper function to find parent relationships in the board
const findParents = (board, card) => {
  if (!board || !card) return [];
  const currentLevel = card?.cards?.map(x => [x.document_id, card.id]) ?? [];
  const nextLevel = currentLevel.flatMap(([x, _]) => findParents(board, {...board.documents[x], id: x}));
  return currentLevel.concat(nextLevel);
};

// Enhanced version of the withParentLink HOC
const withParentLink = (Comp) => ({id, recurse = 0, board, ...rest}) => {
  if (!board || !id || recurse !== 0 || id === board.root) {
    return <Comp id={id} recurse={recurse} board={board} {...rest} />;
  }
  
  const parents = Object.fromEntries(findParents(board, {...board.documents[board.root], id: board.root}));
  const parent = parents[id];
  
  return (
    <div className="relative">
      <div className="absolute right-4 top-0 z-50">
        <button 
          onClick={() => window.location.href = parent === board.root ? "/" : `/${parent}`}
          className="px-3 py-1 text-sm bg-white rounded-md shadow hover:bg-gray-50"
        >
          ↑ Parent
        </button>
      </div>
      <Comp id={id} recurse={recurse} board={board} {...rest} />
    </div>
  );
};

// Component for rendering different types of content
const ContentRenderer = withParentLink(({ type, content, recurse, size, board }) => {
  const [fileContent, setFileContent] = useState(null);
  
  useEffect(() => {
    if (type === 'text' && content?.original_file) {
      fetch(`/board/files/${content.original_file}`)
        .then(resp => resp.text())
        .then(setFileContent)
        .catch(console.error);
    }
  }, [type, content]);

  const sizeStyle = recurse === 0 ? {} : {
    width: size?.width || '100%',
    height: size?.height || '100%'
  };

  switch (type) {
    case 'image':
      return content?.original_file ? (
        <img 
          className="absolute object-contain"
          style={sizeStyle}
          src={`/board/files/${content.original_file}`}
          alt={content.label || 'Image'}
        />
      ) : null;
    case 'text':
      return (
        <div className="font-sans text-lg leading-relaxed">
          {fileContent}
        </div>
      );
    case 'pdf':
      return content?.original_file ? (
        <img 
          style={sizeStyle}
          src={`/board/files/${content.original_file}-0.png`}
          alt={content.label || 'PDF Preview'}
        />
      ) : null;
    case 'url':
      return content?.url ? (
        <a 
          href={content.url}
          className="block p-3 text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.label || content.url}
        </a>
      ) : null;
    default:
      return null;
  }
});

// Main board component
const MuseBoard = ({ boardData = board }) => {
  const [currentBoardId, setCurrentBoardId] = useState(boardData.root);
  const currentBoard = boardData.documents[currentBoardId];

  if (!boardData || !currentBoard) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="p-4">
          <p className="text-gray-600">No board data available</p>
        </Card>
      </div>
    );
  }

  const renderCard = (card, index) => {
    if (!card || !card.document_id) return null;
    
    const cardInfo = boardData.documents[card.document_id];
    if (!cardInfo) return null;

    const scale = cardInfo.snapshot_scale === 0 ? 0.1 : cardInfo.snapshot_scale;
    
    return (
      <Card
        key={card.document_id}
        className="absolute overflow-hidden bg-white shadow-lg cursor-pointer"
        style={{
          left: card.position_x || 0,
          top: card.position_y || 0,
          width: card.size_width || 200,
          height: card.size_height || 200,
          zIndex: card.z || index
        }}
        onClick={() => cardInfo.type !== 'url' && setCurrentBoardId(card.document_id)}
      >
        {cardInfo.label && (
          <div className="absolute top-0 left-0 px-2 py-1 text-sm truncate bg-white/80">
            {cardInfo.label}
          </div>
        )}
        <ContentRenderer 
          type={cardInfo.type}
          content={cardInfo}
          recurse={1}
          board={boardData}
          size={{
            width: card.size_width,
            height: card.size_height
          }}
        />
      </Card>
    );
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {currentBoard.label && (
        <h1 className="absolute top-4 left-4 text-xl font-semibold text-gray-800">
          {currentBoard.label}
        </h1>
      )}
      <div className="relative w-full h-full">
        {currentBoard.cards?.map(renderCard)}
      </div>
    </div>
  );
};

export { MuseBoard }