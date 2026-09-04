# 🛍️ StylesNest — Modern Full-Stack E-Commerce Platform

<div align="center">

<img src="public/StylesNest_Transparent.png" alt="StylesNest Logo" width="280" />

<p align="center">
  <strong>A premium, responsive, and high-performance full-stack e-commerce web application.</strong><br />
  Engineered with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Neon Serverless PostgreSQL, Cloudinary, and NextAuth.
</p>

[![CodeAlpha Internship](https://img.shields.io/badge/CodeAlpha-Internship%20Project-blueviolet?style=for-the-badge&logo=codeforces&logoColor=white)](#-codealpha-internship-submission)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript%205-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Neon Postgres](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📌 CodeAlpha Internship Submission

This project is developed and submitted as part of the **CodeAlpha Web Development Internship Program**.

- **Organization**: [CodeAlpha](https://www.codealpha.tech/)
- **Track**: Full Stack Web Development / Web Development Internship
- **Project Name**: StylesNest E-Commerce Web Application
- **Role / Author**: Web Development Intern
- **Submission Purpose**: Demonstration of production-ready frontend architecture, full-stack database integration, authentication, media pipelines, and administrative workflows.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Customer Storefront](#1-customer-storefront)
  - [Cart & Checkout](#2-cart--checkout)
  - [Authentication & User Account](#3-authentication--user-account)
  - [Admin Management Portal](#4-admin-management-portal)
  - [Performance & SEO](#5-performance--seo)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Installation](#step-by-step-installation)
  - [Database Bootstrap](#database-bootstrap)
- [Environment Variables Guide](#-environment-variables-guide)
- [Available Scripts](#-available-scripts)
- [Deployment & GitHub Push Guide](#-deployment--github-push-guide)
- [License](#-license)

---

## 🌟 Overview

**StylesNest** is a cutting-edge, end-to-end e-commerce solution designed for modern online retail. It bridges an intuitive, conversion-focused customer experience with an enterprise-grade administrative dashboard.

Built atop **Next.js 16 App Router** and **React 19**, it takes advantage of React Server Components (RSC), server-side rendering (SSR), and seamless API routes. Data persistence is backed by **Neon Serverless PostgreSQL** with connection pooling, while media assets (product galleries, hero carousels) are managed and served via **Cloudinary CDN**.

---

## 🚀 Key Features

### 1. Customer Storefront
- **Dynamic Hero & Carousel**: Engaging landing page banners with responsive layouts and call-to-action buttons.
- **Categorized Browsing**: Quick filters for *Bags, Clothes, Jewelry, Men's Fashion, Shoes, Watches, and General Store*.
- **Instant Search & Real-Time Filter**: Filter products by category, price range, stock availability, and keyword queries.
- **Rich Product Showcase**:
  - Multi-angle high-resolution image galleries.
  - Interactive clothes customizer (sizes, colors).
  - Tiered pricing & bulk discounts calculations.
  - Stock indicators and free delivery badges.

### 2. Cart & Checkout
- **Interactive Cart Drawer**: Slide-over cart drawer with instant quantity toggling, dynamic subtotal calculation, and empty state cues.
- **Persistent State**: Cart and wishlist persist across sessions using local storage and context sync.
- **Streamlined Checkout Flow**: Clean checkout form capturing customer contact, delivery address, and order notes.
- **QR Code Order Receipts**: Auto-generates a scannable verification QR code with unique order IDs for customer tracking.

### 3. Authentication & User Account
- **NextAuth.js v5**: Secure session tokens with credentials authentication and support for OAuth providers (Google & Apple).
- **Customer Profiles**: Users can review their active and past order history, saved addresses, and profile details.
- **Protected Routes**: Middleware and server-side checks isolating customer accounts from administrative interfaces.

### 4. Admin Management Portal (`/admin`)
- **Inventory & Product CRUD**:
  - Add, edit, archive, and delete products with rich bilingual support (`en` / `ar`).
  - Interactive client-side image cropping (`react-easy-crop`) before Cloudinary upload.
- **Live Order Fulfillment Desk**:
  - Track orders through states: `Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled`.
  - Customer contact shortcuts: Instant WhatsApp chat and direct dial links.
- **Abandoned / Unsubmitted Orders**: Monitor dropped carts to boost conversion recovery.
- **Bulk Excel Export**: One-click `.xlsx` report export powered by SheetJS (`xlsx`) for order fulfillment and offline records.
- **Store Configuration**: Edit live store announcements, WhatsApp support numbers, address, and social links directly from the dashboard.

### 5. Performance & SEO
- **Server Components & Streaming**: Optimized TTFB (Time to First Byte) with fast page rendering.
- **Dynamic SEO**: Auto-generated `sitemap.ts`, `robots.ts`, Open Graph tags, and Progressive Web App `manifest.ts`.
- **Image Optimization**: Cloudinary and Next.js Image optimization delivering responsive WebP/AVIF images.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Full-stack React framework with Server Components & API routes |
| **UI Library** | [React 19](https://react.dev/) | Core UI rendering engine |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS design system |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Smooth UI transitions, modals, and drawer interactions |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type-safety across client and server |
| **Database** | [Neon PostgreSQL](https://neon.tech/) | Serverless cloud PostgreSQL database |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) | Flexible authentication for modern web applications |
| **Media Storage** | [Cloudinary](https://cloudinary.com/) | Cloud-based media storage and image transformations |
| **Data Export** | [SheetJS (xlsx)](https://sheetjs.com/) | Client/Server Excel spreadsheet generation |
| **Icons** | [React Icons](https://react-icons.github.io/react-icons/) | Feather, Lucide, and FontAwesome icon sets |

---

## 📂 Project Architecture

```plaintext
StylesNest/
├── database/                    # SQL migration and initialization scripts
│   └── landing_images_table.sql # Carousel & banner database tables
├── public/                      # Static assets, branding logos, payment badges
│   ├── Payment_images/          # Payment method logos
│   ├── images/                  # Category default banners
│   ├── StylesNest_logo.png      # Brand logo
│   └── StylesNest_Transparent.png
├── scripts/                     # Automation & database seeding scripts
│   ├── bootstrap-neon.ts        # Automated Neon DB schema & product seed script
│   └── setup-database.ts        # Database verification helper
├── src/
│   ├── app/                     # Next.js 16 App Router (Pages & Endpoints)
│   │   ├── (storefront)/        # Customer views: shop, product, cart, about
│   │   ├── admin/               # Admin Portal: dashboard, products, orders, settings
│   │   ├── api/                 # Backend REST endpoints (products, orders, upload, auth)
│   │   ├── layout.tsx           # Root layout with providers & global header/footer
│   │   ├── manifest.ts          # PWA manifest
│   │   ├── robots.ts            # Dynamic robots.txt
│   │   └── sitemap.ts           # Dynamic XML sitemap generator
│   ├── components/              # Reusable UI component library
│   │   ├── Header.tsx           # Navigation bar with live search & cart counter
│   │   ├── Footer.tsx           # Footer with newsletter and quick links
│   │   ├── CartDrawer.tsx       # Interactive slide-over cart
│   │   ├── ProductCard.tsx      # Reusable product card with badges & pricing
│   │   └── admin/               # Admin forms, data tables, and image cropper
│   ├── context/                 # React Context providers (Cart, Wishlist, Auth)
│   ├── data/                    # Initial catalog data seed definitions
│   ├── hooks/                   # Custom client hooks (debouncing, window size, etc.)
│   ├── lib/                     # Core backend utilities (Neon db client, Cloudinary, auth)
│   │   ├── db.ts                # Neon Serverless SQL client
│   │   ├── init-db.ts           # Table creation & schema migration runner
│   │   └── cloudinary.ts        # Cloudinary SDK client
│   └── types/                   # TypeScript interfaces (Product, Order, User, etc.)
├── .env.example                 # Reference environment variables template
├── .gitignore                   # Git ignore configuration
├── next.config.ts               # Next.js compiler & remote image domains configuration
├── package.json                 # Project manifest, dependencies, and npm scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 🗄️ Database Schema

The database runs on **PostgreSQL (Neon Serverless)** with the following core relational structures:

```mermaid
erDiagram
    PRODUCTS {
        serial id PK
        text title_en
        text title_ar
        decimal current_price
        decimal original_price
        integer discount
        text image
        jsonb images
        text category
        jsonb pricing_tiers
        jsonb clothes_options
        text status
    }
    ORDERS {
        text id PK
        text customer
        text phone
        text city
        text address
        jsonb products
        decimal total
        text status
        date date
        time time
    }
    ABANDONED_ORDERS {
        text id PK
        text name
        text phone
        text city
        text address
        text quantity
        text status
    }
    ADMIN {
        serial id PK
        text email UK
        text password
    }
    CONTACT_SETTINGS {
        int id PK
        text whatsapp
        text phone
        text email
        text address
        text social_whatsapp
        text social_facebook
        text social_tiktok
    }
    LANDING_IMAGES {
        serial id PK
        text section
        text image_type
        text image_url
        int display_order
        boolean is_active
    }

    ORDERS ||--o{ PRODUCTS : contains
```

---

## 🚀 Getting Started

Follow these steps to get a local development environment running:

### Prerequisites

- **Node.js**: `v20.9.0` or higher ([Download](https://nodejs.org/))
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Database**: A free [Neon](https://neon.tech/) PostgreSQL database or local PostgreSQL instance
- **Cloudinary Account**: A free [Cloudinary](https://cloudinary.com/) account for image storage

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/StylesNest.git
   cd StylesNest
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and provide your credentials (see [Environment Variables Guide](#-environment-variables-guide)).

### Database Bootstrap

Initialize all necessary database tables and seed initial products with a single command:

```bash
npm run db:bootstrap
```

> **Note**: This will execute `scripts/bootstrap-neon.ts`, verify the connection to your `DATABASE_URL`, create all tables with proper indexes, and seed catalog items if empty.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the storefront.

To access the admin portal:
1. Visit [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Setup your first admin user via `POST /api/admin/setup` (or following on-screen setup prompts).

---

## 🔑 Environment Variables Guide

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **Yes** | Neon PostgreSQL connection string (`postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require`) |
| `CLOUDINARY_URL` | **Yes** | Cloudinary connection string (`cloudinary://api_key:api_secret@cloud_name`) |
| `CLOUDINARY_CLOUD_NAME`| Optional | Alternate way to supply Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Optional | Alternate way to supply Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Optional | Alternate way to supply Cloudinary API Secret |
| `AUTH_SECRET` | **Yes** | NextAuth session encryption secret key |
| `AUTH_URL` | **Yes** | Canonical app URL (e.g. `http://localhost:3000` for local dev) |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth Client ID for customer login |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth Client Secret for customer login |
| `NEXT_PUBLIC_SITE_URL` | Optional | Public live domain for SEO canonical tags |

> 💡 **Tip to generate `AUTH_SECRET`**:
> - **PowerShell (Windows)**:
>   ```powershell
>   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
>   ```
> - **Bash / Linux**:
>   ```bash
>   openssl rand -base64 32
>   ```

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the local development server with Turbopack / Fast Refresh on port 3000 |
| `npm run build` | Compiles and builds the production-ready application bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint 9 to detect code smells and formatting errors |
| `npm run db:bootstrap`| Runs the automated database table generation and catalog seeder |

---

## 📤 Deployment & GitHub Push Guide

To upload this repository to GitHub for the **CodeAlpha Internship Submission**:

1. **Initialize Git Repository** (if not already initialized):
   ```bash
   git init
   ```

2. **Stage and Commit Clean Codebase**:
   ```bash
   git add .
   git commit -m "feat: complete StylesNest e-commerce application for CodeAlpha internship"
   ```

3. **Link to your GitHub Repository**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/StylesNest.git
   ```

4. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

5. **Deploy (Optional & Recommended)**:
   - This project is 100% ready for one-click deployment on [Vercel](https://vercel.com).
   - Link your GitHub repo to Vercel, copy your `.env.local` variables into Vercel Project Settings, and deploy!

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Developed with ❤️ for the <strong>CodeAlpha Internship</strong>. Built with Next.js, React, and TypeScript.</sub>
</div>
