import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Fingerprint, ArrowRightLeft, Download, RefreshCw,
  Undo2, Receipt, Database, AlertTriangle, Shield, CheckCircle2
} from 'lucide-react';

const LicenseAgreementPage = () => {
  const sections = [
    {
      number: "1",
      icon: FileText,
      title: "Nature of the License",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            By purchasing an artwork on this platform, you acquire a unique digital artwork license.
          </p>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
            <p className="font-medium text-foreground mb-2">This license:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Represents exclusive ownership rights of the artwork
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Is assigned to one natural or legal person at a time
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                Is traceable, timestamped, and recorded by the platform
              </li>
            </ul>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">You are not purchasing a physical object.</span><br />
              <span className="text-foreground font-medium">You are not purchasing intellectual property.</span><br />
              You are acquiring a defined ownership and usage right under the following terms.
            </p>
          </div>
        </>
      )
    },
    {
      number: "2",
      icon: Fingerprint,
      title: "Exclusivity and Uniqueness",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Each artwork licensed through this platform is published as a single, exclusive license.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium text-foreground mb-2">At any time:</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• There is only one active license holder</li>
                <li>• No parallel licenses are issued</li>
                <li>• No partial ownership is permitted</li>
              </ul>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium text-foreground mb-2">Preview images displayed are:</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• Watermarked</li>
                <li>• Limited in resolution</li>
                <li>• Not representative of the licensed asset</li>
              </ul>
            </div>
          </div>
        </>
      )
    },
    {
      number: "3",
      icon: ArrowRightLeft,
      title: "License Transfer",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Upon successful payment completion:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The license is automatically assigned to your account
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The artwork is removed from primary availability
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              You become the sole license holder
            </li>
          </ul>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="font-medium text-foreground mb-2">At this stage, the license can still be:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Refunded</li>
              <li>• Transferred</li>
            </ul>
            <p className="text-primary text-sm mt-2 font-medium">
              Provided no irreversible action has occurred.
            </p>
          </div>
        </>
      )
    },
    {
      number: "4",
      icon: Download,
      title: "Usage and Irreversible Threshold",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            The license transitions to a used state when you:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Download the full-resolution artwork, or
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Otherwise access the artwork in a manner equivalent to full ownership
            </li>
          </ul>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="font-medium text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Once the license is marked as used:
            </p>
            <ul className="space-y-1 text-red-400/80 text-sm">
              <li>• Refund rights are permanently revoked</li>
              <li>• Transfer and resale rights are permanently revoked</li>
              <li>• The license becomes irrevocable and non-transferable</li>
            </ul>
            <p className="text-red-400 font-bold text-sm mt-3">
              This threshold is absolute.
            </p>
          </div>
        </>
      )
    },
    {
      number: "5",
      icon: RefreshCw,
      title: "Transfer and Resale Rights",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            If and only if the license remains unused:
          </p>
          <p className="text-primary font-medium mb-4">
            The license may be transferred or resold to another user through the platform.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium text-foreground mb-2">During transfer:</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• All rights, obligations, and restrictions move together</li>
                <li>• The original owner relinquishes all claim and control</li>
                <li>• The new owner assumes full responsibility</li>
              </ul>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="font-medium text-yellow-400 mb-2">Important:</p>
              <p className="text-yellow-400/80 text-sm">
                Transfers are final and cannot be reversed once completed.
              </p>
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
            Refunds are possible only when all of the following conditions are met:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The artwork has not been downloaded
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The artwork has not been transferred
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              The license remains unused
            </li>
          </ul>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
            <p className="text-primary font-medium text-sm">
              There is no maximum refund period as long as these conditions are met.
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="font-medium text-foreground mb-2">Refunds:</p>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Are processed to the original payment method</li>
              <li>• Exclude the non-refundable license protection fee</li>
              <li>• Eligibility is automatically determined by system status</li>
            </ul>
          </div>
        </>
      )
    },
    {
      number: "7",
      icon: Receipt,
      title: "Payments and Fees",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            The platform applies the following fees:
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center justify-between">
                <span>License Protection Fee</span>
                <span className="text-primary font-medium">Non-refundable</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Transfer / Resale Commission</span>
                <span className="text-muted-foreground">Applicable</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Withdrawal Fee</span>
                <span className="text-muted-foreground">If applicable</span>
              </li>
            </ul>
          </div>
          <p className="text-primary font-medium text-sm">
            Fees are clearly stated before confirmation.
          </p>
        </>
      )
    },
    {
      number: "8",
      icon: Database,
      title: "Platform Custody and Records",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            The platform:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Functions as a custody escrow system
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Maintains authoritative records of license status and ownership history
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Logs all critical actions immutably
            </li>
          </ul>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="text-primary font-medium text-sm">
              System records are considered authoritative in case of disputes.
            </p>
          </div>
        </>
      )
    },
    {
      number: "9",
      icon: AlertTriangle,
      title: "Limitations and Disclaimers",
      content: (
        <>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="font-medium text-red-400 mb-2">The platform does NOT:</p>
            <ul className="space-y-1 text-red-400/80 text-sm">
              <li>• Guarantee resale</li>
              <li>• Guarantee liquidity</li>
              <li>• Guarantee future value</li>
            </ul>
          </div>
          <p className="text-muted-foreground font-medium">
            Market outcomes are entirely the responsibility of the license holder.
          </p>
        </>
      )
    },
    {
      number: "10",
      icon: Shield,
      title: "Enforcement and Exceptional Intervention",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            The platform reserves the right to:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-center gap-2">
              <span className="text-yellow-500">•</span>
              Suspend transfers
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-500">•</span>
              Restrict withdrawals
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-500">•</span>
              Intervene in cases of fraud, legal obligation, or system abuse
            </li>
          </ul>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              Such actions are limited to exceptional circumstances and are documented internally.
            </p>
          </div>
        </>
      )
    },
    {
      number: "11",
      icon: CheckCircle2,
      title: "Acceptance",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            By purchasing, transferring, or using any artwork on this platform, you confirm that:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              You have read and understood this License Agreement
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              You accept all responsibilities and limitations described herein
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              You understand that certain actions are irreversible
            </li>
          </ul>
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
                License Agreement
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Digital Artwork License and Ownership Terms
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={section.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="card-glass overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <section.icon className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-primary font-mono text-sm font-bold">
                              {section.number.padStart(2, '0')}
                            </span>
                            <h2 className="font-serif text-lg md:text-xl font-bold text-foreground">
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

            {/* Final Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-12"
            >
              <Card className="card-glass border-primary/50 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                    Final Note
                  </h2>
                  <Separator className="max-w-xs mx-auto mb-6" />
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    This system is designed for <span className="text-primary font-medium">intentional ownership</span>, 
                    not experimentation.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

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

export default LicenseAgreementPage;
