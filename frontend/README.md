# MARS Frontend — React Client

Welcome to the frontend of the Multi-Agent Research System (MARS). This is a highly polished, responsive web application built with React 19, TypeScript, Vite, and Tailwind CSS. It incorporates Framer Motion for state-driven micro-animations and Lucide React for professional system iconography.

## Quick Start

### 1. Configure Environments
Create a `.env` file in this directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_URL=http://localhost:8000
```

### 2. Install & Start
```bash
npm install
npm run dev
```
Open `http://localhost:5173` to interact with the interface.

---

## Key Directories & Modules

- `/src/pages/`
  - **[ResearchPage.tsx](file:///d:/Yash%20Coding/ai%20learning/MultiAjentSystem/frontend/src/pages/ResearchPage.tsx)**: Main dashboard. Orchestrates SSE pipeline streams, displays step-by-step real-time agent progression badges, handles tab views, and triggers markdown report exports.
  - **[AuthPage.tsx](file:///d:/Yash%20Coding/ai%20learning/MultiAjentSystem/frontend/src/pages/AuthPage.tsx)**: Minimalist and beautiful login/signup forms hooked into Supabase Auth.
- `/src/icons.tsx`
  - Unified, modern exports utilizing Lucide React to ensure state-of-the-art icons across all UI modules.
- `/src/hooks.ts`
  - Contains unified history persistence hooks that seamlessly sync your search logs to the Supabase Database backend.
- `tailwind.config.js`
  - Customized with professional-grade color palettes: Sage (`#8FA294`), Lavender (`#B5A6C9`), Wheat (`#EED9B3`), and sleek dark UI surface styles.

---

## Features & Polish

1. **SSE Streaming Indicators**: Dynamic loading dots blink when an agent is processing.
2. **Glassmorphism Styling**: Card borders and text areas rely on subtle transparencies.
3. **Responsive Mobile Drawers**: Seamless mobile navigation using spring transitions via Framer Motion.
4. **Professional Icons**: Leverages Lucide Icons exclusively for clear, high-quality, modern representation across actions and navigation.
