import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Send, Clock, Shield, FileText, AlertCircle,
  Headphones, CreditCard, Key, HelpCircle, Upload, X, Loader2
} from 'lucide-react';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accountId: '',
    subject: '',
    message: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const subjectOptions = [
    { value: 'technical', label: 'Technical Support', icon: Headphones },
    { value: 'payment', label: 'Payment / Withdrawal', icon: CreditCard },
    { value: 'license', label: 'License / P2P Issue', icon: Key },
    { value: 'general', label: 'General Inquiry', icon: HelpCircle }
  ];

  const responseTimes = [
    { category: 'Technical Issues', time: '24-48 hours', color: 'text-green-400' },
    { category: 'Payment / P2P Issues', time: '48-72 hours', color: 'text-yellow-400' },
    { category: 'License / Legal Questions', time: '3-5 business days', color: 'text-orange-400' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message') {
      if (value.length <= 500) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setCharCount(value.length);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Your request has been submitted successfully. You will receive a confirmation email shortly.');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      accountId: '',
      subject: '',
      message: ''
    });
    setFile(null);
    setCharCount(0);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                Contact Us
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Platform support handles technical, transaction, and license-related inquiries only.
              </p>
            </div>

            {/* Notice */}
            <Card className="card-glass border-yellow-500/30 bg-yellow-500/5 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Response time may vary depending on the nature of your request. All requests are logged.
                      Please submit your request with clear, concise, and accurate information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="font-serif flex items-center gap-2">
                      <Send className="w-5 h-5 text-primary" />
                      Submit a Request
                    </CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Name / Username <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your name or username"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          required
                        />
                      </div>

                      {/* Account/License ID */}
                      <div className="space-y-2">
                        <Label htmlFor="accountId">
                          Account ID / License ID <span className="text-muted-foreground text-xs">(if applicable)</span>
                        </Label>
                        <Input
                          id="accountId"
                          name="accountId"
                          value={formData.accountId}
                          onChange={handleInputChange}
                          placeholder="e.g., user_xxxxx or lic_xxxxx"
                        />
                      </div>

                      {/* Subject */}
                      <div className="space-y-2">
                        <Label>
                          Subject / Request Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjectOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="w-4 h-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="message">
                            Your Message <span className="text-red-500">*</span>
                          </Label>
                          <span className={`text-xs ${charCount >= 450 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                            {charCount}/500
                          </span>
                        </div>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Describe your issue or inquiry in detail..."
                          className="min-h-[150px] resize-none"
                          required
                        />
                      </div>

                      {/* File Upload */}
                      <div className="space-y-2">
                        <Label>
                          File Attachment <span className="text-muted-foreground text-xs">(optional, supporting documents only)</span>
                        </Label>
                        {!file ? (
                          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                            <input
                              type="file"
                              id="file-upload"
                              className="hidden"
                              onChange={handleFileChange}
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, PNG, JPG, DOC (max 5MB)
                              </p>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-primary" />
                              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Disclaimer */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">
                          By submitting this form, you acknowledge that the information you provide will be added to 
                          platform records and your request will be used only for relevant processes. The platform is 
                          obligated to review your request; no guarantee of action or outcome is provided.
                        </p>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full btn-primary h-12"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Request
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Response Times */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Response Times
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {responseTimes.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{item.category}</span>
                        <span className={`text-sm font-medium ${item.color}`}>{item.time}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* About Support Process */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      About the Process
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        Automatic confirmation email is sent after submission
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        Support team responds only to specified categories
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        All interactions are recorded in immutable logs
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Support Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subjectOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <option.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{option.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUsPage;
