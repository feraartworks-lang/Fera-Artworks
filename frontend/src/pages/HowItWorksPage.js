import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  FileWarning, Eye, ShoppingCart, Lock, RefreshCw, 
  Undo2, Wallet, Shield, AlertTriangle, CheckCircle2,
  Gem, ArrowRight
} from 'lucide-react';

const HowItWorksPage = () => {
  const sections = [
    {
      number: "I",
      icon: FileWarning,
      title: "This Is Not a File Purchase",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            You are not buying a downloadable art file. You are purchasing a unique licensed digital artwork with defined rights, limitations, and irreversible thresholds.
          </p>
          <p className="text-[#D4AF37] font-medium">
            Ownership here is legal, traceable, and exclusive — not casual or temporary.
          </p>
        </>
      )
    },
    {
      number: "II",
      icon: Eye,
      title: "Preview Comes First. Ownership Comes Later.",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            All artworks are displayed in watermarked, limited preview form.
          </p>
          <div className="border border-[#D4AF37]/20 p-5 mb-4 bg-[#0A0A0A]">
            <p className="font-serif text-[#F5F5F0] mb-3">Before purchase:</p>
            <ul className="space-y-2 text-[#A3A3A3]">
              <li className="flex items-center gap-3">
                <span className="text-[#4A0404]">✗</span> No full-resolution access
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#4A0404]">✗</span> No file ownership
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#4A0404]">✗</span> No transferable rights
              </li>
            </ul>
          </div>
          <p className="text-[#D4AF37] font-medium">
            This guarantees that ownership begins only at the moment of purchase.
          </p>
        </>
      )
    },
    {
      number: "III",
      icon: ShoppingCart,
      title: "Buying a License ≠ Buying a File",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            When you complete a purchase, you become the exclusive license holder of that artwork. You can:
          </p>
          <ul className="space-y-2 text-[#A3A3A3] mb-4">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> View the full artwork securely
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> Download the original file (one-time, irreversible)
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> Resell your license (if unused)
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> Request a refund (if unused)
            </li>
          </ul>
          <div className="border-l-2 border-[#D4AF37] pl-4">
            <p className="text-[#D4AF37] font-medium">
              5% License Protection Fee applies to each purchase and is non-refundable.
            </p>
          </div>
        </>
      )
    },
    {
      number: "IV",
      icon: Lock,
      title: "Secure Viewer: See It, Don't Own the File Yet",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            After purchase, you can view the full artwork in our Secure Viewer. This is a protected viewing environment where:
          </p>
          <ul className="space-y-2 text-[#A3A3A3] mb-4">
            <li className="flex items-center gap-3">
              <span className="text-[#D4AF37]">•</span> Right-click is disabled
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#D4AF37]">•</span> Screenshots are deterred
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#D4AF37]">•</span> The file is never exposed to the browser
            </li>
          </ul>
          <p className="text-[#D4AF37] font-medium">
            If you only view the artwork and never download, your refund and resale rights remain intact.
          </p>
        </>
      )
    },
    {
      number: "V",
      icon: AlertTriangle,
      title: "Download = Permanent Consumption",
      content: (
        <>
          <div className="border border-[#4A0404] p-5 bg-[#4A0404]/10 mb-4">
            <p className="text-[#F5F5F0] font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#8B0000]" strokeWidth={1.5} />
              IRREVERSIBLE ACTION
            </p>
            <p className="text-[#A3A3A3]">
              Clicking "Download" means you fully consume the license. You will receive the full-resolution file, but:
            </p>
          </div>
          <ul className="space-y-2 text-[#A3A3A3] mb-4">
            <li className="flex items-center gap-3">
              <span className="text-[#4A0404]">✗</span> No refund is possible
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#4A0404]">✗</span> No resale is possible
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#4A0404]">✗</span> The license is permanently "used"
            </li>
          </ul>
          <p className="text-[#D4AF37] font-medium">
            This is a one-way door. Think of it as breaking the seal on a collectible.
          </p>
        </>
      )
    },
    {
      number: "VI",
      icon: RefreshCw,
      title: "Resale (P2P): Only for Unused Licenses",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            If you haven't downloaded the artwork, you can list it for resale on our peer-to-peer marketplace. When sold:
          </p>
          <ul className="space-y-2 text-[#A3A3A3] mb-4">
            <li className="flex items-center gap-3">
              <span className="text-[#D4AF37]">•</span> The license transfers to the new buyer
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#D4AF37]">•</span> A 1% platform commission applies
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#D4AF37]">•</span> You lose all rights to the artwork
            </li>
          </ul>
          <div className="border-l-2 border-[#D4AF37] pl-4">
            <p className="text-[#D4AF37] font-medium">
              The new buyer inherits all rights, including refund and resale options (if they don't download either).
            </p>
          </div>
        </>
      )
    },
    {
      number: "VII",
      icon: Undo2,
      title: "Refunds: Possible, But Conditional",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            You can request a full refund minus the 5% License Protection Fee if:
          </p>
          <ul className="space-y-2 text-[#A3A3A3] mb-4">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> You haven't downloaded the file
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> You haven't transferred/resold the license
            </li>
          </ul>
          <p className="text-[#D4AF37] font-medium">
            This is a lifetime guarantee — no deadline. But once you download, the option vanishes forever.
          </p>
        </>
      )
    },
    {
      number: "VIII",
      icon: Wallet,
      title: "Payments: Crypto or Bank Transfer",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            We support multiple payment methods:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="border border-[#D4AF37]/20 p-5 bg-[#0A0A0A]">
              <p className="font-serif text-[#F5F5F0] mb-2">Bank Transfer (A2A)</p>
              <p className="text-[#525252] text-sm">Manual reconciliation with unique reference codes</p>
            </div>
            <div className="border border-[#D4AF37]/20 p-5 bg-[#0A0A0A]">
              <p className="font-serif text-[#F5F5F0] mb-2">USDT (Crypto)</p>
              <p className="text-[#525252] text-sm">Blockchain-based payments with admin verification</p>
            </div>
          </div>
          <p className="text-[#525252] text-sm">
            Withdrawals incur a 1% platform fee. All transactions are logged for transparency.
          </p>
        </>
      )
    },
    {
      number: "IX",
      icon: Shield,
      title: "Security & Authenticity",
      content: (
        <>
          <p className="text-[#A3A3A3] mb-4 leading-relaxed">
            Every artwork has a unique License ID that proves:
          </p>
          <ul className="space-y-2 text-[#A3A3A3] mb-4">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> Authenticity of the piece
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> Chain of ownership
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} /> Current license status (used/unused)
            </li>
          </ul>
          <p className="text-[#D4AF37] font-medium">
            We maintain complete audit logs for all platform activities.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="how-it-works-page">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="flex justify-center mb-6">
              <Gem className="w-12 h-12 text-[#D4AF37]" strokeWidth={1} />
            </div>
            <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] mb-4">Understanding Ownership</p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#F5F5F0] mb-6">
              How It Works
            </h1>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
              <Gem className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
            </div>
            <p className="text-[#A3A3A3] text-lg max-w-2xl mx-auto leading-relaxed">
              Before purchasing any artwork, please read this entire guide. It explains our unique license-based ownership model and the irreversible nature of certain actions.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.number}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="border border-[#D4AF37]/10 bg-[#080808] p-8 relative">
                  {/* Section Number */}
                  <div className="absolute -top-4 left-8 bg-[#050505] px-4">
                    <span className="font-serif text-2xl text-[#D4AF37]">{section.number}</span>
                  </div>
                  
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6 pt-2">
                    <div className="w-12 h-12 border border-[#D4AF37]/30 flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
                    </div>
                    <h2 className="font-serif text-xl text-[#F5F5F0]">{section.title}</h2>
                  </div>
                  
                  {/* Content */}
                  <div className="pl-16">
                    {section.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-20"
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-24 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
              <Gem className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
              <div className="w-24 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
            </div>
            <p className="text-[#A3A3A3] mb-8">
              Ready to explore our collection?
            </p>
            <Link to="/gallery">
              <Button className="btn-gold px-12 py-5">
                Browse Gallery
                <ArrowRight className="ml-3 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
