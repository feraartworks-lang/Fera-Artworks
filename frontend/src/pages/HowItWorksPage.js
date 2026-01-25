import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  FileWarning, Eye, ShoppingCart, Lock, RefreshCw, 
  Undo2, Wallet, Shield, AlertTriangle, CheckCircle2
} from 'lucide-react';

const HowItWorksPage = () => {
  const sections = [
    {
      number: "1",
      icon: FileWarning,
      title: "This Is Not a File Purchase",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            You are not buying a downloadable art file. You are purchasing a unique licensed digital artwork with defined rights, limitations, and irreversible thresholds.
          </p>
          <p className="text-primary font-medium">
            Ownership here is legal, traceable, and exclusive — not casual or temporary.
          </p>
        </>
      )
    },
    {
      number: "2",
      icon: Eye,
      title: "Preview Comes First. Ownership Comes Later.",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            All artworks are displayed in watermarked, limited preview form.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <p className="font-medium text-foreground mb-2">Before purchase:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span> No full-resolution access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span> No file ownership
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span> No transferable rights
              </li>
            </ul>
          </div>
          <p className="text-primary font-medium">
            This guarantees that ownership begins only at the moment of purchase.
          </p>
        </>
      )
    },
    {
      number: "3",
      icon: ShoppingCart,
      title: "Purchase = License Assignment",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Once purchase is complete:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The artwork license is immediately assigned to your account
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              You become the sole license holder
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The artwork is removed from primary sale
            </li>
          </ul>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="font-medium text-foreground mb-2">At this stage:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• The license is still transferable or refundable</li>
              <li>• No irreversible action has occurred yet</li>
              <li>• Ownership exists — final use has not yet begun</li>
            </ul>
          </div>
        </>
      )
    },
    {
      number: "4",
      icon: Lock,
      title: "The Point of No Return: Usage",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            When you choose to download or use the artwork:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Full-resolution access is granted
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              The action is recorded with timestamp and your identity
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              The license transitions to a used state
            </li>
          </ul>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="font-medium text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              From this moment:
            </p>
            <ul className="space-y-1 text-red-400/80 text-sm">
              <li>• Refunds are permanently disabled</li>
              <li>• Resale and transfer are permanently disabled</li>
            </ul>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="font-medium text-foreground mb-2">This threshold exists to protect:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• The integrity of the artwork</li>
              <li>• The rights of future owners</li>
              <li>• The legitimacy of ownership claims</li>
            </ul>
          </div>
        </>
      )
    },
    {
      number: "5",
      icon: RefreshCw,
      title: "Transfer and Resale (Before Usage Only)",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            If an artwork has not been downloaded or used, the license can be transferred or resold peer-to-peer.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium text-foreground mb-2">During transfer:</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• All rights pass together</li>
                <li>• All responsibilities move together</li>
                <li>• The original owner retains no control or claim</li>
              </ul>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium text-foreground mb-2">After transfer:</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• The previous owner loses all authority</li>
                <li>• The new owner assumes full responsibility</li>
                <li>• Transfers are final and atomic</li>
              </ul>
            </div>
          </div>
        </>
      )
    },
    {
      number: "6",
      icon: Undo2,
      title: "Refund Policy",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Refunds are only possible when all conditions are met:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The artwork has not been downloaded
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The artwork has not been transferred yet
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The license remains unused
            </li>
          </ul>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <ul className="space-y-1 text-yellow-400/90 text-sm">
              <li>• The license protection fee is non-refundable</li>
              <li>• Refunds are issued to the original payment method</li>
            </ul>
          </div>
        </>
      )
    },
    {
      number: "7",
      icon: Wallet,
      title: "Payment and Withdrawal",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Payments are processed through direct bank-to-bank (A2A) systems and supported by Web3 wallets.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <p className="font-medium text-foreground mb-2">Funds from:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Primary sales</li>
              <li>• Resales</li>
            </ul>
            <p className="text-muted-foreground text-sm mt-2">
              Can be withdrawn after transaction completion.
            </p>
          </div>
          <p className="text-primary font-medium text-sm">
            Withdrawal fees apply.
          </p>
        </>
      )
    },
    {
      number: "8",
      icon: Shield,
      title: "What This Platform Is — And Is Not",
      content: (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="font-medium text-red-400 mb-2">This platform does NOT:</p>
              <ul className="space-y-1 text-red-400/80 text-sm">
                <li>• Guarantee liquidity</li>
                <li>• Promise resale</li>
                <li>• Protect against market outcomes</li>
              </ul>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="font-medium text-green-400 mb-2">This platform DOES:</p>
              <ul className="space-y-1 text-green-400/80 text-sm">
                <li>• Define ownership clearly</li>
                <li>• Enforce irreversible thresholds</li>
                <li>• Protect artistic and legal integrity</li>
              </ul>
            </div>
          </div>
        </>
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
                How It Works
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Understanding digital art ownership, licensing, and your rights on Imperial Art Gallery
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={section.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="card-glass overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <section.icon className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-primary font-mono text-sm font-bold">
                              {section.number.padStart(2, '0')}
                            </span>
                            <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground">
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

            {/* Final Acknowledgment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="mt-12"
            >
              <Card className="card-glass border-primary/50 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                    Final Acknowledgment
                  </h2>
                  <Separator className="max-w-xs mx-auto mb-6" />
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    By using this platform, you acknowledge that ownership here carries 
                    <span className="text-primary font-medium"> weight</span>, 
                    <span className="text-primary font-medium"> consequence</span>, and 
                    <span className="text-primary font-medium"> permanence</span>.
                  </p>
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

export default HowItWorksPage;
