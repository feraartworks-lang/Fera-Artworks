import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Filter, Grid, LayoutGrid, Loader2 } from 'lucide-react';
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

    // Seed demo data first
    const seedAndFetch = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (error) {
        // Seed already exists, continue
      }
      fetchArtworks();
    };

    seedAndFetch();
  }, []);

  useEffect(() => {
    let result = [...artworks];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (art) =>
          art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (category !== 'all') {
      result = result.filter((art) => art.category === category);
    }

    // Sort
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
    <div className="min-h-screen bg-background" data-testid="gallery-page">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Art Gallery
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Discover unique digital artworks. Each piece is one-of-a-kind with verified license ownership.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search artworks, artists, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-dark"
                data-testid="search-input"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-48 input-dark" data-testid="category-select">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 input-dark" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                data-testid="grid-view-btn"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'large' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('large')}
                data-testid="large-view-btn"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground text-sm mb-6">
            {filteredArtworks.length} artwork{filteredArtworks.length !== 1 ? 's' : ''} found
          </p>

          {/* Artwork Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg">No artworks found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setSearchTerm(''); setCategory('all'); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {filteredArtworks.map((artwork, index) => (
                <motion.div
                  key={artwork.artwork_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link to={`/artwork/${artwork.artwork_id}`}>
                    <Card 
                      className="card-interactive overflow-hidden group"
                      data-testid={`artwork-card-${artwork.artwork_id}`}
                    >
                      <div className={`overflow-hidden ${viewMode === 'large' ? 'aspect-video' : 'aspect-square'}`}>
                        <img 
                          src={artwork.preview_url} 
                          alt={artwork.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1764258559789-40cf1eb2025f?w=800';
                          }}
                        />
                        {/* Watermark overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Status badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {artwork.is_purchased && !artwork.is_refunded && (
                            <span className="px-2 py-1 bg-secondary/90 text-secondary-foreground text-xs font-mono uppercase">
                              Owned
                            </span>
                          )}
                          {artwork.is_used && (
                            <span className="px-2 py-1 bg-neon-purple/90 text-white text-xs font-mono uppercase">
                              Downloaded
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {artwork.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">{artwork.artist_name}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="font-mono text-primary text-lg">
                            ${artwork.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {artwork.category}
                          </span>
                        </div>
                        {artwork.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {artwork.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
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
