import React from 'react';
import './Navbar.css';

export default function Navbar({ onLinkClick }) {
  // Use arrow functions to pass the page name string to the handler
  return (
    <nav className="navbar">
      <div className="nav-left">
        <a href="#about" onClick={() => onLinkClick('about')}>About</a>
        <a href="#works" onClick={() => onLinkClick('works')}>Works</a>
        <a href="#contact" onClick={() => onLinkClick('contact')}>Contact</a>
      </div>
      <div className="nav-right">
        <a href="#home" onClick={() => onLinkClick('home')}>Home</a>
      </div>
    </nav>
  );
}