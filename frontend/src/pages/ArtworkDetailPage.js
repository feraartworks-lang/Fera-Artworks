import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  User, AlertTriangle, Loader2, ShoppingCart,
  Lock, DollarSign, Gem
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
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      </div>
    );
  }

  if (!artwork) return null;

  const totalPrice = artwork.price + artwork.license_protection_fee;

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="artwork-detail-page">
      <Navbar />
      
      <main className="pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            to="/gallery" 
            className="inline-flex items-center text-[#525252] hover:text-[#D4AF37] mb-10 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Back to Gallery
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Artwork Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                {/* Frame */}
                <div className="absolute -inset-4 border border-[#D4AF37]/20" />
                <div className="absolute -inset-2 border border-[#D4AF37]/10" />
                
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-[#0A0A0A]">
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
                      <div className="text-white/10 text-6xl font-bold font-serif rotate-[-30deg] select-none">
                        PREVIEW
                      </div>
                    </div>
                  )}
                  
                  {/* Status badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {artwork.is_purchased && !artwork.is_refunded && (
                      <span className="px-3 py-1 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider">
                        Owned
                      </span>
                    )}
                    {artwork.is_used && (
                      <span className="px-3 py-1 bg-[#4A0404] text-[#F5F5F0] text-xs font-bold uppercase tracking-wider">
                        Downloaded
                      </span>
                    )}
                    {artwork.is_transferred && (
                      <span className="px-3 py-1 bg-[#1A1A1A] text-[#D4AF37] text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30">
                        Transferred
                      </span>
                    )}
                  </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]" />
              </div>
            </motion.div>

            {/* Artwork Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Title & Artist */}
              <div>
                <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-3">Exclusive Artwork</p>
                <h1 className="font-serif text-4xl lg:text-5xl font-bold text-[#F5F5F0] mb-4" data-testid="artwork-title">
                  {artwork.title}
                </h1>
                <div className="flex items-center gap-6 text-[#A3A3A3]">
                  <span className="flex items-center text-sm">
                    <User className="w-4 h-4 mr-2 text-[#D4AF37]" strokeWidth={1.5} />
                    {artwork.artist_name}
                  </span>
                  <span className="flex items-center text-sm">
                    <Tag className="w-4 h-4 mr-2 text-[#D4AF37]" strokeWidth={1.5} />
                    {artwork.category}
                  </span>
                </div>
              </div>

              <p className="text-[#A3A3A3] leading-relaxed">{artwork.description}</p>

              {/* License ID */}
              <div className="p-5 border border-[#D4AF37]/30 bg-[#0A0A0A]">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
                  <div>
                    <span className="text-xs text-[#525252] uppercase tracking-wider">License ID</span>
                    <p className="font-mono text-sm text-[#D4AF37] font-bold">{artwork.license_id}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {artwork.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artwork.tags.map(tag => (
                    <span key={tag} className="text-xs text-[#525252] border border-[#333] px-3 py-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#D4AF37]/20" />
                <Gem className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                <div className="flex-1 h-px bg-[#D4AF37]/20" />
              </div>

              {/* Pricing */}
              <div className="p-6 border border-[#D4AF37]/20 bg-[#080808]" data-testid="pricing-card">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#A3A3A3]">Base Price</span>
                    <span className="font-serif text-xl text-[#F5F5F0]">${artwork.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#525252] flex items-center text-sm">
                      <Shield className="w-4 h-4 mr-2 text-[#D4AF37]" strokeWidth={1.5} />
                      License Protection Fee (5%)
                    </span>
                    <span className="font-mono text-sm text-[#525252]">${artwork.license_protection_fee.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-[#D4AF37]/20" />
                  <div className="flex justify-between items-center">
                    <span className="font-serif text-lg text-[#F5F5F0]">Total</span>
                    <span className="font-serif text-3xl text-[#D4AF37]">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {canPurchase && (
                  <Button 
                    className="w-full btn-gold h-16 text-sm"
                    onClick={() => navigate(`/checkout/${id}`)}
                    data-testid="purchase-btn"
                  >
                    <ShoppingCart className="w-5 h-5 mr-3" strokeWidth={1.5} />
                    Purchase via Bank Transfer
                  </Button>
                )}

                {isOwner && (
                  <div className="grid grid-cols-2 gap-4">
                    {canSecureView && (
                      <Button 
                        className="btn-outline-gold h-14"
                        onClick={() => navigate(`/secure-view/${id}`)}
                        data-testid="secure-view-btn"
                      >
                        <Eye className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        Secure View
                      </Button>
                    )}
                    {canDownload && (
                      <Button 
                        className="btn-outline-gold h-14"
                        onClick={() => setShowDownloadWarning(true)}
                        data-testid="download-btn"
                      >
                        <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        Download
                      </Button>
                    )}
                    {canRefund && (
                      <Button 
                        variant="outline"
                        className="h-14 border-[#4A0404] text-[#8B0000] hover:bg-[#4A0404]/10"
                        onClick={() => setShowRefundDialog(true)}
                        data-testid="refund-btn"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        Request Refund
                      </Button>
                    )}
                    {!artwork.is_used && !artwork.is_transferred && (
                      <Link to="/marketplace" className="col-span-2">
                        <Button 
                          className="w-full h-14 btn-outline-gold"
                          data-testid="list-for-sale-btn"
                        >
                          <DollarSign className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          List for Sale
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {artwork.is_used && isOwner && (
                  <div className="p-4 border border-[#4A0404] bg-[#4A0404]/10">
                    <p className="text-sm text-[#8B0000] flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      This artwork has been downloaded. Refund and resale are disabled.
                    </p>
                  </div>
                )}
              </div>

              {/* License Info */}
              <div className="p-6 border border-[#D4AF37]/10 bg-[#050505]">
                <h3 className="font-serif text-lg text-[#F5F5F0] mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-[#D4AF37]" strokeWidth={1.5} />
                  License Information
                </h3>
                <ul className="space-y-2 text-sm text-[#A3A3A3]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37]">•</span>
                    Exclusive ownership of this unique digital artwork
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37]">•</span>
                    Access to original, full-resolution file
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37]">•</span>
                    Right to resell on platform (if unused)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37]">•</span>
                    Lifetime refund eligibility (if unused)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4AF37]">•</span>
                    License fee (5%) is non-refundable
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-[#0A0A0A] border-[#D4AF37]/20">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#F5F5F0]">Confirm Purchase</DialogTitle>
            <DialogDescription className="text-[#A3A3A3]">
              You are about to purchase the license for "{artwork?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span className="text-[#A3A3A3]">Base Price:</span>
              <span className="font-serif text-[#F5F5F0]">${artwork?.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#525252]">License Protection Fee (5%):</span>
              <span className="font-mono text-[#525252]">${artwork?.license_protection_fee.toFixed(2)}</span>
            </div>
            <Separator className="bg-[#D4AF37]/20" />
            <div className="flex justify-between">
              <span className="font-serif text-[#F5F5F0]">Total:</span>
              <span className="font-serif text-2xl text-[#D4AF37]">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} className="btn-outline-gold">
              Cancel
            </Button>
            <Button 
              className="btn-gold"
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
        <AlertDialogContent className="bg-[#0A0A0A] border-[#D4AF37]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-[#F5F5F0]">Request Refund</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A3A3A3]">
              You will receive ${artwork?.price.toFixed(2)} back. The license protection fee (${artwork?.license_protection_fee.toFixed(2)}) is non-refundable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-gold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isRefunding}
              className="bg-[#4A0404] text-[#F5F5F0] hover:bg-[#6A0404]"
            >
              {isRefunding ? 'Processing...' : 'Confirm Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download Warning Dialog */}
      <AlertDialog open={showDownloadWarning} onOpenChange={setShowDownloadWarning}>
        <AlertDialogContent className="bg-[#0A0A0A] border-[#4A0404]/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-[#8B0000] font-serif text-xl">
              <AlertTriangle className="w-5 h-5 mr-2" strokeWidth={1.5} />
              Important Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-[#A3A3A3]">
              <p>Downloading the full-resolution file will:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#8B0000]">•</span>
                  <strong className="text-[#F5F5F0]">Permanently disable</strong> your refund eligibility
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8B0000]">•</span>
                  <strong className="text-[#F5F5F0]">Permanently disable</strong> your ability to resell this artwork
                </li>
              </ul>
              <p className="pt-2 text-[#F5F5F0]">This action cannot be undone. Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-gold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-[#4A0404] text-[#F5F5F0] hover:bg-[#6A0404]"
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
