import React from 'react';

export default function HeroPage({ onStart }) {
  return (
    <div className="hero-page">
      <div className="hero-content">
        <div className="hero-badge animate-fade-up">
          <span className="badge badge-cyan">Intelligent Planning</span>
        </div>
        <h1 className="hero-title animate-fade-up animation-delay-100">
          Your perfect workout, <span className="hero-title-gradient">scientifically matched.</span>
        </h1>
        <p className="hero-subtitle animate-fade-up animation-delay-200">
          Tell us about your fitness level, available equipment, and any injuries -
          we'll build a tailored exercise plan in seconds.
        </p>
        <div className="hero-cta animate-fade-up animation-delay-300">
          <button
            id="get-started-btn"
            className="btn btn-primary btn-lg"
            onClick={onStart}
          >
            Get Started
          </button>
        </div>

        <div className="hero-stats animate-fade-up animation-delay-400">
          <div className="hero-stat">
            <strong>800+</strong>
            <span>Exercises</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <strong>3</strong>
            <span>Fitness Levels</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <strong>Smart</strong>
            <span>Injury Filtering</span>
          </div>
        </div>
      </div>
    </div>
  );
}
