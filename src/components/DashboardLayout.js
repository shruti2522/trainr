import React, { useState, useEffect } from 'react';

export default function DashboardLayout({ children, activeTab, onViewChange, summaryPanel }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`layout-3col animate-fade-in ${!isSidebarOpen && !isMobile ? 'desktop-collapsed' : ''}`}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <a href="/" className="mobile-logo" onClick={(e) => { e.preventDefault(); onViewChange('hero'); }}>
          <span className="sidebar-logo-icon">T</span>
          Trainr
        </a>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && isMobile && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <aside className={`layout-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo" style={{textDecoration: "none", display: isSidebarOpen ? 'flex' : 'none'}} onClick={(e) => { e.preventDefault(); onViewChange('hero'); if(isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-logo-icon">T</span>
            <span className="sidebar-logo-text">Trainr</span>
          </a>
          {isMobile ? (
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          ) : (
            <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
          )}
        </div>
        
        <div className="sidebar-nav">

          <div className="sidebar-section-title">Training</div>
          <div className={`sidebar-link ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => { onViewChange('results'); if(isMobile) setIsSidebarOpen(false); }}>
            {/* Clipboard/list icon for My Plan */}
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
              <rect x="9" y="3" width="6" height="4" rx="1"></rect>
              <line x1="9" y1="12" x2="15" y2="12"></line>
              <line x1="9" y1="16" x2="13" y2="16"></line>
            </svg>
            <span className="sidebar-link-text">My Plan</span>
          </div>
          <div className={`sidebar-link ${activeTab === 'library' ? 'active' : ''}`} onClick={() => { onViewChange('library'); if(isMobile) setIsSidebarOpen(false); }}>
            {/* Running figure icon for Exercise Library */}
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13" cy="4" r="1.5" fill="currentColor" stroke="none"></circle>
              <path d="M8 17l2-5 3 3 2-4"></path>
              <path d="M5.5 14l2.5-6 4 2 2-4 3.5 1.5"></path>
            </svg>
            <span className="sidebar-link-text">Exercise Library</span>
          </div>
          
          <div className="sidebar-section-title">Track</div>
          <div className="sidebar-link">
            {/* Bar chart icon for Progress */}
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="12" width="4" height="9"></rect>
              <rect x="10" y="7" width="4" height="14"></rect>
              <rect x="17" y="3" width="4" height="18"></rect>
              <line x1="2" y1="21" x2="22" y2="21"></line>
            </svg>
            <span className="sidebar-link-text">Progress</span>
          </div>
          <div className="sidebar-link">
            {/* Clock icon for History */}
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="sidebar-link-text">History</span>
          </div>
          <div className="sidebar-link">
            {/* Sliders icon for Customize */}
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
              <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"></circle>
              <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"></circle>
              <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"></circle>
            </svg>
            <span className="sidebar-link-text">Goal</span>
          </div>
        </div>
        
        <div className="sidebar-spacer" />

        <div className={`sidebar-profile ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="profile-avatar">S</div>
          <div className="profile-info">
            <div className="profile-name">Shruti Sharma</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="layout-main">
        {children}
      </main>

      {/* Right Summary Panel (optional) */}
      {summaryPanel && (
        <aside className="layout-summary">
          {summaryPanel}
        </aside>
      )}
    </div>
  );
}
