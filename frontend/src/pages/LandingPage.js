import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Repeat, RefreshCw, Wallet, ArrowRight, Lock, Eye, Download, ChevronDown, Crown, Gem } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.2 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } }
};

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
      number: 'I',
      title: 'Preview',
      description: 'Browse watermarked previews of all artworks in our curated gallery.',
    },
    {
      icon: Lock,
      number: 'II',
      title: 'Purchase',
      description: 'Buy the license with your preferred payment method. 5% license protection fee applies.',
    },
    {
      icon: Download,
      number: 'III',
      title: 'Access',
      description: 'View in our Secure Viewer or download the original. Downloading disables refund/resale.',
    },
  ];

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="landing-page">
      <Navbar />
      
      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1920&q=80)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/50 to-[#050505]" />
          <div className="absolute inset-0 hero-vignette" />
          <div className="absolute inset-0 hero-gold-glow" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-px h-32 bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent hidden lg:block" />
        <div className="absolute top-1/4 right-10 w-px h-32 bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent hidden lg:block" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-8"
          >
            {/* Main Heading */}
            <motion.h1 
              variants={fadeInUp}
              className="font-serif text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight"
            >
              <span className="text-[#F5F5F0]">Own </span>
              <span className="text-shimmer">Digital Art</span>
              <br />
              <span className="text-[#F5F5F0]">Like Never Before</span>
            </motion.h1>

            {/* Ornate Divider */}
            <motion.div variants={fadeIn} className="flex items-center justify-center gap-4 py-4">
              <div className="w-24 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
              <Gem className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
              <div className="w-24 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
            </motion.div>

            {/* Subheading */}
            <motion.p 
              variants={fadeInUp}
              className="text-[#A3A3A3] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              The world's premier license-based digital art ownership platform. 
              Secure, transferable, and backed by blockchain technology.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/gallery">
                <Button className="btn-gold text-sm px-12 py-5 h-auto" data-testid="explore-gallery-btn">
                  Explore Gallery
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button className="btn-outline-gold text-sm px-12 py-5 h-auto" data-testid="start-collecting-btn">
                  Start Collecting
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-16"
            >
              <div className="text-center">
                <p className="font-serif text-4xl sm:text-5xl text-[#D4AF37] font-bold">1,000+</p>
                <p className="text-[#525252] text-xs uppercase tracking-[0.2em] mt-2">Unique Artworks</p>
              </div>
              <div className="text-center border-x border-[#D4AF37]/20">
                <p className="font-serif text-4xl sm:text-5xl text-[#D4AF37] font-bold">5%</p>
                <p className="text-[#525252] text-xs uppercase tracking-[0.2em] mt-2">License Fee</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-4xl sm:text-5xl text-[#D4AF37] font-bold">∞</p>
                <p className="text-[#525252] text-xs uppercase tracking-[0.2em] mt-2">Refund Period</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
            onClick={scrollToFeatures}
          >
            <ChevronDown className="w-8 h-8 text-[#D4AF37]/50 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-museum border-t border-[#D4AF37]/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0A0A0A] to-[#050505]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.p variants={fadeIn} className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4">
              Why Choose Us
            </motion.p>
            <motion.h2 variants={fadeInUp} className="font-serif text-4xl sm:text-5xl font-bold text-[#F5F5F0] mb-6">
              The Imperial Difference
            </motion.h2>
            <motion.div variants={fadeIn} className="divider-gold max-w-xs mx-auto">
              <div className="divider-ornament" />
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div 
                  className="card-renaissance p-8 h-full frame-corners group"
                  data-testid={`feature-card-${index}`}
                >
                  <div className="w-14 h-14 border border-[#D4AF37]/30 flex items-center justify-center mb-6 group-hover:border-[#D4AF37] transition-colors duration-500">
                    <feature.icon className="w-7 h-7 text-[#D4AF37]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-[#F5F5F0] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#A3A3A3] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-museum bg-[#080808] border-t border-b border-[#D4AF37]/10 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #D4AF37 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.p variants={fadeIn} className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4">
              Simple Process
            </motion.p>
            <motion.h2 variants={fadeInUp} className="font-serif text-4xl sm:text-5xl font-bold text-[#F5F5F0] mb-6">
              How It Works
            </motion.h2>
            <motion.div variants={fadeIn} className="divider-gold max-w-xs mx-auto">
              <div className="divider-ornament" />
            </motion.div>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                {/* Connector Line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
                )}
                
                {/* Step Number */}
                <div className="inline-block mb-8">
                  <div className="w-24 h-24 border border-[#D4AF37]/30 flex items-center justify-center relative">
                    <span className="font-serif text-4xl text-[#D4AF37]">{step.number}</span>
                    <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#D4AF37]" />
                    <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#D4AF37]" />
                  </div>
                </div>

                <h3 className="font-serif text-2xl font-semibold text-[#F5F5F0] mb-4">
                  {step.title}
                </h3>
                <p className="text-[#A3A3A3] text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      {featuredArtworks.length > 0 && (
        <section className="section-museum relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="flex flex-col md:flex-row justify-between items-center mb-16"
            >
              <div className="text-center md:text-left mb-8 md:mb-0">
                <motion.p variants={fadeIn} className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4">
                  Curated Selection
                </motion.p>
                <motion.h2 variants={fadeInUp} className="font-serif text-4xl sm:text-5xl font-bold text-[#F5F5F0]">
                  Featured Artworks
                </motion.h2>
              </div>
              <motion.div variants={fadeIn}>
                <Link to="/gallery">
                  <Button className="btn-ghost-gold group">
                    View All Collection
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Artworks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredArtworks.map((artwork, index) => (
                <motion.div
                  key={artwork.artwork_id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/artwork/${artwork.artwork_id}`}>
                    <div 
                      className="card-renaissance overflow-hidden group"
                      data-testid={`featured-artwork-${index}`}
                    >
                      {/* Image Container */}
                      <div className="aspect-[4/5] overflow-hidden relative">
                        <img 
                          src={artwork.preview_url} 
                          alt={artwork.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
                        
                        {/* Frame Corners on Image */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-500" />
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors duration-500" />
                        
                        {/* Status Badge */}
                        {artwork.is_purchased ? (
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 bg-[#D4AF37]/90 text-black text-xs font-bold uppercase tracking-wider">
                              Sold
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="font-serif text-xl font-semibold text-[#F5F5F0] mb-1 group-hover:text-[#D4AF37] transition-colors duration-300">
                          {artwork.title}
                        </h3>
                        <p className="text-[#525252] text-sm mb-4">{artwork.artist_name}</p>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-[#D4AF37]/10">
                          <span className="font-serif text-2xl text-[#D4AF37]">
                            ${artwork.price.toFixed(0)}
                          </span>
                          {!artwork.is_purchased && (
                            <span className="text-[#525252] text-xs uppercase tracking-wider">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="section-museum relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#050505] to-[#0A0A0A]" />
          <div className="absolute inset-0 hero-gold-glow opacity-50" />
        </div>

        {/* Decorative Border */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-[#D4AF37]/50 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeIn} className="flex justify-center mb-8">
              <Crown className="w-10 h-10 text-[#D4AF37]" strokeWidth={1} />
            </motion.div>

            <motion.h2 variants={fadeInUp} className="font-serif text-4xl sm:text-5xl font-bold text-[#F5F5F0] mb-6">
              Begin Your Collection
            </motion.h2>

            <motion.div variants={fadeIn} className="divider-gold max-w-xs mx-auto mb-8">
              <div className="divider-ornament" />
            </motion.div>

            <motion.p variants={fadeInUp} className="text-[#A3A3A3] text-lg mb-12 max-w-2xl mx-auto">
              Join an exclusive community of collectors who trust Imperial Art Gallery 
              for secure, transparent digital art ownership.
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link to="/register">
                <Button className="btn-gold text-sm px-16 py-6 h-auto animate-pulse-gold" data-testid="cta-register-btn">
                  Create Your Account
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Decorative Border */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-t from-[#D4AF37]/50 to-transparent" />
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
