# Phase 1: Project Foundation - Research

**Researched:** 2026-01-18
**Domain:** Next.js 16 project initialization, shadcn/ui design system, PDF.js worker configuration
**Confidence:** HIGH

## Summary

Phase 1 establishes the production-ready foundation for a client-side PDF processing application using Next.js 16 with App Router, shadcn/ui design system, and PDF.js for document handling. The critical technical challenge is configuring PDF.js workers to function correctly in Vercel's production environment from day one.

Next.js 16 introduces Turbopack as the default bundler (replacing Webpack), uses App Router as the recommended architecture, and pairs with React 19 and TypeScript 5.1+ as the standard stack. The framework automatically configures TypeScript, ESLint, and Tailwind CSS during initialization with `create-next-app@latest --yes`.

shadcn/ui provides a component library built on Radix UI primitives with Tailwind CSS, offering 60+ components designed for easy customization via CSS variables. The Stone color palette aligns with the granite aesthetic requirement.

**Primary recommendation:** Use `create-next-app@latest --yes` for automatic App Router + TypeScript + Tailwind setup. Configure PDF.js worker to load from `/public` folder or CDN, avoiding webpack bundling complications. Deploy early to Vercel to validate worker configuration in production environment.

## Standard Stack

The established libraries/tools for Next.js 16 + PDF.js + shadcn/ui:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.x (latest) | React framework | Production-ready App Router, automatic optimizations, zero-config Vercel deployment |
| react | 19.x | UI framework | Required by Next.js 16, stable release with App Router features |
| react-dom | 19.x | React renderer | Pairs with React 19 |
| typescript | 5.1.0+ | Type safety | Auto-configured by Next.js, required for production apps |
| pdfjs-dist | 5.4.530+ | PDF processing | Official Mozilla library, client-side rendering, worker-based architecture |
| tailwindcss | 3.x | Styling | Auto-configured by Next.js, required by shadcn/ui |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | UI components | Design system foundation - installed per-component via CLI |
| @radix-ui/* | latest | Headless UI primitives | Auto-installed with shadcn components |
| class-variance-authority | latest | Component variants | Auto-installed with shadcn setup |
| clsx | latest | Conditional classes | Auto-installed with shadcn setup |
| tailwind-merge | latest | Tailwind class merging | Auto-installed with shadcn setup |
| lucide-react | latest | Icon library | Recommended by shadcn for consistent iconography |

### Development Tools
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint | 9.x | Linting | Auto-configured by Next.js 16 |
| @next/eslint-plugin-next | latest | Next.js rules | Auto-installed |
| eslint-config-next | latest | ESLint config | Auto-installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| App Router | Pages Router | Pages Router is legacy; App Router is recommended for all new projects |
| Turbopack | Webpack | Webpack available via `--webpack` flag but Turbopack is faster and default in Next.js 16 |
| shadcn/ui | Material-UI, Chakra UI | shadcn provides unstyled primitives (better for custom aesthetics); others have opinionated styles |
| pdfjs-dist | react-pdf | react-pdf is a wrapper; pdfjs-dist gives direct control over worker configuration |

**Installation:**
```bash
# Initialize Next.js project (automatic TypeScript + Tailwind + ESLint + App Router)
npx create-next-app@latest rspv --yes
cd rspv

# Install PDF.js
npm install pdfjs-dist@5.4.530

# Initialize shadcn/ui (interactive - choose Stone theme for granite aesthetic)
npx shadcn@latest init

# Install initial shadcn components (example)
npx shadcn@latest add button card
```

## Architecture Patterns

### Recommended Project Structure
```
rspv/
├── app/                     # App Router (Next.js 16 default)
│   ├── layout.tsx          # Root layout (required - contains <html>, <body>)
│   ├── page.tsx            # Home page (required - main route)
│   ├── globals.css         # Global styles + shadcn CSS variables
│   └── fonts/              # Local font files (optional)
├── components/             # React components
│   ├── ui/                 # shadcn components (auto-generated)
│   └── pdf/                # PDF-specific components
│       └── PDFViewer.tsx   # Client component for PDF rendering
├── lib/                    # Utility functions
│   └── utils.ts            # shadcn utility functions (auto-generated)
├── public/                 # Static assets (served from / path)
│   ├── pdf.worker.min.mjs  # PDF.js worker file (CRITICAL)
│   └── favicon.ico         # App icon
├── .env.local              # Local environment variables (gitignored)
├── components.json         # shadcn configuration
├── next.config.ts          # Next.js configuration (TypeScript)
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration (auto-generated)
```

### Pattern 1: App Router with Client Components for Interactivity
**What:** Next.js 16 defaults to Server Components; use `'use client'` directive for interactive UI
**When to use:** PDF rendering, file upload, state management, browser APIs
**Example:**
```typescript
// components/pdf/PDFViewer.tsx
'use client'

import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

export default function PDFViewer({ file }: { file: File }) {
  const [numPages, setNumPages] = useState<number>(0)

  useEffect(() => {
    // Configure worker path (CRITICAL - must point to public folder)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    // Load PDF from File object
    const loadPdf = async () => {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setNumPages(pdf.numPages)
    }

    loadPdf()
  }, [file])

  return <div>PDF loaded with {numPages} pages</div>
}
```
**Source:** https://nextjs.org/docs/app/building-your-application/rendering/client-components

### Pattern 2: Static Asset Serving from Public Folder
**What:** Files in `/public` are served from root URL path (`/`)
**When to use:** PDF.js worker files, fonts, images, robots.txt
**Example:**
```typescript
// In any component (works in both Server and Client Components)
// Reference public/pdf.worker.min.mjs as /pdf.worker.min.mjs
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// Next.js serves this with Cache-Control: public, max-age=0
// This ensures fresh fetches but consider CDN for production
```
**Source:** https://nextjs.org/docs/app/building-your-application/optimizing/static-assets

### Pattern 3: PDF.js Worker Configuration (Vercel-Safe)
**What:** Configure PDF.js to load worker from public folder, not bundled
**When to use:** All PDF.js initialization (MUST be configured before any PDF loading)
**Critical implementation:**
```typescript
// Option 1: Public Folder (Recommended for Vercel)
// 1. Copy node_modules/pdfjs-dist/build/pdf.worker.min.mjs to public/
// 2. Set worker path in component initialization
import * as pdfjsLib from 'pdfjs-dist'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

// Option 2: CDN (Alternative - ensures version matching)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.530/pdf.worker.min.mjs`
}
```
**Why this matters:** PDF.js worker MUST NOT be processed by webpack/Turbopack. Bundling breaks worker instantiation. Version mismatch between `pdf.js` and `pdf.worker.js` causes runtime errors.

**Source:** https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions

### Pattern 4: Environment Variables for Client-Side Code
**What:** Use `NEXT_PUBLIC_` prefix for browser-accessible variables
**When to use:** API endpoints, feature flags, public configuration
**Example:**
```typescript
// .env.local (NOT committed to git)
NEXT_PUBLIC_API_URL=https://api.example.com

// app/page.tsx (works in both Server and Client Components)
// Value is inlined at build time
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// ❌ WRONG - dynamic lookup doesn't work
const key = 'NEXT_PUBLIC_API_URL'
const apiUrl = process.env[key] // undefined!
```
**Source:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

### Pattern 5: shadcn/ui Component Installation
**What:** Install components individually via CLI, customize via CSS variables
**When to use:** Building UI with consistent design system
**Example:**
```bash
# Initialize shadcn (one-time setup)
npx shadcn@latest init
# Prompts for:
# - Style: Default
# - Base color: Stone (for granite aesthetic)
# - CSS variables: Yes (recommended)

# Add components as needed
npx shadcn@latest add button card input

# Components are added to components/ui/
# Customize via app/globals.css CSS variables
```
```css
/* app/globals.css - Stone theme customization */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --primary: 24 9.8% 10%;
    --primary-foreground: 60 9.1% 97.8%;
    /* Stone palette - warm, earthy, low saturation */
    /* Radius for minimalist aesthetic */
    --radius: 0.3rem; /* Subtle rounding */
  }

  .dark {
    --background: 20 14.3% 4.1%;
    --foreground: 60 9.1% 97.8%;
    /* Dark mode overrides */
  }
}
```
**Source:** https://ui.shadcn.com/docs/installation/next, https://ui.shadcn.com/docs/theming

### Anti-Patterns to Avoid

- **Importing PDF.js worker in component:** Don't `import 'pdfjs-dist/build/pdf.worker.js'` - webpack will bundle it and break worker instantiation
- **Using Pages Router for new projects:** App Router is the recommended architecture in Next.js 16
- **Modifying next-env.d.ts:** This file is auto-generated; create separate `.d.ts` files for custom types
- **Committing .env.local:** Contains secrets; use .env.example for documentation
- **Using `'use client'` on layouts unnecessarily:** Only mark interactive components as client; keep layouts as Server Components when possible
- **Hardcoding worker CDN URLs without version matching:** PDF.js version MUST match worker version exactly

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI component library | Custom button, dialog, dropdown primitives | shadcn/ui components | Accessibility, keyboard navigation, ARIA attributes, focus management are non-trivial |
| PDF rendering engine | Canvas-based PDF parser | pdfjs-dist | PDF spec is complex (fonts, compression, encryption, forms); Mozilla's library handles edge cases |
| TypeScript configuration | Manual tsconfig.json | Next.js auto-generated config | Next.js sets up paths, module resolution, JSX, and incremental compilation correctly |
| Build configuration | Custom webpack setup | Next.js default (Turbopack) | Automatic code splitting, tree shaking, image optimization, and production optimizations |
| Environment variable loading | Custom dotenv setup | Next.js built-in .env support | Handles multiple environment files (.env.local, .env.production), build-time inlining |
| Dark mode implementation | Custom theme switching logic | shadcn CSS variables + next-themes | System preference detection, localStorage persistence, flash prevention |
| Tailwind class merging | Manual conditional classNames | tailwind-merge + clsx (shadcn utilities) | Handles Tailwind specificity conflicts and conditional classes |

**Key insight:** Next.js 16 with `create-next-app --yes` configures 90% of foundation decisions automatically. PDF.js worker configuration is the only truly custom setup required for this phase.

## Common Pitfalls

### Pitfall 1: PDF.js Worker Version Mismatch
**What goes wrong:** Runtime error "The API version does not match the Worker version"
**Why it happens:**
- Installing pdfjs-dist updates library but not worker file in public folder
- Using CDN worker URL without matching pdfjs-dist version
- Browser caching old worker file after pdfjs-dist upgrade
**How to avoid:**
- Use exact version matching: if using pdfjs-dist@5.4.530, copy that exact worker version to public/ or use CDN URL with `/5.4.530/` path
- Add build script to copy worker file: `"postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/"`
- Test worker configuration in production Vercel environment immediately after setup
**Warning signs:**
- Console error mentioning version mismatch
- PDF fails to load only in production (works locally)
- Worker initialization throws exception

**Verification:**
```bash
# Check installed pdfjs-dist version
npm list pdfjs-dist

# Verify worker file version matches
# Option 1: Check file in public/
cat public/pdf.worker.min.mjs | head -n 5

# Option 2: Verify CDN URL version matches package.json
grep pdfjs-dist package.json
# Should match: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/[VERSION]/pdf.worker.min.mjs
```

### Pitfall 2: Bundling PDF.js Worker with Turbopack/Webpack
**What goes wrong:** PDF.js worker fails to instantiate; cryptic errors about worker scope
**Why it happens:**
- Importing worker file directly causes bundler to process it
- Worker code expects to run in Worker context, not main thread
- Next.js bundler transforms break worker initialization
**How to avoid:**
- NEVER import: `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js'`
- ALWAYS use workerSrc path: `pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'`
- Copy worker to public folder manually or via postinstall script
- If using CDN, reference external URL
**Warning signs:**
- Error about "Worker" not being defined
- Error about module system in worker context
- Worker file appears in Next.js bundle analysis

### Pitfall 3: Using Server Components for PDF Rendering
**What goes wrong:** Browser APIs (FileReader, Canvas) are undefined; PDF.js fails
**Why it happens:**
- Next.js 16 defaults to Server Components
- PDF.js requires browser APIs (Worker, Canvas, Blob, FileReader)
- Server Components render on server where these APIs don't exist
**How to avoid:**
- Add `'use client'` directive to all components using PDF.js
- Structure: Server Component (layout) → Client Component (PDF viewer)
- Use `typeof window !== 'undefined'` guards for initialization
**Warning signs:**
- "window is not defined" errors
- "Worker is not a constructor" errors
- Component renders server-side but breaks client-side

**Example fix:**
```typescript
// ✅ CORRECT
'use client' // Top of file

import { useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

export default function PDFViewer() {
  useEffect(() => {
    // Safe: runs only on client
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }, [])

  return <div>PDF viewer</div>
}

// ❌ WRONG - No 'use client' directive
import * as pdfjsLib from 'pdfjs-dist'

export default function PDFViewer() {
  // This runs on server - Worker is undefined!
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  return <div>PDF viewer</div>
}
```

### Pitfall 4: Environment Variables Not Available in Browser
**What goes wrong:** `process.env.MY_VAR` is undefined in client components
**Why it happens:**
- Only `NEXT_PUBLIC_` prefixed variables are exposed to browser
- Next.js inlines these at build time (not runtime)
- Dynamic lookups don't work: `process.env[variableName]`
**How to avoid:**
- Prefix browser-accessible variables with `NEXT_PUBLIC_`
- Use direct references: `process.env.NEXT_PUBLIC_API_KEY`
- For secrets, create API routes (Server Components) that proxy client requests
**Warning signs:**
- Variable works in Server Components but undefined in Client Components
- Variable works locally but undefined in Vercel production
- Dynamic variable lookup returns undefined

### Pitfall 5: Vercel Deployment Fails Due to Missing Dependencies
**What goes wrong:** Build succeeds locally but fails on Vercel
**Why it happens:**
- TypeScript errors ignored locally but enforced in Vercel build
- Missing dependencies in package.json (worked due to global installs)
- Environment variables not configured in Vercel dashboard
**How to avoid:**
- Run `next build` locally before pushing
- Enable TypeScript strict mode during development: `"strict": true` in tsconfig.json
- Use `vercel env pull` to sync environment variables locally
- Test production build: `npm run build && npm run start`
**Warning signs:**
- "Module not found" errors in Vercel build logs
- TypeScript errors in Vercel build but not locally
- Build succeeds but runtime errors in Vercel deployment

### Pitfall 6: Static File Caching Issues
**What goes wrong:** Updated assets not loading; users see stale PDFs or worker files
**Why it happens:**
- Next.js serves public folder with `Cache-Control: public, max-age=0`
- Some CDNs or browsers ignore this and cache aggressively
- Worker file updates not reflected until hard refresh
**How to avoid:**
- Use CDN URLs for PDF.js worker (version in URL path ensures cache busting)
- Add hash to filename for user-uploaded PDFs: `document-${Date.now()}.pdf`
- Consider Vercel's Edge Network for automatic cache invalidation
- For critical assets, use versioned paths: `/assets/v2/pdf.worker.min.mjs`
**Warning signs:**
- Changes to public folder files not visible in production
- Worker version mismatch despite correct package.json
- PDF rendering works after hard refresh but not normal navigation

## Code Examples

Verified patterns from official sources:

### Next.js 16 Project Initialization
```bash
# Automatic setup with all defaults (TypeScript, Tailwind, ESLint, App Router)
npx create-next-app@latest rspv --yes

# What --yes configures:
# ✓ TypeScript
# ✓ ESLint
# ✓ Tailwind CSS
# ✓ src/ directory: No
# ✓ App Router: Yes (recommended)
# ✓ Turbopack: Yes (default in Next.js 16)
# ✓ Import alias: @/*

# Start development server
cd rspv
npm run dev
```
**Source:** https://nextjs.org/docs/getting-started/installation

### Root Layout Setup (Required for App Router)
```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RSPV - PDF Application',
  description: 'Client-side PDF processing application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```
**Source:** https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts

### shadcn/ui Installation and Configuration
```bash
# Initialize shadcn/ui (interactive prompts)
npx shadcn@latest init

# Prompts:
# ? Would you like to use TypeScript? › Yes
# ? Which style would you like to use? › Default
# ? Which color would you like to use as base color? › Stone
# ? Where is your global CSS file? › app/globals.css
# ? Would you like to use CSS variables for colors? › Yes
# ? Where is your tailwind.config.js located? › tailwind.config.ts
# ? Configure the import alias for components? › @/components
# ? Configure the import alias for utils? › @/lib/utils

# Install components
npx shadcn@latest add button card input
```

```json
// components.json (auto-generated)
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "stone",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```
**Source:** https://ui.shadcn.com/docs/installation/next

### PDF.js Worker Configuration (Production-Ready)
```typescript
// lib/pdf-config.ts
import * as pdfjsLib from 'pdfjs-dist'

/**
 * Initialize PDF.js worker configuration
 * MUST be called before any PDF operations
 *
 * Call this in a useEffect or during component initialization
 */
export function initPDFWorker() {
  if (typeof window === 'undefined') {
    return // Server-side, skip
  }

  // Option 1: Public folder (copy worker file to public/)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  // Option 2: CDN (ensure version matches pdfjs-dist version)
  // pdfjsLib.GlobalWorkerOptions.workerSrc =
  //   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.530/pdf.worker.min.mjs'
}

/**
 * Load PDF from File object
 * Returns PDF document proxy
 */
export async function loadPDFFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  return loadingTask.promise
}
```

```typescript
// components/pdf/PDFViewer.tsx
'use client'

import { useState, useEffect } from 'react'
import { initPDFWorker, loadPDFFromFile } from '@/lib/pdf-config'
import type { PDFDocumentProxy } from 'pdfjs-dist'

interface PDFViewerProps {
  file: File
}

export default function PDFViewer({ file }: PDFViewerProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize worker once
    initPDFWorker()
  }, [])

  useEffect(() => {
    if (!file) return

    loadPDFFromFile(file)
      .then(setPdf)
      .catch((err) => setError(err.message))
  }, [file])

  if (error) {
    return <div>Error loading PDF: {error}</div>
  }

  if (!pdf) {
    return <div>Loading PDF...</div>
  }

  return (
    <div>
      <p>PDF loaded: {pdf.numPages} pages</p>
      {/* Render pages here */}
    </div>
  )
}
```

```bash
# Copy PDF.js worker to public folder (run after npm install)
# Add to package.json scripts:
{
  "scripts": {
    "postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/"
  }
}
```
**Source:** https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions

### Client Component with File Upload
```typescript
// app/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import PDFViewer from '@/components/pdf/PDFViewer'

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    }
  }

  return (
    <main className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Upload PDF</h1>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="mb-4"
        />
        {file && <PDFViewer file={file} />}
      </Card>
    </main>
  )
}
```

### TypeScript Configuration for Next.js 16
```json
// tsconfig.json (auto-generated by Next.js)
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```
**Source:** https://nextjs.org/docs/app/building-your-application/configuring/typescript

### Vercel Deployment Configuration
```json
// vercel.json (optional - Vercel auto-detects Next.js)
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

```bash
# Deploy to Vercel
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy (first time - links project)
vercel

# 4. Deploy to production
vercel --prod

# 5. Pull environment variables for local development
vercel env pull
```
**Source:** https://vercel.com/docs/frameworks/nextjs

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router (`pages/` directory) | App Router (`app/` directory) | Next.js 13 (stable in 14/16) | Server Components by default, better performance, streaming support |
| Webpack bundler | Turbopack bundler | Next.js 16 (default) | 5-10x faster dev builds, opt-in with --webpack for legacy support |
| `getStaticProps`/`getServerSideProps` | `async` Server Components | Next.js 13+ | Simpler data fetching, no serialization needed |
| Manual TypeScript setup | Auto-configuration | Next.js 9.4+ | Zero-config TypeScript with custom plugin |
| Custom PDF.js webpack config | Public folder or CDN | Ongoing issue | Avoid bundler complications with workers |
| Manual component library | shadcn/ui CLI | 2023+ | Install components as source code, full customization |
| React 18 | React 19 | Next.js 16 | Stable release with App Router optimizations |
| `next/font/google` | `next/font/google` (current) | Next.js 13+ | Zero-layout-shift font loading |

**Deprecated/outdated:**
- **Pages Router:** Still supported but not recommended for new projects in Next.js 16
- **Webpack as default:** Replaced by Turbopack; use `--webpack` flag if needed
- **`next lint` in build:** Removed in Next.js 16; run ESLint separately
- **Manual SWC config:** Next.js 12+ uses SWC by default (no config needed)
- **`@vercel/og` package:** Merged into `next/og` in App Router

## Open Questions

Things that couldn't be fully resolved:

1. **PDF.js Worker Performance in Vercel Edge Runtime**
   - What we know: Vercel supports standard Node.js runtime; PDF.js workers use Web Worker API
   - What's unclear: Performance characteristics of PDF.js workers in Vercel's serverless environment vs traditional hosting
   - Recommendation: Deploy early to test worker performance with production-sized PDFs; monitor Vercel function execution times

2. **Next.js 16 Turbopack Stability with PDF.js**
   - What we know: Turbopack is default in Next.js 16; PDF.js requires special worker handling
   - What's unclear: Whether Turbopack has edge cases with PDF.js worker configuration (less community testing than Webpack)
   - Recommendation: Test worker initialization in both dev and production builds immediately; keep `--webpack` fallback option available if issues arise

3. **shadcn/ui Component Accessibility with PDF Viewer**
   - What we know: shadcn components have good accessibility; PDF.js canvas rendering is inherently not accessible
   - What's unclear: Best practices for making PDF viewer accessible (keyboard navigation, screen readers)
   - Recommendation: Plan for text layer extraction in future phases; use semantic HTML around PDF canvas; add keyboard shortcuts

4. **Optimal Worker File Delivery Method**
   - What we know: Two options work: public folder or CDN
   - What's unclear: Performance difference between self-hosted (Vercel CDN) vs external CDN (cdnjs)
   - Recommendation: Start with public folder (simpler version management); switch to CDN if Vercel bandwidth costs become concern

## Sources

### Primary (HIGH confidence)
- Next.js Official Documentation - Installation: https://nextjs.org/docs/getting-started/installation
- Next.js Official Documentation - TypeScript: https://nextjs.org/docs/app/building-your-application/configuring/typescript
- Next.js Official Documentation - Client Components: https://nextjs.org/docs/app/building-your-application/rendering/client-components
- Next.js Official Documentation - Static Assets: https://nextjs.org/docs/app/building-your-application/optimizing/static-assets
- Next.js Official Documentation - Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- shadcn/ui Official Documentation - Next.js Installation: https://ui.shadcn.com/docs/installation/next
- shadcn/ui Official Documentation - Theming: https://ui.shadcn.com/docs/theming
- Vercel Documentation - Next.js Framework Guide: https://vercel.com/docs/frameworks/nextjs
- Vercel Documentation - Build Configuration: https://vercel.com/docs/deployments/configure-a-build
- Vercel Documentation - Environment Variables: https://vercel.com/docs/projects/environment-variables

### Secondary (MEDIUM confidence)
- PDF.js GitHub Repository: https://github.com/mozilla/pdf.js (version info, general setup)
- PDF.js FAQ: https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions (worker version matching)
- PDF.js Getting Started: https://mozilla.github.io/pdf.js/getting_started/ (basic concepts)

### Tertiary (LOW confidence)
- Community patterns for PDF.js + Next.js integration - requires verification with official docs before implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified from official sources; Next.js 16 and pdfjs-dist 5.4.530 are current stable releases
- Architecture: HIGH - App Router is officially recommended; patterns come from Next.js official documentation
- PDF.js worker configuration: MEDIUM - Official docs cover basics but Next.js-specific implementation requires testing; version matching is critical but not extensively documented
- shadcn/ui setup: HIGH - Official CLI and documentation provide complete setup guide
- Pitfalls: HIGH - Common issues documented in Next.js docs and PDF.js FAQ; server/client component distinction is well-documented

**Research date:** 2026-01-18
**Valid until:** ~2026-02-18 (30 days - stable stack with mature libraries; Next.js 16 may receive minor updates but core patterns stable)

**Critical validation needed:**
1. PDF.js worker configuration MUST be tested in Vercel production environment immediately after setup
2. Verify pdfjs-dist version matches worker file version before deployment
3. Test full build (`npm run build`) locally before pushing to Vercel

**Next steps for planning:**
- Plan Phase 1 tasks: project initialization, worker configuration, initial shadcn setup
- Include verification task: deploy minimal PDF viewer to Vercel and validate worker loads successfully
- Establish pattern: test in production early and often (Vercel preview deployments)
