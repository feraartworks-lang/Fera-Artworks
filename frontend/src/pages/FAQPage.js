import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronDown, Shield, ShoppingCart, Download, Undo2, 
  CreditCard, Database, Scale, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const faqCategories = [
    {
      id: 'account',
      icon: Shield,
      title: 'Account & Security',
      questions: [
        {
          q: 'What do I need to open an account?',
          a: 'A valid email address or a Web3 wallet connection is sufficient.'
        },
        {
          q: 'Can my account be suspended?',
          a: 'Yes, the platform may suspend accounts in cases of suspicious transactions, license violations, or legal situations. Suspension reasons are logged and communicated transparently.'
        }
      ]
    },
    {
      id: 'purchase',
      icon: ShoppingCart,
      title: 'Purchase & License',
      questions: [
        {
          q: 'What do I gain when I purchase an artwork?',
          a: 'With your purchase, you acquire the singular license for the artwork. The license covers P2P sales and usage; copyrights remain with the platform or artist.'
        },
        {
          q: 'What does "one of a kind in the world" mean?',
          a: 'There is no second license for the same artwork. The original file is visible only to the license holder for access.'
        },
        {
          q: 'Can I preview the artwork I purchased?',
          a: 'Yes, full-resolution preview is provided without downloading.'
        }
      ]
    },
    {
      id: 'download',
      icon: Download,
      title: 'Download & Usage',
      questions: [
        {
          q: 'Can I download the artwork after purchasing?',
          a: 'Yes, but with download:\n• Refund rights are permanently disabled\n• P2P resale is permanently closed\n• The action is irreversible'
        },
        {
          q: 'Can I view the artwork without downloading?',
          a: 'Yes. Full resolution is provided through the secure viewer, linked to your account.'
        }
      ]
    },
    {
      id: 'refund',
      icon: Undo2,
      title: 'Refund & P2P Sales',
      questions: [
        {
          q: 'Do I have refund rights?',
          a: 'Yes, but:\n• You must be the current license holder\n• The artwork must not have been downloaded or used'
        },
        {
          q: 'Can a refund be made after a P2P sale?',
          a: 'No. After sale, previous owners\' refund rights expire.'
        },
        {
          q: 'Who determines the P2P sale price?',
          a: 'The seller freely determines the price. The platform does not set prices.'
        }
      ]
    },
    {
      id: 'payments',
      icon: CreditCard,
      title: 'Payments',
      questions: [
        {
          q: 'Which payment methods are supported?',
          a: '• Open Banking / Account-to-Account (A2A)\n• Web3 wallets (MetaMask, etc.)\n\nCard and traditional payment systems are intentionally not supported.'
        },
        {
          q: 'Can I withdraw after payment?',
          a: 'Yes. P2P sales revenues can be withdrawn immediately. However, if there is a dispute or investigation, the transaction is put on hold.'
        },
        {
          q: 'Does the platform charge commission?',
          a: 'Yes:\n• License Protection Fee: 5%\n• P2P Sales Commission: 1%\n• Withdrawal Commission: 1%'
        }
      ]
    },
    {
      id: 'technical',
      icon: Database,
      title: 'Technical & Storage',
      questions: [
        {
          q: 'Where are artwork files stored?',
          a: 'They are kept in separate, secure, and encrypted storage infrastructures. Closed to unauthorized access.'
        },
        {
          q: 'Does the platform make transactions on my behalf?',
          a: 'No. The platform only provides automated transactions and clearing; it does not become a party.'
        }
      ]
    },
    {
      id: 'legal',
      icon: Scale,
      title: 'Legal & Liability',
      questions: [
        {
          q: 'Is the platform a party?',
          a: 'No. The platform is a technology provider.'
        },
        {
          q: 'What happens if I have a problem?',
          a: 'All records are logged. The system and support team reviews the request.'
        }
      ]
    }
  ];

  // Filter questions based on search
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

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
                Frequently Asked Questions
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Find answers to common questions about Imperial Art Gallery
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-muted/30"
              />
            </div>

            {/* FAQ Categories */}
            <div className="space-y-8">
              {filteredCategories.map((category, categoryIndex) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-foreground">
                      {category.title}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {category.questions.map((item, index) => {
                      const itemId = `${category.id}-${index}`;
                      const isOpen = openItems[itemId];

                      return (
                        <Card 
                          key={itemId} 
                          className="card-glass overflow-hidden cursor-pointer"
                          onClick={() => toggleItem(itemId)}
                        >
                          <CardContent className="p-0">
                            <div className="p-4 flex items-center justify-between">
                              <span className="font-medium text-foreground pr-4">
                                {item.q}
                              </span>
                              <ChevronDown 
                                className={`w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="px-4 pb-4 pt-0">
                                    <div className="border-t border-border pt-4">
                                      <p className="text-muted-foreground whitespace-pre-line">
                                        {item.a}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* No Results */}
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No questions found matching "{searchTerm}"
                </p>
              </div>
            )}

            {/* Still Have Questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-12"
            >
              <Card className="card-glass border-primary/30 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                    Still Have Questions?
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <a 
                    href="/contact" 
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    Contact Support →
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
