import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-black/50" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <span className="font-serif font-bold text-primary-foreground text-lg">A</span>
              </div>
              <span className="font-serif text-xl font-bold text-foreground tracking-wider">
                IMPERIAL ART GALLERY
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              The premium platform for digital art ownership. License-based, secure, and globally accessible.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-serif text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/gallery" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-serif text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/license-agreement" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  License Agreement
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground text-sm cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm cursor-not-allowed">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-muted-foreground text-sm cursor-not-allowed">
                  Help Center
                </span>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Imperial Art Gallery. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="text-muted-foreground text-xs font-mono">
              Powered by Blockchain Technology
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
