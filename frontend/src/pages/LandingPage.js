import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Repeat, RefreshCw, Wallet, ArrowRight, Lock, Eye, Download } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LandingPage = () => {
  const [featuredArtworks, setFeaturedArtworks] = useState([]);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await axios.get(`${API}/artworks`);
        setFeaturedArtworks(response.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch artworks:', error);
      }
    };
    fetchArtworks();
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'License-Based Ownership',
      description: 'Own the exclusive license to unique digital artworks. Not just a file, but verified ownership rights.',
    },
    {
      icon: Repeat,
      title: 'P2P Resale Market',
      description: 'Buy and sell artworks freely in our peer-to-peer marketplace with just 1% platform fee.',
    },
    {
      icon: RefreshCw,
      title: 'Lifetime Refund',
      description: 'Changed your mind? Get a full refund (minus license fee) if you haven\'t downloaded the artwork.',
    },
    {
      icon: Wallet,
      title: 'Multi-Payment Support',
      description: 'Pay with crypto (MetaMask), bank transfer, or open banking. Your choice, global access.',
    },
  ];

  const howItWorks = [
    {
      icon: Eye,
      title: 'Preview',
      description: 'Browse watermarked previews of all artworks in our curated gallery.',
    },
    {
      icon: Lock,
      title: 'Purchase',
      description: 'Buy the license with your preferred payment method. 5% license protection fee applies.',
    },
    {
      icon: Download,
      title: 'Access',
      description: 'View in our Secure Viewer or download the original. Downloading disables refund/resale.',
    },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 bg-hero-glow" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1764258559789-40cf1eb2025f?w=1920)` }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6">
              Own <span className="text-primary">Digital Art</span>
              <br />Like Never Before
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-8">
              The world's first license-based digital art ownership platform. 
              Secure, transferable, and backed by blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/gallery">
                <Button className="btn-primary text-base px-10 py-4 h-auto" data-testid="explore-gallery-btn">
                  Explore Gallery
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="btn-secondary text-base px-10 py-4 h-auto" data-testid="start-collecting-btn">
                  Start Collecting
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <p className="font-mono text-3xl sm:text-4xl text-primary font-bold">1,000+</p>
              <p className="text-muted-foreground text-sm mt-1">Unique Artworks</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl sm:text-4xl text-secondary font-bold">5%</p>
              <p className="text-muted-foreground text-sm mt-1">License Fee</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-3xl sm:text-4xl text-neon-green font-bold">∞</p>
              <p className="text-muted-foreground text-sm mt-1">Refund Period</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose ArtChain?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We've reimagined digital art ownership with security, flexibility, and transparency at the core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-glass p-6 h-full hover:border-primary/50 transition-colors duration-300" data-testid={`feature-card-${index}`}>
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-black/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From discovery to ownership in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute top-8 left-1/2 w-full h-[1px] bg-border hidden md:block" style={{ display: index === 2 ? 'none' : undefined }} />
                  <span className="font-mono text-primary text-sm mb-2 block">Step {index + 1}</span>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      {featuredArtworks.length > 0 && (
        <section className="py-24 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  Featured Artworks
                </h2>
                <p className="text-muted-foreground">
                  Discover exceptional pieces from our curated collection.
                </p>
              </div>
              <Link to="/gallery">
                <Button variant="ghost" className="text-primary">
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredArtworks.map((artwork, index) => (
                <motion.div
                  key={artwork.artwork_id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/artwork/${artwork.artwork_id}`}>
                    <Card className="card-interactive overflow-hidden group" data-testid={`featured-artwork-${index}`}>
                      <div className="aspect-square overflow-hidden">
                        <img 
                          src={artwork.preview_url} 
                          alt={artwork.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-lg font-bold text-foreground truncate">
                          {artwork.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">{artwork.artist_name}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="font-mono text-primary text-lg">
                            ${artwork.price.toFixed(2)}
                          </span>
                          {artwork.is_purchased ? (
                            <span className="text-xs text-secondary uppercase tracking-wider">Owned</span>
                          ) : (
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Available</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-hero-glow border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Start Your Collection?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of collectors who trust ArtChain for secure, 
            transparent digital art ownership.
          </p>
          <Link to="/register">
            <Button className="btn-primary text-base px-12 py-4 h-auto animate-glow-pulse" data-testid="cta-register-btn">
              Create Your Account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
