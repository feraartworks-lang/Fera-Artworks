import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, LayoutDashboard, Gem } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/gallery', label: 'Gallery' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/how-it-works', label: 'How It Works' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-[#050505]/95 backdrop-blur-xl border-b border-[#D4AF37]/10' 
          : 'bg-transparent'
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" data-testid="logo-link">
            <div className="w-10 h-10 border border-[#D4AF37]/50 flex items-center justify-center group-hover:border-[#D4AF37] transition-colors duration-300">
              <Gem className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-lg font-bold text-[#F5F5F0] tracking-wider">
                IMPERIAL
              </span>
              <span className="font-serif text-xs text-[#D4AF37] tracking-[0.3em] block -mt-1">
                ART GALLERY
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`relative text-xs uppercase tracking-[0.15em] transition-colors duration-300 py-2 whitespace-nowrap ${
                  isActive(link.path) 
                    ? 'text-[#D4AF37]' 
                    : 'text-[#A3A3A3] hover:text-[#F5F5F0]'
                }`}
                data-testid={`${link.path.slice(1)}-link`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-[#D4AF37]" />
                )}
              </Link>
            ))}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-3 hover:bg-transparent"
                    data-testid="user-menu-trigger"
                  >
                    <div className="w-9 h-9 border border-[#D4AF37]/50 flex items-center justify-center">
                      {user.picture ? (
                        <img src={user.picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-wider text-[#F5F5F0]">
                      {user.name?.split(' ')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 bg-[#0A0A0A] border border-[#D4AF37]/20 shadow-2xl"
                >
                  <div className="px-4 py-3 border-b border-[#D4AF37]/10">
                    <p className="text-xs text-[#525252] uppercase tracking-wider">Balance</p>
                    <p className="font-serif text-xl text-[#D4AF37]">${user.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => navigate('/dashboard')} 
                    className="py-3 cursor-pointer hover:bg-[#D4AF37]/10 focus:bg-[#D4AF37]/10"
                    data-testid="dashboard-menu-item"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-3 text-[#D4AF37]" strokeWidth={1.5} />
                    <span className="text-[#F5F5F0]">Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#D4AF37]/10" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="py-3 cursor-pointer text-[#8B0000] hover:bg-[#8B0000]/10 focus:bg-[#8B0000]/10"
                    data-testid="logout-menu-item"
                  >
                    <LogOut className="w-4 h-4 mr-3" strokeWidth={1.5} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className="btn-ghost-gold text-xs"
                    data-testid="login-button"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    className="btn-gold text-xs px-6 py-3"
                    data-testid="register-button"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#F5F5F0] hover:bg-transparent"
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" strokeWidth={1.5} />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 space-y-2 border-t border-[#D4AF37]/10 animate-fade-in-down bg-[#050505]">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`block py-3 text-sm uppercase tracking-[0.2em] transition-colors ${
                  isActive(link.path) ? 'text-[#D4AF37]' : 'text-[#A3A3A3]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block py-3 text-sm uppercase tracking-[0.2em] text-[#A3A3A3]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="pt-4 border-t border-[#D4AF37]/10">
                  <p className="text-xs text-[#525252] uppercase tracking-wider mb-1">Balance</p>
                  <p className="font-serif text-xl text-[#D4AF37] mb-4">${user.balance?.toFixed(2) || '0.00'}</p>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-[#8B0000] hover:bg-[#8B0000]/10"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-3 pt-4 border-t border-[#D4AF37]/10">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full btn-outline-gold">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full btn-gold">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
