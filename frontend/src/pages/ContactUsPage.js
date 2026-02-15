import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Send, Clock, Headphones, CreditCard, Key, HelpCircle, 
  Loader2, Crown, Gem, Mail, User, MessageSquare
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const subjectOptions = [
    { value: 'technical', label: 'Technical Support', icon: Headphones },
    { value: 'payment', label: 'Payment / Withdrawal', icon: CreditCard },
    { value: 'license', label: 'License / P2P Issue', icon: Key },
    { value: 'general', label: 'General Inquiry', icon: HelpCircle }
  ];

  const responseTimes = [
    { category: 'Technical Issues', time: '24-48 hours', color: 'text-[#D4AF37]' },
    { category: 'Payment / P2P Issues', time: '48-72 hours', color: 'text-[#B8860B]' },
    { category: 'License / Legal Questions', time: '3-5 business days', color: 'text-[#8A7028]' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'message') {
      setCharCount(value.length);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API}/contact`, {
        name: formData.name,
        email: formData.email,
        subject: subjectOptions.find(s => s.value === formData.subject)?.label || formData.subject,
        message: formData.message
      });
      
      toast.success('Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setCharCount(0);
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="contact-page">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center mb-6">
              <Crown className="w-12 h-12 text-[#D4AF37]" strokeWidth={1} />
            </div>
            <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4">Get in Touch</p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#F5F5F0] mb-6">
              Contact Us
            </h1>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
              <Gem className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
            </div>
            <p className="text-[#A3A3A3] text-lg max-w-2xl mx-auto">
              Have a question or need assistance? Our team is here to help you with any inquiries about licenses, payments, or technical support.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="border border-[#D4AF37]/20 bg-[#080808] p-8">
                <h2 className="font-serif text-2xl text-[#F5F5F0] mb-6">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                        Full Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.5} />
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your name"
                          className="pl-12 h-12 bg-transparent border-[#333] focus:border-[#D4AF37] text-[#F5F5F0] placeholder:text-[#444]"
                          required
                          data-testid="contact-name-input"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" strokeWidth={1.5} />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                          className="pl-12 h-12 bg-transparent border-[#333] focus:border-[#D4AF37] text-[#F5F5F0] placeholder:text-[#444]"
                          required
                          data-testid="contact-email-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                      Subject *
                    </Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                      <SelectTrigger className="h-12 bg-transparent border-[#333] text-[#F5F5F0]" data-testid="contact-subject-select">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-[#333]">
                        {subjectOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="text-[#F5F5F0] focus:bg-[#D4AF37]/10 focus:text-[#D4AF37]"
                          >
                            <div className="flex items-center gap-2">
                              <option.icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[#A3A3A3] text-xs uppercase tracking-wider">
                      Message *
                    </Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-[#525252]" strokeWidth={1.5} />
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Describe your question or issue in detail..."
                        className="pl-12 min-h-[150px] bg-transparent border-[#333] focus:border-[#D4AF37] text-[#F5F5F0] placeholder:text-[#444] resize-none"
                        maxLength={2000}
                        required
                        data-testid="contact-message-input"
                      />
                    </div>
                    <p className="text-xs text-[#525252] text-right">{charCount}/2000</p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full btn-gold h-14"
                    disabled={isSubmitting}
                    data-testid="contact-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Response Times */}
              <div className="border border-[#D4AF37]/20 bg-[#080808] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                  <h3 className="font-serif text-lg text-[#F5F5F0]">Response Times</h3>
                </div>
                <div className="space-y-4">
                  {responseTimes.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-[#D4AF37]/10 last:border-0">
                      <span className="text-[#A3A3A3] text-sm">{item.category}</span>
                      <span className={`font-mono text-sm ${item.color}`}>{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Contact */}
              <div className="border border-[#D4AF37]/20 bg-[#080808] p-6">
                <h3 className="font-serif text-lg text-[#F5F5F0] mb-4">Direct Contact</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#525252] uppercase tracking-wider mb-1">Email</p>
                    <a href="mailto:contact@imperialartgallery.com" className="text-[#D4AF37] hover:underline text-sm">
                      contact@imperialartgallery.com
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-[#525252] uppercase tracking-wider mb-1">Business Hours</p>
                    <p className="text-[#A3A3A3] text-sm">Monday - Friday, 9:00 AM - 6:00 PM (UTC)</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="border border-[#D4AF37]/20 bg-[#080808] p-6">
                <h3 className="font-serif text-lg text-[#F5F5F0] mb-4">Quick Links</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/faq" className="text-[#A3A3A3] hover:text-[#D4AF37] text-sm transition-colors">
                      → Frequently Asked Questions
                    </a>
                  </li>
                  <li>
                    <a href="/help-center" className="text-[#A3A3A3] hover:text-[#D4AF37] text-sm transition-colors">
                      → Help Center
                    </a>
                  </li>
                  <li>
                    <a href="/how-it-works" className="text-[#A3A3A3] hover:text-[#D4AF37] text-sm transition-colors">
                      → How It Works
                    </a>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUsPage;
