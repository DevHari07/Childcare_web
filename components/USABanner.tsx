'use client';

import React, { useState } from 'react';

export default function USABanner() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="usa-banner" aria-label="Official website of the State of North Dakota">
      {/* <div className="usa-banner-header-container">
        <div className="usa-banner-header">
          <svg className="usa-banner-flag" viewBox="0 0 16 11" width="16" height="11" aria-hidden="true">
            <rect fill="#ffffff" width="16" height="11" />
            <rect fill="#b22234" width="16" height="1" />
            <rect fill="#b22234" y="2" width="16" height="1" />
            <rect fill="#b22234" y="4" width="16" height="1" />
            <rect fill="#b22234" y="6" width="16" height="1" />
            <rect fill="#b22234" y="8" width="16" height="1" />
            <rect fill="#b22234" y="10" width="16" height="1" />
            <rect fill="#3c3b6e" width="7" height="6" />
            <circle cx="1.5" cy="1" r="0.2" fill="#ffffff" />
            <circle cx="3.5" cy="1" r="0.2" fill="#ffffff" />
            <circle cx="5.5" cy="1" r="0.2" fill="#ffffff" />
            <circle cx="2.5" cy="2" r="0.2" fill="#ffffff" />
            <circle cx="4.5" cy="2" r="0.2" fill="#ffffff" />
            <circle cx="1.5" cy="3" r="0.2" fill="#ffffff" />
            <circle cx="3.5" cy="3" r="0.2" fill="#ffffff" />
            <circle cx="5.5" cy="3" r="0.2" fill="#ffffff" />
            <circle cx="2.5" cy="4" r="0.2" fill="#ffffff" />
            <circle cx="4.5" cy="4" r="0.2" fill="#ffffff" />
            <circle cx="1.5" cy="5" r="0.2" fill="#ffffff" />
            <circle cx="3.5" cy="5" r="0.2" fill="#ffffff" />
            <circle cx="5.5" cy="5" r="0.2" fill="#ffffff" />
          </svg>
          <span className="usa-banner-text">
            An official website of the State of North Dakota.
            <button 
              type="button" 
              className="usa-banner-toggle"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls="usa-banner-details"
            >
              Here's how you know
              <svg 
                className={`usa-banner-toggle-icon ${isOpen ? 'open' : ''}`} 
                viewBox="0 0 24 24" 
                width="16" 
                height="16"
              >
                <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
              </svg>
            </button>
          </span>
        </div>
      </div> */}

      <div 
        className={`usa-banner-details ${isOpen ? 'open' : ''}`} 
        id="usa-banner-details"
        aria-hidden={!isOpen}
      >
        <div className="usa-banner-details-grid">
          <div className="usa-banner-detail-item">
            <div className="usa-banner-detail-icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.6 18.7,16.9 16.8,18.4L15.4,17C16.4,15.7 17,14 17,12A5,5 0 0,0 12,7A5,5 0 0,0 7,12C7,14 7.6,15.7 8.6,17L7.2,18.4C5.3,16.9 4,14.6 4,12A8,8 0 0,1 12,4M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z" />
              </svg>
            </div>
            <div className="usa-banner-detail-text">
              <strong>Official websites use .gov</strong>
              <p>A <strong>.gov</strong> website belongs to an official government organization in the State of North Dakota or the United States.</p>
            </div>
          </div>

          <div className="usa-banner-detail-item">
            <div className="usa-banner-detail-icon-wrapper">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H9V6A3,3 0 0,1 12,3A3,3 0 0,1 15,6V8H18M12,5A1,1 0 0,0 11,6V8H13V6A1,1 0 0,0 12,5Z" />
              </svg>
            </div>
            <div className="usa-banner-detail-text">
              <strong>Secure .gov websites use HTTPS</strong>
              <p>A lock ( <span className="usa-banner-lock-icon">🔒</span> ) or <strong>https://</strong> means you've safely connected to the .gov website. Share sensitive information only on official, secure websites.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
