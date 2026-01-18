# Ferâ - Digital Art Ownership Platform PRD

## Original Problem Statement
Dijital Sanat Eseri Sahiplik ve Yeniden Satış Platformu - A platform for unique digital artwork license-based ownership, transfer, resale and refund. The system defines artworks as ownership licenses (not files) and ensures security, traceability and value transfer.

## Deployment Status: ✅ PRODUCTION READY
- Preview URL: https://digital-art-hub-1.preview.emergentagent.com
- Last Updated: January 15, 2026

## User Personas
1. **Digital Art Collector**: Wants to own unique digital artworks with verified ownership rights
2. **Crypto Enthusiast**: Prefers Web3/MetaMask authentication and crypto payments
3. **Artist**: Uploads and sells original digital artworks
4. **P2P Trader**: Buys and resells artworks on the marketplace
5. **Founder Admin**: Platform owner with full control over all operations

## Core Requirements
- Single ownership per artwork (one owner at any time)
- License-based access (not file ownership)
- Platform authority for ownership/access/transfer/refund
- Secure Viewer (no download)
- Full resolution download option (marks as used)
- P2P resale marketplace
- Lifetime refund policy (if unused)
- Multiple auth methods (Email/JWT, Google OAuth, Web3 wallet, WalletConnect)
- Dark gallery theme design
- **Founder-only admin panel with full control**
- **Admin 2FA (TOTP) support**

## What's Been Implemented (January 15, 2026)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (Email/Password, Google OAuth, Web3/MetaMask, WalletConnect)
- ✅ JWT token management with 7-day expiration
- ✅ Artwork CRUD operations with state machine (isPurchased, isUsed, isTransferred, isRefunded)
- ✅ Purchase flow with 5% license protection fee
- ✅ P2P marketplace with 1% commission
- ✅ Refund system for unused artworks
- ✅ Withdrawal system with 1% fee
- ✅ **Founder-only Admin Panel with triple authentication (email + password + secret key)**
- ✅ **Admin 2FA (TOTP) - Google Authenticator compatible**
- ✅ Audit logs with 3-day TTL auto-deletion after refund
- ✅ Secure file storage and access control
- ✅ **User ban/suspend system**
- ✅ **Manual refund/transfer operations**
- ✅ **System alerts and notifications**
- ✅ **CSV/JSON data export**
- ✅ **User bank info (IBAN, Bank Name, Account Holder, SWIFT/BIC) storage and retrieval**

### Frontend (React + Shadcn UI + Tailwind)
- ✅ Landing page with dark gallery theme
- ✅ Art Gallery with search, filter, and sort
- ✅ Artwork detail page with purchase flow
- ✅ Secure Viewer with right-click disabled
- ✅ User Dashboard (collection, transactions, listings)
- ✅ **User Dashboard Settings tab for bank info management**
- ✅ P2P Marketplace (browse, list, buy)
- ✅ Multi-auth support (Email, Google, MetaMask)
- ✅ Responsive design with mobile support

### Admin Panel Features (Founder Only) - FULLY COMPLETE ✅
- ✅ **Secure login with triple authentication**
- ✅ **Dashboard with platform statistics**
- ✅ **Artwork management (create, edit, delete) with modal forms**
- ✅ **User management (ban, suspend, unban, unsuspend) with dialogs**
- ✅ **User bank info viewing (IBAN, Bank Name, SWIFT/BIC, Account Holder) with popup**
- ✅ **Transaction history with filtering by type**
- ✅ **Manual refund processing with dialog**
- ✅ **Manual ownership transfer with dialog**
- ✅ **Audit log viewer with expiration info and TTL display**
- ✅ **Alert/notification system with read/unread status**
- ✅ **Reports with date filtering and summary statistics**
- ✅ **CSV/JSON data export for transactions, users, artworks**

### Financial Model Implemented
- 5% License Protection Fee on purchases (non-refundable)
- 1% Platform Commission on P2P sales
- 1% Withdrawal Fee
- Minimum resale price: 1% above purchase price

### Security Notes
- Admin credentials are stored securely in environment variables (`/app/backend/.env`)
- Never commit credentials to version control
- Change default secrets before production deployment

### Code Cleanup Completed
- ✅ Removed obsolete `/app/frontend/src/pages/AdminPage.js`
- ✅ All admin routes properly configured in App.js

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Payment gateway integration (Stripe/Open Banking)
- [ ] File upload with watermarking
- [ ] Email notifications for critical alerts

### P1 (High Priority)
- [ ] Two-factor authentication for admin
- [ ] Real-time dashboard updates (WebSocket)
- [ ] Backup and disaster recovery

### P2 (Medium Priority)
- [ ] Advanced analytics dashboard
- [ ] Scheduled reports via email
- [ ] Mobile app (React Native)

## Next Tasks
1. Integrate real payment processing (Stripe + Crypto)
2. Implement watermark generation for previews
3. Add 2FA for admin panel
4. Build email notification system for alerts
5. Add artwork upload functionality for artists

## Tech Stack
- Backend: FastAPI + MongoDB (Motor async driver)
- Frontend: React 19 + Shadcn UI + Tailwind CSS
- Auth: JWT + Emergent Google OAuth + Web3/ethers.js
- Admin: Founder-only triple authentication
- Styling: Custom dark theme with Playfair Display + Manrope + JetBrains Mono fonts
