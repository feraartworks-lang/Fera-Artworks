import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Gem } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { path: '/gallery', label: 'Gallery' },
      { path: '/marketplace', label: 'Marketplace' },
      { path: '/how-it-works', label: 'How It Works' },
    ],
    legal: [
      { path: '/license-agreement', label: 'License Agreement' },
      { path: '/privacy-policy', label: 'Privacy Policy' },
      { path: '/terms-of-service', label: 'Terms of Service' },
    ],
    support: [
      { path: '/help-center', label: 'Help Center' },
      { path: '/contact', label: 'Contact Us' },
      { path: '/faq', label: 'FAQ' },
    ],
  };

  return (
    <footer className="relative border-t border-[#D4AF37]/10 bg-[#030303]" data-testid="footer">
      {/* Top Decorative Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-[#D4AF37]/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-6 group">
              <div className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center group-hover:border-[#D4AF37] transition-colors duration-300">
                <Crown className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-[#F5F5F0] tracking-wider block">
                  IMPERIAL
                </span>
                <span className="font-serif text-xs text-[#D4AF37] tracking-[0.3em] block -mt-0.5">
                  ART GALLERY
                </span>
              </div>
            </Link>
            <p className="text-[#525252] text-sm leading-relaxed mb-6">
              The premier platform for digital art ownership. License-based, secure, and globally accessible.
            </p>
            {/* Decorative Element */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-[#D4AF37]/30" />
              <Gem className="w-3 h-3 text-[#D4AF37]/50" strokeWidth={1.5} />
              <div className="w-8 h-px bg-[#D4AF37]/30" />
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#D4AF37] mb-6">
              Platform
            </h4>
            <ul className="space-y-4">
              {footerLinks.platform.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-[#A3A3A3] hover:text-[#F5F5F0] text-sm transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#D4AF37] mb-6">
              Legal
            </h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-[#A3A3A3] hover:text-[#F5F5F0] text-sm transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-[0.2em] text-[#D4AF37] mb-6">
              Support
            </h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-[#A3A3A3] hover:text-[#F5F5F0] text-sm transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-[#D4AF37]/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#525252] text-xs tracking-wider">
              © {currentYear} Imperial Art Gallery. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-[#525252] text-xs">
              <div className="w-2 h-2 bg-[#D4AF37]/50 rotate-45" />
              <span className="tracking-wider">Powered by Blockchain Technology</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
