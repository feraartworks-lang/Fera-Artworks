import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, Globe, UserCircle, Image, FileKey, CreditCard,
  Undo2, RefreshCw, Ban, ShieldAlert, Settings, Copyright, 
  RefreshCcw, Mail
} from 'lucide-react';

const TermsOfServicePage = () => {
  const sections = [
    {
      number: "1",
      icon: CheckCircle2,
      title: "Acceptance",
      content: (
        <p className="text-muted-foreground">
          Anyone who accesses this platform or uses its services is deemed to have read, understood, and accepted these Terms of Service. Users who do not accept the terms should not use the platform.
        </p>
      )
    },
    {
      number: "2",
      icon: Globe,
      title: "Nature of the Platform",
      content: (
        <p className="text-muted-foreground">
          This platform is an intermediary that provides technical infrastructure for the sale, transfer, and licensing of artworks. The platform is not a party on behalf of buyers, sellers, or artists.
        </p>
      )
    },
    {
      number: "3",
      icon: UserCircle,
      title: "User Accounts",
      content: (
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Users are obligated to provide accurate and up-to-date information.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Each user may only transact on their own behalf.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            The platform reserves the right to suspend or terminate accounts in case of security concerns or suspected violations.
          </li>
        </ul>
      )
    },
    {
      number: "4",
      icon: Image,
      title: "Artworks and Ownership",
      content: (
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Ownership of artworks passes to the buyer upon delivery.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Copyright of artworks belongs to the artist or rights holder unless explicitly stated otherwise.
          </li>
        </ul>
      )
    },
    {
      number: "5",
      icon: FileKey,
      title: "Licensing",
      content: (
        <>
          <p className="text-muted-foreground mb-4">Purchased digital artworks:</p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Include a limited license for personal and non-commercial use.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Reproduction, redistribution, NFT creation, or derivative works are prohibited unless explicitly stated otherwise.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Purchase does not mean copyright transfer unless explicitly stated otherwise.
            </li>
          </ul>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Details are explained on the <Link to="/license-agreement" className="text-primary hover:underline font-medium">License Agreement</Link> page.
            </p>
          </div>
        </>
      )
    },
    {
      number: "6",
      icon: CreditCard,
      title: "Payment and Escrow System",
      content: (
        <>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Payments are received through third-party payment infrastructures provided or integrated by the platform.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              In some transactions, funds may be held in an escrow system.
            </li>
          </ul>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 font-medium text-sm">
              The platform is ABSOLUTELY NOT a bank or payment institution.
            </p>
          </div>
        </>
      )
    },
    {
      number: "7",
      icon: Undo2,
      title: "Refund Policy",
      content: (
        <>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Refund rights belong only to the owner who purchased the artwork through the platform.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              After secondary sale (P2P), previous owners' refund rights expire.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Refund rights are permanently disabled in case of downloading or permanent use of digital content.
            </li>
          </ul>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              Refund conditions may vary depending on the artwork and usage status.
            </p>
          </div>
        </>
      )
    },
    {
      number: "8",
      icon: RefreshCw,
      title: "Secondary Sales (P2P)",
      content: (
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Users can put the artworks they own up for resale.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            After resale, all rights and obligations pass to the new buyer.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            The platform receives commission or artist share (royalty) from secondary sales.
          </li>
        </ul>
      )
    },
    {
      number: "9",
      icon: Ban,
      title: "Prohibited Activities",
      content: (
        <>
          <p className="text-muted-foreground mb-4">The following actions are strictly prohibited:</p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <ul className="space-y-2 text-red-400/90 text-sm">
              <li className="flex items-start gap-2">
                <span>•</span>
                Copyright infringement
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                Misusing platform infrastructure
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                Violating the rights of others
              </li>
            </ul>
          </div>
        </>
      )
    },
    {
      number: "10",
      icon: ShieldAlert,
      title: "Limitation of Liability",
      content: (
        <>
          <p className="text-muted-foreground mb-4">The platform cannot be held responsible for:</p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              The artistic or financial value of artworks
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Disputes between buyers and sellers
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Interruptions of third-party service providers
            </li>
          </ul>
        </>
      )
    },
    {
      number: "11",
      icon: Settings,
      title: "Modification of Service",
      content: (
        <p className="text-muted-foreground">
          The platform reserves the right to temporarily or permanently modify, suspend, or terminate its services.
        </p>
      )
    },
    {
      number: "12",
      icon: Copyright,
      title: "Intellectual Property",
      content: (
        <p className="text-muted-foreground">
          All software, design, text, and brand elements belonging to the platform cannot be used without permission.
        </p>
      )
    },
    {
      number: "13",
      icon: RefreshCcw,
      title: "Updates",
      content: (
        <p className="text-muted-foreground">
          These Terms of Service may be updated when deemed necessary. The current version comes into effect as soon as it is published.
        </p>
      )
    },
    {
      number: "14",
      icon: Mail,
      title: "Contact",
      content: (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-muted-foreground mb-2">For questions:</p>
          <a href="mailto:contact@imperialartgallery.com" className="text-primary font-medium flex items-center gap-2 hover:underline">
            <Mail className="w-4 h-4" />
            contact@imperialartgallery.com
          </a>
        </div>
      )
    }
  ];

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
                Terms of Service
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Please read these terms carefully before using our platform
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={section.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                >
                  <Card className="card-glass overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <section.icon className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-primary font-mono text-sm font-bold">
                              {section.number.padStart(2, '0')}
                            </span>
                            <h2 className="font-serif text-lg font-bold text-foreground">
                              {section.title}
                            </h2>
                          </div>
                          {section.content}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Last Updated */}
            <div className="text-center mt-8 text-muted-foreground text-sm">
              Last updated: January 2025
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
