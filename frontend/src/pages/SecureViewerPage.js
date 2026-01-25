import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Shield, AlertTriangle, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SecureViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [artwork, setArtwork] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const response = await axios.get(`${API}/artworks/${id}`);
        setArtwork(response.data);

        // Check if user owns this artwork
        if (response.data.owner_id !== user?.user_id) {
          toast.error('You do not own this artwork');
          navigate(`/artwork/${id}`);
          return;
        }

        if (response.data.is_used) {
          toast.error('This artwork has been downloaded. Use your local copy.');
          navigate(`/artwork/${id}`);
          return;
        }

        // Fetch secure view
        const secureResponse = await axios.get(
          `${API}/artworks/${id}/secure-view`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        );
        
        const url = window.URL.createObjectURL(new Blob([secureResponse.data]));
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to load secure view:', error);
        toast.error(error.response?.data?.detail || 'Failed to load secure viewer');
        navigate(`/artwork/${id}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && token) {
      fetchArtwork();
    }

    return () => {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, [id, user, token, navigate]);

  // Disable right-click
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error('Right-click is disabled in Secure Viewer');
    };

    const handleKeyDown = (e) => {
      // Disable common screenshot shortcuts
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'S') ||
        (e.ctrlKey && e.key === 's') ||
        (e.key === 'PrintScreen')
      ) {
        e.preventDefault();
        toast.error('Screenshots are not allowed in Secure Viewer');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" data-testid="secure-viewer-loading">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Secure Viewer...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black flex flex-col no-select no-context"
      data-testid="secure-viewer-page"
    >
      {/* Scanlines overlay */}
      <div className="scanlines fixed inset-0 pointer-events-none z-50" />
      
      {/* Header Controls */}
      <div 
        className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="glass p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/artwork/${id}`}>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-serif text-lg font-bold text-foreground">
                  {artwork?.title}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{artwork?.artist_name}</p>
                  {artwork?.license_id && (
                    <span className="text-xs font-mono text-primary">• {artwork.license_id}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary text-sm">
                <Shield className="w-4 h-4" />
                <span className="font-mono uppercase tracking-wider">Secure Viewer</span>
              </div>
              <Link to={`/artwork/${id}`}>
                <Button variant="ghost" size="icon">
                  <X className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center p-8 pt-24 pb-24">
        {imageUrl ? (
          <img 
            src={imageUrl}
            alt={artwork?.title}
            className="max-w-full max-h-full object-contain select-none"
            draggable="false"
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <div className="text-muted-foreground">Failed to load image</div>
        )}
      </div>

      {/* Footer Controls */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="glass p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Protected Content</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-secondary" />
                  <span>Download will disable refund/resale</span>
                </div>
              </div>
              
              <div className="font-mono text-xs text-muted-foreground">
                License ID: {artwork?.artwork_id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-30 opacity-5">
        <div className="text-white text-[20vw] font-bold font-serif rotate-[-30deg] select-none whitespace-nowrap">
          {user?.user_id?.slice(0, 8)}
        </div>
      </div>
    </div>
  );
};

export default SecureViewerPage;
