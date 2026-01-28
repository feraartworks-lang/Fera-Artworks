import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, Image, Eye, Undo2, CreditCard, RefreshCw, 
  Database, Scale, Mail, ChevronRight, HelpCircle
} from 'lucide-react';

const HelpCenterPage = () => {
  const sections = [
    {
      id: 'account',
      icon: Shield,
      title: 'Account & Security',
      items: [
        {
          q: 'What do I need to open an account?',
          a: 'You can easily open an account using the specified methods.'
        },
        {
          q: 'Can my account be suspended?',
          a: 'Yes. In the following cases:\n• License and copyright violation\n• Legal obligations\n\nSuspension is an extremely exceptional situation and the reason is recorded.'
        }
      ]
    },
    {
      id: 'artworks',
      icon: Image,
      title: 'Artworks',
      items: [
        {
          q: 'What do I gain when I purchase an artwork?',
          a: 'With your purchase:\n• You become the singular license holder of the artwork\n• You have the right to resell the artwork\n• All control over the artwork on the platform passes to you\n\nCopyright is not transferred unless otherwise specified.'
        },
        {
          q: 'What does "one of a kind in the world" mean?',
          a: 'This expression means:\n• There is no second license for the same artwork\n• The original, non-watermarked file is accessible only to the current license holder'
        }
      ]
    },
    {
      id: 'viewing',
      icon: Eye,
      title: 'Viewing & Download',
      items: [
        {
          q: 'Can I view the artwork before purchasing?',
          a: 'Yes.\n• Low resolution\n• Watermarked\n• Non-downloadable preview is provided'
        },
        {
          q: 'Can I download after purchasing?',
          a: 'Yes.\nHowever, when downloaded:\n• Refund rights are permanently disabled\n• P2P resale is permanently closed\n\nThis action is irreversible.'
        },
        {
          q: 'Can I view without downloading?',
          a: 'Yes.\n• Full resolution\n• Linked to your account\n• Through secure viewer'
        }
      ]
    },
    {
      id: 'refund',
      icon: Undo2,
      title: 'Refund Policy',
      items: [
        {
          q: 'Do I have refund rights?',
          a: 'Yes, but only if:\n• You are the current license holder\n• The artwork has not been downloaded or used'
        },
        {
          q: 'Can a refund be made after P2P sale?',
          a: 'No.\n• After the sale, previous owners\' refund rights expire'
        }
      ]
    },
    {
      id: 'payments',
      icon: CreditCard,
      title: 'Payments',
      items: [
        {
          q: 'Which payment methods are supported?',
          a: '• Open Banking / A2A\n• Web3 wallets\n\nCard and traditional payment systems are intentionally not used.'
        },
        {
          q: 'Can I withdraw after payment?',
          a: 'Yes.\n• P2P sales revenues can be withdrawn immediately\n• Withdrawals are processed automatically'
        },
        {
          q: 'What are the commissions?',
          a: '• License Protection Fee: 5%\n• P2P Sales Commission: 1%\n• Withdrawal Commission: 1%\n\nThese deductions are clearly shown during the transaction.'
        }
      ]
    },
    {
      id: 'p2p',
      icon: RefreshCw,
      title: 'P2P (Resale)',
      items: [
        {
          q: 'Can I sell my artwork at any price I want?',
          a: 'Yes.\nThe price is entirely determined by the seller.'
        },
        {
          q: 'What happens to my money after P2P sale?',
          a: '• Sales proceeds are instantly reflected in your account\n• You can request a withdrawal'
        }
      ]
    },
    {
      id: 'technical',
      icon: Database,
      title: 'Technical Questions',
      items: [
        {
          q: 'Where are artwork files stored?',
          a: '• In separate and secure storage infrastructures\n• In encrypted format\n• Closed to unauthorized access'
        },
        {
          q: 'Does the platform make transactions on my behalf?',
          a: 'No.\nThe platform:\n• Holds in custody\n• Automates transfers\n• Does not become a party'
        }
      ]
    },
    {
      id: 'legal',
      icon: Scale,
      title: 'Legal Matters',
      items: [
        {
          q: 'Is the platform a party?',
          a: 'No.\nThe platform is a technology provider.'
        },
        {
          q: 'What happens if I have a problem?',
          a: '• Records are reviewed\n• System logs are taken as basis\n• Shared with legal authorities if necessary'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                Help Center
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                This page is prepared for you to quickly and clearly understand how the platform works. 
                Answers are technical, short, and clear. Ambiguity is specifically eliminated.
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {sections.slice(0, 4).map((section) => (
                <a 
                  key={section.id}
                  href={`#${section.id}`}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-center group"
                >
                  <section.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {section.title}
                  </span>
                </a>
              ))}
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {sections.map((section, sectionIndex) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: sectionIndex * 0.05 }}
                >
                  <Card className="card-glass overflow-hidden">
                    <CardHeader className="border-b border-border/50">
                      <CardTitle className="font-serif flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <section.icon className="w-5 h-5 text-primary" />
                        </div>
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {section.items.map((item, index) => (
                        <div 
                          key={index}
                          className={`p-6 ${index !== section.items.length - 1 ? 'border-b border-border/30' : ''}`}
                        >
                          <h3 className="font-medium text-foreground mb-3 flex items-start gap-2">
                            <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            {item.q}
                          </h3>
                          <div className="pl-7">
                            <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12"
            >
              <Card className="card-glass border-primary/30 bg-primary/5">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-serif text-xl font-bold text-foreground">
                          Contact
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          For questions, technical requests, or notifications
                        </p>
                      </div>
                    </div>
                    <a 
                      href="mailto:contact@imperialartgallery.com"
                      className="flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      contact@imperialartgallery.com
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Related Links */}
            <div className="mt-12 grid md:grid-cols-3 gap-4">
              <Link to="/faq" className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    FAQ
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
              <Link to="/how-it-works" className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    How It Works
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
              <Link to="/contact" className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    Contact Us
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpCenterPage;
