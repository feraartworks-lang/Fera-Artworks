import React, { useEffect, useState, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, Pencil, Trash2, Upload, Loader2, Search, 
  Image as ImageIcon, DollarSign, Tag
} from 'lucide-react';

const AdminArtworks = () => {
  const { adminApi } = useAdmin();
  const fileInputRef = useRef(null);
  
  const [artworks, setArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    artist_name: '',
    category: 'digital',
    tags: '',
    file: null
  });

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const data = await adminApi('get', '/admin/artworks');
      setArtworks(data);
    } catch (error) {
      toast.error('Failed to load artworks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.price || !formData.artist_name) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('price', formData.price);
      form.append('artist_name', formData.artist_name);
      form.append('category', formData.category);
      form.append('tags', formData.tags);
      
      if (formData.file) {
        form.append('file', formData.file);
      } else {
        // Create a placeholder file if no file uploaded
        const placeholder = new Blob(['placeholder'], { type: 'image/jpeg' });
        form.append('file', placeholder, 'placeholder.jpg');
      }

      await adminApi('post', '/admin/artworks', form);
      toast.success('Artwork created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchArtworks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create artwork');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      await adminApi('put', `/admin/artworks/${selectedArtwork.artwork_id}`, {
        title: formData.title || undefined,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        artist_name: formData.artist_name || undefined,
        category: formData.category || undefined,
        tags: formData.tags || undefined
      });
      toast.success('Artwork updated successfully');
      setShowEditDialog(false);
      resetForm();
      fetchArtworks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update artwork');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await adminApi('delete', `/admin/artworks/${selectedArtwork.artwork_id}`);
      toast.success('Artwork deleted successfully');
      setShowDeleteDialog(false);
      setSelectedArtwork(null);
      fetchArtworks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete artwork');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      artist_name: '',
      category: 'digital',
      tags: '',
      file: null
    });
    setSelectedArtwork(null);
  };

  const openEditDialog = (artwork) => {
    setSelectedArtwork(artwork);
    setFormData({
      title: artwork.title,
      description: artwork.description,
      price: artwork.price.toString(),
      artist_name: artwork.artist_name,
      category: artwork.category,
      tags: artwork.tags?.join(', ') || '',
      file: null
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (artwork) => {
    setSelectedArtwork(artwork);
    setShowDeleteDialog(true);
  };

  const filteredArtworks = artworks.filter(art => 
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.artwork_id.includes(searchTerm)
  );

  const getStatusBadge = (artwork) => {
    if (artwork.is_refunded) return <Badge variant="outline" className="text-zinc-500">Refunded</Badge>;
    if (artwork.is_used) return <Badge className="bg-purple-500">Downloaded</Badge>;
    if (artwork.is_transferred) return <Badge className="bg-blue-500">Transferred</Badge>;
    if (artwork.is_purchased) return <Badge className="bg-yellow-500">Owned</Badge>;
    return <Badge className="bg-green-500">Available</Badge>;
  };

  return (
    <div data-testid="admin-artworks">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Artworks</h1>
          <p className="text-zinc-500">Manage digital art inventory</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-red-600 hover:bg-red-700"
          data-testid="create-artwork-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Artwork
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search by title, artist, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          data-testid="search-artworks"
        />
      </div>

      {/* Artworks Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Artwork</TableHead>
                  <TableHead className="text-zinc-400">Artist</TableHead>
                  <TableHead className="text-zinc-400">Price</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Owner</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArtworks.map((artwork) => (
                  <TableRow key={artwork.artwork_id} className="border-zinc-800" data-testid={`artwork-row-${artwork.artwork_id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-zinc-800 rounded overflow-hidden">
                          <img 
                            src={artwork.preview_url} 
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/48'}
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium">{artwork.title}</p>
                          <p className="text-zinc-500 text-xs font-mono">{artwork.artwork_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{artwork.artist_name}</TableCell>
                    <TableCell className="font-mono text-green-500">${artwork.price.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(artwork)}</TableCell>
                    <TableCell className="text-zinc-400 font-mono text-xs">
                      {artwork.owner_id ? `${artwork.owner_id.slice(0, 12)}...` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(artwork)}
                          className="hover:bg-zinc-800"
                        >
                          <Pencil className="w-4 h-4 text-zinc-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(artwork)}
                          className="hover:bg-red-500/10"
                          disabled={artwork.is_purchased && !artwork.is_refunded}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-zinc-500 text-sm mt-4">
        Total: {filteredArtworks.length} artworks
      </p>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add New Artwork</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Upload a new digital artwork to the platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-black border-zinc-800"
                placeholder="Artwork title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Artist Name *</Label>
              <Input
                value={formData.artist_name}
                onChange={(e) => setFormData({...formData, artist_name: e.target.value})}
                className="bg-black border-zinc-800"
                placeholder="Artist name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Price ($) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="bg-black border-zinc-800"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
                  <SelectItem value="space">Space</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-zinc-400">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-black border-zinc-800 min-h-[100px]"
                placeholder="Artwork description..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="bg-black border-zinc-800"
                placeholder="neon, abstract, digital"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Image File</Label>
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                className="bg-black border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Artwork'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Artwork</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update artwork details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-black border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Artist Name</Label>
              <Input
                value={formData.artist_name}
                onChange={(e) => setFormData({...formData, artist_name: e.target.value})}
                className="bg-black border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="bg-black border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
                  <SelectItem value="space">Space</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-zinc-400">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-black border-zinc-800 min-h-[100px]"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-zinc-400">Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="bg-black border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Artwork'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-red-500">Delete Artwork</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete "{selectedArtwork?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminArtworks;
