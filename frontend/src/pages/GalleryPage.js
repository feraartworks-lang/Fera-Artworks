import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Filter, Grid, LayoutGrid, Loader2, Gem } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GalleryPage = () => {
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await axios.get(`${API}/artworks`);
        setArtworks(response.data);
        setFilteredArtworks(response.data);
      } catch (error) {
        console.error('Failed to fetch artworks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const seedAndFetch = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (error) {
        // Seed already exists
      }
      fetchArtworks();
    };

    seedAndFetch();
  }, []);

  useEffect(() => {
    let result = [...artworks];

    if (searchTerm) {
      result = result.filter(
        (art) =>
          art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (category !== 'all') {
      result = result.filter((art) => art.category === category);
    }

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    setFilteredArtworks(result);
  }, [artworks, searchTerm, category, sortBy]);

  const categories = ['all', 'abstract', 'space', 'luxury', 'cyberpunk', 'tech'];

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="gallery-page">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4">Our Collection</p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#F5F5F0] mb-6">
              Art Gallery
            </h1>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
              <Gem className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
            </div>
            <p className="text-[#A3A3A3] text-lg max-w-2xl mx-auto">
              Discover unique digital artworks. Each piece is one-of-a-kind with verified license ownership.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col lg:flex-row gap-4 mb-12 p-6 border border-[#D4AF37]/10 bg-[#0A0A0A]/50"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.5} />
              <Input
                placeholder="Search artworks, artists, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-transparent border-[#333] focus:border-[#D4AF37] text-[#F5F5F0] placeholder:text-[#444]"
                data-testid="search-input"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger 
                className="w-full lg:w-48 h-12 bg-transparent border-[#333] text-[#F5F5F0]"
                data-testid="category-select"
              >
                <Filter className="w-4 h-4 mr-2 text-[#D4AF37]" strokeWidth={1.5} />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-[#333]">
                {categories.map((cat) => (
                  <SelectItem 
                    key={cat} 
                    value={cat}
                    className="text-[#F5F5F0] focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger 
                className="w-full lg:w-48 h-12 bg-transparent border-[#333] text-[#F5F5F0]"
                data-testid="sort-select"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-[#333]">
                <SelectItem value="newest" className="text-[#F5F5F0] focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                  Newest First
                </SelectItem>
                <SelectItem value="price-low" className="text-[#F5F5F0] focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price-high" className="text-[#F5F5F0] focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]">
                  Price: High to Low
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`h-12 w-12 border-[#333] ${viewMode === 'grid' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'text-[#525252]'}`}
                data-testid="grid-view-btn"
              >
                <Grid className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('large')}
                className={`h-12 w-12 border-[#333] ${viewMode === 'large' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'text-[#525252]'}`}
                data-testid="large-view-btn"
              >
                <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </motion.div>

          {/* Results count */}
          <p className="text-[#525252] text-sm mb-8 uppercase tracking-wider">
            {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? 's' : ''} found
          </p>

          {/* Artwork Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-[#A3A3A3] text-lg mb-6">No artworks found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="btn-outline-gold"
                onClick={() => { setSearchTerm(''); setCategory('all'); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={`grid gap-8 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {filteredArtworks.map((artwork, index) => (
                <motion.div
                  key={artwork.artwork_id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link to={`/artwork/${artwork.artwork_id}`}>
                    <div 
                      className="card-renaissance overflow-hidden group"
                      data-testid={`artwork-card-${artwork.artwork_id}`}
                    >
                      <div className={`overflow-hidden relative ${viewMode === 'large' ? 'aspect-video' : 'aspect-square'}`}>
                        <img 
                          src={artwork.preview_url} 
                          alt={artwork.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1764258559789-40cf1eb2025f?w=800';
                          }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
                        
                        {/* Frame Corners */}
                        <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#D4AF37]/30 group-hover:border-[#D4AF37] transition-colors duration-500" />
                        <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-[#D4AF37]/30 group-hover:border-[#D4AF37] transition-colors duration-500" />
                        
                        {/* Status badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {artwork.is_purchased && !artwork.is_refunded && (
                            <span className="px-2 py-1 bg-[#D4AF37]/90 text-black text-xs font-bold uppercase tracking-wider">
                              Sold
                            </span>
                          )}
                          {artwork.is_used && (
                            <span className="px-2 py-1 bg-[#4A0404] text-[#F5F5F0] text-xs font-bold uppercase tracking-wider">
                              Downloaded
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="font-serif text-lg font-semibold text-[#F5F5F0] truncate group-hover:text-[#D4AF37] transition-colors duration-300">
                          {artwork.title}
                        </h3>
                        <p className="text-[#525252] text-sm mb-2">{artwork.artist_name}</p>
                        
                        {artwork.license_id && (
                          <p className="text-xs font-mono text-[#D4AF37]/60 truncate mb-3" title={artwork.license_id}>
                            {artwork.license_id}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 border-t border-[#D4AF37]/10">
                          <span className="font-serif text-xl text-[#D4AF37]">
                            ${artwork.price.toFixed(0)}
                          </span>
                          <span className="text-xs text-[#525252] uppercase tracking-wider">
                            {artwork.category}
                          </span>
                        </div>
                        
                        {artwork.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {artwork.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-[#525252] border border-[#333] px-2 py-0.5">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GalleryPage;
