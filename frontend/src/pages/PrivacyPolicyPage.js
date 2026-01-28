import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Database, Target, CreditCard, HardDrive, 
  Share2, Cookie, UserCheck, Shield, RefreshCw, Mail
} from 'lucide-react';

const PrivacyPolicyPage = () => {
  const sections = [
    {
      number: "1",
      icon: FileText,
      title: "Introduction",
      content: (
        <p className="text-muted-foreground">
          This Privacy Policy explains how personal data of visitors and users using services offered through Imperial Art Gallery is collected, used, and protected. The platform considers your privacy and data security as a fundamental principle.
        </p>
      )
    },
    {
      number: "2",
      icon: Database,
      title: "Data Collected",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            The platform collects only limited data necessary for service provision:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Name, surname (optional)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Email address
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Payment and transaction information (limited and technical level on bank/crypto side)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Web3 wallet addresses (not considered personal identification information)
            </li>
          </ul>
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="text-primary text-sm font-medium">
              The platform does not request identity documents, biometric data, or unnecessary personal information.
            </p>
          </div>
        </>
      )
    },
    {
      number: "3",
      icon: Target,
      title: "Purpose of Data Use",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Collected data is used for the following purposes:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Execution of purchase and license transactions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Management of payment and refund processes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Ensuring user security
            </li>
          </ul>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm font-medium">
              Data is not used or shared for advertising, sales, or third-party marketing purposes.
            </p>
          </div>
        </>
      )
    },
    {
      number: "4",
      icon: CreditCard,
      title: "Payment and Financial Data",
      content: (
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            The platform does not directly store credit card or bank information.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Bank transfer and Open Banking (A2A) transactions are executed by relevant financial institutions.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            In crypto and Web3 payments, only transaction verification is performed; private keys are never held by the Platform.
          </li>
        </ul>
      )
    },
    {
      number: "5",
      icon: HardDrive,
      title: "Data Storage",
      content: (
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Personal data is stored only for as long as necessary.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            High-resolution artworks and digital content are protected on secure servers or professional cloud infrastructures.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Data stored on local devices is the user's own responsibility.
          </li>
        </ul>
      )
    },
    {
      number: "6",
      icon: Share2,
      title: "Data Sharing",
      content: (
        <>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="font-medium text-red-400 mb-2">The platform does NOT:</p>
            <ul className="space-y-1 text-red-400/80 text-sm">
              <li>• Sell user data to third parties</li>
              <li>• Rent user data</li>
              <li>• Share for commercial purposes</li>
            </ul>
          </div>
          <p className="text-muted-foreground mb-2">
            Limited sharing may only occur in the following situations:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Prevention of fraud and security breaches
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Technical requirements with payment infrastructure providers
            </li>
          </ul>
        </>
      )
    },
    {
      number: "7",
      icon: Cookie,
      title: "Cookies",
      content: (
        <p className="text-muted-foreground">
          The platform uses limited cookies to improve user experience and ensure security. Users can control or disable cookies through their browser settings.
        </p>
      )
    },
    {
      number: "8",
      icon: UserCheck,
      title: "User Rights",
      content: (
        <>
          <p className="text-muted-foreground mb-4">Users have the right to:</p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Learn about data held about them
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Request correction of incorrect or incomplete data
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Request deletion of data under necessary conditions
            </li>
          </ul>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              Requests can be submitted via <a href="mailto:contact@imperialartgallery.com" className="text-primary font-medium hover:underline">contact@imperialartgallery.com</a>
            </p>
          </div>
        </>
      )
    },
    {
      number: "9",
      icon: Shield,
      title: "Security",
      content: (
        <>
          <p className="text-muted-foreground mb-4">The platform protects data using:</p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Encryption
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Access restrictions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Secure server infrastructures
            </li>
          </ul>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              However, no data transmission over the internet can be guaranteed to be 100% secure.
            </p>
          </div>
        </>
      )
    },
    {
      number: "10",
      icon: RefreshCw,
      title: "Policy Changes",
      content: (
        <p className="text-muted-foreground">
          This Privacy Policy may be updated from time to time. Updates become effective as soon as they are published on the Platform.
        </p>
      )
    },
    {
      number: "11",
      icon: Mail,
      title: "Contact",
      content: (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-muted-foreground mb-2">
            For questions regarding the Privacy Policy:
          </p>
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
                Privacy Policy
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                How we collect, use, and protect your personal data
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

export default PrivacyPolicyPage;
