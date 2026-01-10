import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { 
  ArrowLeft, Shield, Eye, Download, RefreshCw, Tag, 
  User, Calendar, AlertTriangle, Loader2, ShoppingCart,
  Lock, Unlock, DollarSign
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ArtworkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [artwork, setArtwork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const response = await axios.get(`${API}/artworks/${id}`);
        setArtwork(response.data);
      } catch (error) {
        console.error('Failed to fetch artwork:', error);
        toast.error('Artwork not found');
        navigate('/gallery');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArtwork();
  }, [id, navigate]);

  const isOwner = user && artwork?.owner_id === user.user_id;
  const canPurchase = artwork && !artwork.is_purchased && !artwork.is_refunded;
  const canRefund = isOwner && !artwork?.is_used && !artwork?.is_transferred;
  const canDownload = isOwner && !artwork?.is_used;
  const canSecureView = isOwner && !artwork?.is_used;

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/artwork/${id}` } } });
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await axios.post(
        `${API}/purchase`,
        { artwork_id: id, payment_method: 'crypto' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Purchase successful! Total: $${response.data.total.toFixed(2)}`);
      setShowPurchaseDialog(false);
      // Refresh artwork
      const artworkRes = await axios.get(`${API}/artworks/${id}`);
      setArtwork(artworkRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRefund = async () => {
    setIsRefunding(true);
    try {
      const response = await axios.post(
        `${API}/refund`,
        { artwork_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Refund processed! Amount: $${response.data.refund_amount.toFixed(2)}`);
      setShowRefundDialog(false);
      // Refresh artwork
      const artworkRes = await axios.get(`${API}/artworks/${id}`);
      setArtwork(artworkRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Refund failed');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.post(
        `${API}/artworks/${id}/download`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${artwork.title}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Download complete! Note: Refund and resale are now disabled.');
      setShowDownloadWarning(false);
      // Refresh artwork
      const artworkRes = await axios.get(`${API}/artworks/${id}`);
      setArtwork(artworkRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!artwork) return null;

  const totalPrice = artwork.price + artwork.license_protection_fee;

  return (
    <div className="min-h-screen bg-background" data-testid="artwork-detail-page">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            to="/gallery" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Artwork Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="card-glass overflow-hidden">
                <div className="aspect-square relative">
                  <img 
                    src={artwork.preview_url} 
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1764258559789-40cf1eb2025f?w=800';
                    }}
                  />
                  {/* Watermark for non-owners */}
                  {!isOwner && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-6xl font-bold font-serif rotate-[-30deg] select-none">
                        PREVIEW
                      </div>
                    </div>
                  )}
                  
                  {/* Status overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {artwork.is_purchased && !artwork.is_refunded && (
                      <Badge className="bg-secondary text-secondary-foreground">
                        <Lock className="w-3 h-3 mr-1" />
                        Owned
                      </Badge>
                    )}
                    {artwork.is_used && (
                      <Badge className="bg-neon-purple">
                        <Download className="w-3 h-3 mr-1" />
                        Downloaded
                      </Badge>
                    )}
                    {artwork.is_transferred && (
                      <Badge className="bg-accent">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Transferred
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Artwork Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-serif text-4xl font-bold text-foreground mb-2" data-testid="artwork-title">
                  {artwork.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {artwork.artist_name}
                  </span>
                  <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    {artwork.category}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground">{artwork.description}</p>

              {artwork.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artwork.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              {/* Pricing */}
              <Card className="card-glass" data-testid="pricing-card">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base Price</span>
                      <span className="font-mono text-lg">${artwork.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        License Protection Fee (5%)
                      </span>
                      <span className="font-mono text-sm">${artwork.license_protection_fee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-mono text-2xl text-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                {canPurchase && (
                  <Button 
                    className="w-full btn-primary h-14 text-base"
                    onClick={() => setShowPurchaseDialog(true)}
                    data-testid="purchase-btn"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Purchase License
                  </Button>
                )}

                {isOwner && (
                  <div className="grid grid-cols-2 gap-4">
                    {canSecureView && (
                      <Button 
                        variant="outline"
                        className="btn-secondary h-12"
                        onClick={() => navigate(`/secure-view/${id}`)}
                        data-testid="secure-view-btn"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Secure View
                      </Button>
                    )}
                    {canDownload && (
                      <Button 
                        variant="outline"
                        className="btn-secondary h-12"
                        onClick={() => setShowDownloadWarning(true)}
                        data-testid="download-btn"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                    {canRefund && (
                      <Button 
                        variant="outline"
                        className="h-12 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => setShowRefundDialog(true)}
                        data-testid="refund-btn"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Request Refund
                      </Button>
                    )}
                    {!artwork.is_used && !artwork.is_transferred && (
                      <Link to="/marketplace" className="col-span-2">
                        <Button 
                          variant="outline"
                          className="w-full h-12 border-secondary text-secondary hover:bg-secondary/10"
                          data-testid="list-for-sale-btn"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          List for Sale
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {artwork.is_used && isOwner && (
                  <div className="p-4 bg-neon-purple/10 border border-neon-purple/30 rounded">
                    <p className="text-sm text-neon-purple flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      This artwork has been downloaded. Refund and resale are disabled.
                    </p>
                  </div>
                )}
              </div>

              {/* License Info */}
              <Card className="bg-black/30 border-border">
                <CardContent className="p-4">
                  <h3 className="font-serif font-bold text-foreground mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-primary" />
                    License Information
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Exclusive ownership of this unique digital artwork</li>
                    <li>• Access to original, full-resolution file</li>
                    <li>• Right to resell on platform (if unused)</li>
                    <li>• Lifetime refund eligibility (if unused)</li>
                    <li>• License fee (5%) is non-refundable</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase the license for "{artwork?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span className="font-mono">${artwork?.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>License Protection Fee (5%):</span>
              <span className="font-mono">${artwork?.license_protection_fee.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="font-mono text-primary">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="btn-primary"
              onClick={handlePurchase}
              disabled={isPurchasing}
              data-testid="confirm-purchase-btn"
            >
              {isPurchasing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                'Confirm Purchase'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Request Refund</AlertDialogTitle>
            <AlertDialogDescription>
              You will receive ${artwork?.price.toFixed(2)} back. The license protection fee (${artwork?.license_protection_fee.toFixed(2)}) is non-refundable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isRefunding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRefunding ? 'Processing...' : 'Confirm Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download Warning Dialog */}
      <AlertDialog open={showDownloadWarning} onOpenChange={setShowDownloadWarning}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Downloading the full-resolution file will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Permanently disable</strong> your refund eligibility</li>
                <li><strong>Permanently disable</strong> your ability to resell this artwork</li>
              </ul>
              <p className="pt-2">This action cannot be undone. Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-download-btn"
            >
              {isDownloading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading...</>
              ) : (
                'I Understand, Download'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default ArtworkDetailPage;
