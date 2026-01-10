# ArtChain - Digital Art Ownership Platform PRD

## Original Problem Statement
Dijital Sanat Eseri Sahiplik ve Yeniden Satış Platformu - A platform for unique digital artwork license-based ownership, transfer, resale and refund. The system defines artworks as ownership licenses (not files) and ensures security, traceability and value transfer.

## User Personas
1. **Digital Art Collector**: Wants to own unique digital artworks with verified ownership rights
2. **Crypto Enthusiast**: Prefers Web3/MetaMask authentication and crypto payments
3. **Artist**: Uploads and sells original digital artworks
4. **P2P Trader**: Buys and resells artworks on the marketplace

## Core Requirements
- Single ownership per artwork (one owner at any time)
- License-based access (not file ownership)
- Platform authority for ownership/access/transfer/refund
- Secure Viewer (no download)
- Full resolution download option (marks as used)
- P2P resale marketplace
- Lifetime refund policy (if unused)
- Multiple auth methods (Email/JWT, Google OAuth, Web3 wallet)
- Dark gallery theme design

## What's Been Implemented (January 10, 2026)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (Email/Password, Google OAuth, Web3/MetaMask)
- ✅ JWT token management with 7-day expiration
- ✅ Artwork CRUD operations with state machine (isPurchased, isUsed, isTransferred, isRefunded)
- ✅ Purchase flow with 5% license protection fee
- ✅ P2P marketplace with 1% commission
- ✅ Refund system for unused artworks
- ✅ Withdrawal system with 1% fee
- ✅ Admin dashboard with stats and analytics
- ✅ Audit logs with 3-day TTL auto-deletion
- ✅ Secure file storage and access control

### Frontend (React + Shadcn UI + Tailwind)
- ✅ Landing page with dark gallery theme
- ✅ Art Gallery with search, filter, and sort
- ✅ Artwork detail page with purchase flow
- ✅ Secure Viewer with right-click disabled
- ✅ User Dashboard (collection, transactions, listings)
- ✅ P2P Marketplace (browse, list, buy)
- ✅ Admin Dashboard (users, artworks, transactions)
- ✅ Multi-auth support (Email, Google, MetaMask)
- ✅ Responsive design with mobile support

### Financial Model Implemented
- 5% License Protection Fee on purchases (non-refundable)
- 1% Platform Commission on P2P sales
- 1% Withdrawal Fee
- Minimum resale price: 1% above purchase price

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Payment gateway integration (Stripe/Open Banking)
- [ ] File upload with watermarking
- [ ] Admin role-based access control

### P1 (High Priority)
- [ ] Email notifications (purchase, transfer, refund)
- [ ] Transaction history export
- [ ] Artwork categories management
- [ ] User profile settings

### P2 (Medium Priority)
- [ ] Advanced search filters
- [ ] Favorites/Wishlist feature
- [ ] Price history charts
- [ ] Mobile app (React Native)

## Next Tasks
1. Integrate real payment processing (Stripe + Crypto)
2. Implement watermark generation for previews
3. Add admin authentication and role management
4. Build email notification system
5. Add artwork upload functionality for artists

## Tech Stack
- Backend: FastAPI + MongoDB (Motor async driver)
- Frontend: React 19 + Shadcn UI + Tailwind CSS
- Auth: JWT + Emergent Google OAuth + Web3/ethers.js
- Styling: Custom dark theme with Playfair Display + Manrope + JetBrains Mono fonts
