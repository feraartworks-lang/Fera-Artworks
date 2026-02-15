# Imperial Art Gallery - Product Requirements Document

## Original Problem Statement
A global platform called "Imperial Art Gallery" for the ownership, transfer, resale, and return of unique digital artworks. The ownership model is based on a license that grants exclusive access to the art.

## Core Features
- **License-Based Ownership:** Unique, exclusive, and traceable license for each artwork
- **Secure Viewer & Irreversible Download:** Purchased art viewed securely; downloading voids return/resale rights
- **P2P Resale & Returns:** Users can resell or return artworks only if `isUsed` flag is `false`
- **Custom Payment System:** A2A bank transfers and USDT crypto payments with manual admin reconciliation
- **Multi-faceted Authentication:** JWT, Google OAuth, MetaMask, and WalletConnect
- **Admin Panel:** 2FA-secured for managing users, artworks, transactions

## Technical Stack
- **Backend:** FastAPI, MongoDB, Resend (emails)
- **Frontend:** React, React Router, Tailwind CSS, Shadcn/UI, Framer Motion
- **Auth:** JWT, Google OAuth, Web3 (MetaMask/WalletConnect signature)

## What's Been Implemented

### December 2025 - Renaissance UI/UX Redesign (COMPLETED)
- ✅ Complete visual transformation to "Renaissance Digital Luxury" theme
- ✅ Gold (#D4AF37) and obsidian black (#050505) color palette
- ✅ Cinzel serif font for headings, Manrope for body
- ✅ Custom CSS classes: `btn-gold`, `btn-outline-gold`, `card-renaissance`
- ✅ Global noise overlay for canvas texture effect
- ✅ Gold shimmer text animations
- ✅ Frame corner decorations on images
- ✅ Ornate dividers with gem icons

### Pages Redesigned
- ✅ **Landing Page** - Full-screen hero with Renaissance background, animated stats, featured artworks
- ✅ **Navbar** - Crown logo, scroll-aware transparency, gold active states
- ✅ **Footer** - Column layout with gem dividers
- ✅ **Gallery Page** - Masonry-style grid with gold frame corners, filters
- ✅ **Login Page** - Split-screen with Renaissance art quotes
- ✅ **Register Page** - Split-screen with form validation
- ✅ **Artwork Detail Page** - Frame decorations, license ID display, pricing card
- ✅ **How It Works Page** - Roman numeral sections (I-IX)
- ✅ **Contact Us Page** - Form with response time sidebar

### Previously Completed Features
- ✅ USDT Payment Flow (tested end-to-end)
- ✅ A2A Bank Transfer Payment System
- ✅ Platform Rebranding to "Imperial Art Gallery"
- ✅ Unique License ID System
- ✅ Contact Form Email Integration (Resend)
- ✅ WalletConnect Integration
- ✅ Admin 2FA Authentication
- ✅ Informational Pages (FAQ, Privacy Policy, Terms, Help Center, License Agreement)

## Test Results
- **Frontend Success Rate:** 98%
- **All pages loading correctly**
- **Renaissance theme consistent across all pages**
- **Responsive design working (minor issues fixed)**

## Prioritized Backlog

### P1 - High Priority (Next)
- **P2P Marketplace Activation**
  - Remove "Coming Soon" overlay
  - Implement P2P sale backend logic
  - **CRITICAL:** New owners from P2P sales do NOT get refund rights

### P2 - Medium Priority
- Automate Payment Reconciliation (blockchain listener for USDT)
- Expand Email Notification System (order confirmations, password resets)

### P3 - Future Enhancements
- Open Banking integration for A2A
- Bank statement parser for automated reconciliation

## Key Files Reference
- `/app/design_guidelines.json` - Renaissance theme design system
- `/app/frontend/src/index.css` - Global styles with gold theme
- `/app/frontend/src/pages/` - All redesigned pages
- `/app/frontend/src/components/Navbar.js` - Updated navbar
- `/app/frontend/src/components/Footer.js` - Updated footer
- `/app/backend/server.py` - Main API with all endpoints

## Database Schema
- **artworks:** `{..., license_id: str}` (mandatory)
- **contact_submissions:** `{name, email, subject, message, created_at}`
- **users:** Standard user schema
- **payment_orders:** Payment tracking

## Admin Credentials
- Email: `fera.artworks@gmail.com`
- Password: `XKJ3ofWXVBtY2IhJ0MxvYz1tGSIi`

## Deployment Notes
- User will deploy on their own infrastructure (Railway/DigitalOcean)
- Web3 features (MetaMask, WalletConnect) preserved
- Environment variables needed post-deployment:
  - `MONGO_URL`
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID` (user's own credentials)
  - `RESEND_API_KEY`
  - `WALLETCONNECT_PROJECT_ID`
