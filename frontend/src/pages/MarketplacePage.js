import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { 
  Store, Plus, DollarSign, Loader2, ShoppingCart, Tag, 
  User, X, ArrowUpRight, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MarketplacePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [userArtworks, setUserArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [isListing, setIsListing] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const listingsRes = await axios.get(`${API}/marketplace`);
      setListings(listingsRes.data);

      if (token) {
        const artworksRes = await axios.get(`${API}/user/artworks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter artworks that can be listed (not used, not transferred)
        const listable = artworksRes.data.filter(a => !a.is_used && !a.is_transferred);
        setUserArtworks(listable);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListForSale = async () => {
    if (!selectedArtwork) {
      toast.error('Please select an artwork');
      return;
    }
    
    const price = parseFloat(salePrice);
    const artwork = userArtworks.find(a => a.artwork_id === selectedArtwork);
    const minPrice = (artwork?.purchase_price || artwork?.price || 0) * 1.01;
    
    if (!price || price < minPrice) {
      toast.error(`Minimum price is $${minPrice.toFixed(2)} (1% above purchase price)`);
      return;
    }

    setIsListing(true);
    try {
      await axios.post(
        `${API}/marketplace/list`,
        { artwork_id: selectedArtwork, sale_price: price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Artwork listed for sale!');
      setShowListDialog(false);
      setSelectedArtwork('');
      setSalePrice('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to list artwork');
    } finally {
      setIsListing(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedListing) return;

    setIsBuying(true);
    try {
      await axios.post(
        `${API}/marketplace/buy/${selectedListing.listing_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Purchase successful!');
      setShowBuyDialog(false);
      setSelectedListing(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setIsBuying(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    setIsCancelling(true);
    try {
      await axios.delete(
        `${API}/marketplace/${listingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Listing cancelled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel listing');
    } finally {
      setIsCancelling(false);
    }
  };

  const openBuyDialog = (listing) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/marketplace' } } });
      return;
    }
    setSelectedListing(listing);
    setShowBuyDialog(true);
  };

  const myListings = listings.filter(l => l.seller_id === user?.user_id);
  const otherListings = listings.filter(l => l.seller_id !== user?.user_id);

  return (
    <div className="min-h-screen bg-background overflow-hidden" data-testid="marketplace-page">
      <Navbar />
      
      {/* Coming Soon Overlay - Full Screen */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-md">
        {/* Message Card */}
        <div className="relative z-10 max-w-lg mx-4 p-8 bg-card/95 border border-primary/30 rounded-2xl shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Marketplace Coming Soon
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We will be launching our Marketplace service very soon. 
            We are committed to providing you with the best experience possible, 
            and we kindly ask for your patience in the meantime.
          </p>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Ferâ Team
            </p>
          </div>
        </div>
      </div>
      
      <main className="pt-24 pb-16 pointer-events-none select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="font-serif text-4xl font-bold text-foreground flex items-center gap-3">
                <Store className="w-10 h-10 text-primary" />
                P2P Marketplace
              </h1>
              <p className="text-muted-foreground mt-2">
                Buy and sell digital art licenses peer-to-peer. Only 1% platform commission.
              </p>
            </div>
            {user && userArtworks.length > 0 && (
              <Button 
                className="btn-primary"
                onClick={() => setShowListDialog(true)}
                data-testid="list-artwork-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                List for Sale
              </Button>
            )}
          </div>

          {/* Info Banner */}
          <Card className="bg-primary/5 border-primary/20 mb-8">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium">Important P2P Rules:</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Only unused artworks (not downloaded) can be sold</li>
                    <li>• Minimum sale price: 1% above your purchase price</li>
                    <li>• Platform takes 1% commission from each sale</li>
                    <li>• Once sold, the buyer becomes the new license owner</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="browse" data-testid="tab-browse">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse ({otherListings.length})
              </TabsTrigger>
              {user && (
                <TabsTrigger value="my-listings" data-testid="tab-my-listings">
                  <Tag className="w-4 h-4 mr-2" />
                  My Listings ({myListings.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse">
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : otherListings.length === 0 ? (
                <Card className="card-glass">
                  <CardContent className="p-12 text-center">
                    <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl text-foreground mb-2">No listings available</h3>
                    <p className="text-muted-foreground">
                      Check back later or browse the gallery for new artworks.
                    </p>
                    <Link to="/gallery">
                      <Button className="mt-4 btn-primary">Browse Gallery</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherListings.map((listing, index) => (
                    <motion.div
                      key={listing.listing_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="card-interactive overflow-hidden group"
                        data-testid={`listing-card-${index}`}
                      >
                        <div className="aspect-square overflow-hidden relative">
                          <img 
                            src={listing.artwork?.preview_url} 
                            alt={listing.artwork?.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-neon-green/90 text-black">
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                              For Sale
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif text-lg font-bold text-foreground truncate">
                            {listing.artwork?.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">{listing.artwork?.artist_name}</p>
                          <div className="flex justify-between items-center mt-3">
                            <div>
                              <span className="font-mono text-primary text-xl">
                                ${listing.sale_price.toFixed(2)}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                +${listing.platform_commission.toFixed(2)} fee
                              </p>
                            </div>
                            <Button 
                              size="sm"
                              className="btn-primary"
                              onClick={() => openBuyDialog(listing)}
                              data-testid={`buy-btn-${index}`}
                            >
                              Buy
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Listings Tab */}
            {user && (
              <TabsContent value="my-listings">
                {myListings.length === 0 ? (
                  <Card className="card-glass">
                    <CardContent className="p-12 text-center">
                      <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-serif text-xl text-foreground mb-2">No active listings</h3>
                      <p className="text-muted-foreground mb-4">
                        List your unused artworks for sale on the marketplace.
                      </p>
                      {userArtworks.length > 0 && (
                        <Button 
                          className="btn-primary"
                          onClick={() => setShowListDialog(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          List Artwork
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myListings.map((listing, index) => (
                      <Card 
                        key={listing.listing_id} 
                        className="card-glass overflow-hidden"
                        data-testid={`my-listing-${index}`}
                      >
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={listing.artwork?.preview_url} 
                            alt={listing.artwork?.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif font-bold text-foreground truncate">
                            {listing.artwork?.title}
                          </h3>
                          <div className="flex justify-between items-center mt-3">
                            <div>
                              <span className="font-mono text-primary text-lg">
                                ${listing.sale_price.toFixed(2)}
                              </span>
                              <Badge className={`ml-2 ${
                                listing.status === 'active' 
                                  ? 'bg-neon-green/20 text-neon-green' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {listing.status}
                              </Badge>
                            </div>
                            {listing.status === 'active' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-destructive text-destructive hover:bg-destructive/10"
                                onClick={() => handleCancelListing(listing.listing_id)}
                                disabled={isCancelling}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {/* List for Sale Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">List Artwork for Sale</DialogTitle>
            <DialogDescription>
              Choose an artwork from your collection and set your sale price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Artwork</Label>
              <Select value={selectedArtwork} onValueChange={setSelectedArtwork}>
                <SelectTrigger className="input-dark">
                  <SelectValue placeholder="Choose an artwork" />
                </SelectTrigger>
                <SelectContent>
                  {userArtworks.map((artwork) => (
                    <SelectItem key={artwork.artwork_id} value={artwork.artwork_id}>
                      <div className="flex items-center gap-2">
                        <span>{artwork.title}</span>
                        <span className="text-muted-foreground text-xs">
                          (min: ${((artwork.purchase_price || artwork.price) * 1.01).toFixed(2)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="input-dark font-mono"
              />
              {salePrice && (
                <p className="text-xs text-muted-foreground">
                  You'll receive: ${(parseFloat(salePrice) * 0.99).toFixed(2)} (after 1% commission)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="btn-primary"
              onClick={handleListForSale}
              disabled={isListing}
            >
              {isListing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Listing...</>
              ) : (
                'List for Sale'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to buy "{selectedListing?.artwork?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span>Sale Price:</span>
              <span className="font-mono">${selectedListing?.sale_price.toFixed(2)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• You will become the new license owner</p>
              <p>• The seller's ownership will be permanently transferred to you</p>
              <p>• You can resell or refund (if you don't download)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="btn-primary"
              onClick={handleBuy}
              disabled={isBuying}
            >
              {isBuying ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                'Confirm Purchase'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MarketplacePage;
