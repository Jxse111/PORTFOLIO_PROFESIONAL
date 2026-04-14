'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@once-ui-system/core';
import ChatModal from './ChatModal';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return (
    <>
      <Button
        id="floating-chat-button"
        data-border="rounded"
        variant="secondary"
        size="m"
        style={{
          position: 'fixed',
          bottom: isMobile ? '30px' : '20px',
          right: isMobile ? '12px' : '20px',
          zIndex: 1000,
          width: isMobile ? '36px' : '64px',
          height: isMobile ? '36px' : '64px',
          borderRadius: '50%',
          boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.18)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          background: 'var(--page-background)',
          color: 'var(--neutral-on-background-strong)',
          border: '1px solid var(--neutral-alpha-medium)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir chat con Portfol-IA"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={isMobile ? 14 : 24}
          height={isMobile ? 14 : 24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon icon-tabler icons-tabler-outline icon-tabler-brand-line"
          aria-hidden="true"
          style={{ color: 'inherit' }}
        >
          <title>Chat Icon</title>
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M21 10.663c0 -4.224 -4.041 -7.663 -9 -7.663s-9 3.439 -9 7.663c0 3.783 3.201 6.958 7.527 7.56c1.053 .239 .932 .644 .696 2.133c-.039 .238 -.184 .932 .777 .512c.96 -.42 5.18 -3.201 7.073 -5.48c1.304 -1.504 1.927 -3.029 1.927 -4.715v-.01z" />
        </svg>
      </Button>
      {isOpen && <ChatModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
