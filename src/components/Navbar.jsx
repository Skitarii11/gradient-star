import React from 'react';
import './Navbar.css';

export default function Navbar({ onLinkClick }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <a href="#about" onClick={onLinkClick}>About</a>
        <a href="#works" onClick={onLinkClick}>Works</a>
        <a href="#contact" onClick={onLinkClick}>Contact</a>
      </div>
      <div className="nav-right">
        <a href="#home" onClick={onLinkClick}>Home</a>
      </div>
    </nav>
  );
}