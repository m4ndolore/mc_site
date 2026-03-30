Exploration Report: Signal Incubator Project                                                                                                 
                                                                                                                                                    
       I've completed a thorough exploration of /Users/paulgarcia/Dev/signal-incubator. Here's what I found:                                        
                                                                                                                                                    
       Overall Architecture                                                                                                                         
                                                                                                                                                    
       This is a monorepo-based project using pnpm workspaces containing two main applications (console and dashboard) plus several shared          
       packages. The project integrates Signal messaging with Matrix backend infrastructure and provides AI-powered insights.                       
                                                                                                                                                    
       ---                                                                                                                                          
       1. Project Structure                                                                                                                         
                                                                                                                                                    
       /Users/paulgarcia/Dev/signal-incubator/                                                                                                      
       ├── apps/                                                                                                                                    
       │   ├── console/        # MC Console (Defense Builders Dashboard)                                                                            
       │   └── dashboard/      # Wingman Dashboard (Signal/Matrix integration)                                                                      
       ├── packages/                                                                                                                                
       │   ├── ui/            # Shared UI component library (@mc/ui)                                                                                
       │   ├── shared/        # Shared types (@signal-incubator/shared)                                                                             
       │   ├── ai-advisor/    # AI advisor service                                                                                                  
       │   └── matrix-client/ # Matrix API client                                                                                                   
       ├── deploy/                                                                                                                                  
       │   └── signal-bridge/ # Signal bridge infrastructure (Docker setup)                                                                         
       ├── docs/              # Requirements, plans, sitreps                                                                                        
       └── docker-compose.yml # Local Matrix/Postgres setup                                                                                         
                                                                                                                                                    
       ---                                                                                                                                          
       2. MC Console (Defense Builders Dashboard)                                                                                                   
                                                                                                                                                    
       Location: /Users/paulgarcia/Dev/signal-incubator/apps/console                                                                                
                                                                                                                                                    
       Framework & Stack                                                                                                                            
                                                                                                                                                    
       - Framework: React 18 + TypeScript                                                                                                           
       - Build Tool: Vite 5                                                                                                                         
       - Styling: Tailwind CSS v3                                                                                                                   
       - State Management: React Query v5                                                                                                           
       - Routing: React Router v6                                                                                                                   
       - Dev Server: Port 3003 (Vite)                                                                                                               
                                                                                                                                                    
       Package.json                                                                                                                                 
                                                                                                                                                    
       {                                                                                                                                            
         "name": "console",                                                                                                                         
         "version": "0.1.0",                                                                                                                        
         "private": true,                                                                                                                           
         "type": "module",                                                                                                                          
         "dependencies": {                                                                                                                          
           "@mc/ui": "workspace:*",                                                                                                                 
           "@tanstack/react-query": "^5.0.0",                                                                                                       
           "react": "^18.2.0",                                                                                                                      
           "react-dom": "^18.2.0",                                                                                                                  
           "react-router-dom": "^6.20.0"                                                                                                            
         },                                                                                                                                         
         "scripts": {                                                                                                                               
           "dev": "vite",                                                                                                                           
           "build": "tsc && vite build",                                                                                                            
           "preview": "vite preview",                                                                                                               
           "lint": "eslint src",                                                                                                                    
           "typecheck": "tsc --noEmit"                                                                                                              
         }                                                                                                                                          
       }                                                                                                                                            
                                                                                                                                                    
       Pages                                                                                                                                        
                                                                                                                                                    
       - / - Overview                                                                                                                               
       - /problems - Problem Board                                                                                                                  
       - /builders - Builders list                                                                                                                  
       - /builders/:id - Builder Details                                                                                                            
       - /champions - Champions list                                                                                                                
       - /champions/:id - Champion Details                                                                                                          
       - /watchlist - Watchlist                                                                                                                     
       - /matches - Matches (disabled)                                                                                                              
       - /sprints - Sprints (disabled)                                                                                                              
       - /signals - Signal Channels (disabled)                                                                                                      
                                                                                                                                                    
       Authentication Integration                                                                                                                   
                                                                                                                                                    
       File: /Users/paulgarcia/Dev/signal-incubator/apps/console/src/lib/auth.ts                                                                    
                                                                                                                                                    
       Uses VIA (Verified Identity Access) - Authentik-based auth system with features:                                                             
       - Mock auth support for local dev (via localStorage flag mc_dev_auth)                                                                        
       - Endpoints:                                                                                                                                 
         - GET /auth/me - Check authentication status                                                                                               
         - GET /auth/login - Redirect to login                                                                                                      
         - GET /auth/logout - Logout and redirect                                                                                                   
       - User object: { sub, email, name, groups }                                                                                                  
       - Uses relative paths (proxied in dev to https://www.mergecombinator.com)                                                                    
                                                                                                                                                    
       Dev Config                                                                                                                                   
                                                                                                                                                    
       File: /Users/paulgarcia/Dev/signal-incubator/apps/console/vite.config.ts                                                                     
                                                                                                                                                    
       {                                                                                                                                            
         server: {                                                                                                                                  
           port: 3003,                                                                                                                              
           strictPort: true,                                                                                                                        
           proxy: {                                                                                                                                 
             '/api': {                                                                                                                              
               target: 'https://www.mergecombinator.com',                                                                                           
               changeOrigin: true,                                                                                                                  
               secure: true,                                                                                                                        
             },                                                                                                                                     
             '/auth': {                                                                                                                             
               target: 'https://www.mergecombinator.com',                                                                                           
               changeOrigin: true,                                                                                                                  
               secure: true,                                                                                                                        
               cookieDomainRewrite: 'localhost',                                                                                                    
             },                                                                                                                                     
           },                                                                                                                                       
         },                                                                                                                                         
       }                                                                                                                                            
                                                                                                                                                    
       Base Paths                                                                                                                                   
                                                                                                                                                    
       - Development: http://localhost:3003                                                                                                         
       - Authentication Base: Relative paths (same origin) → proxied to https://www.mergecombinator.com in dev                                      
       - API Base: Same origin, proxied to https://www.mergecombinator.com                                                                          
                                                                                                                                                    
       Deployment Infrastructure                                                                                                                    
                                                                                                                                                    
       - Uses Cloudflare Workers (indicated by .wrangler/ directory)                                                                                
       - No wrangler.toml found yet (may be configured elsewhere)                                                                                   
       - Build output: dist/ directory                                                                                                              
                                                                                                                                                    
       ---                                                                                                                                          
       3. Wingman Dashboard                                                                                                                         
                                                                                                                                                    
       Location: /Users/paulgarcia/Dev/signal-incubator/apps/dashboard                                                                              
                                                                                                                                                    
       Framework & Stack                                                                                                                            
                                                                                                                                                    
       - Framework: React 18 + TypeScript                                                                                                           
       - Build Tool: Vite (same as console)                                                                                                         
       - Styling: Tailwind CSS v3 + custom CSS                                                                                                      
       - State Management: React Query v5                                                                                                           
       - Backend Data: Matrix Synapse homeserver                                                                                                    
       - Icons: Phosphor Icons                                                                                                                      
       - Dev Server: Default Vite port (5173)                                                                                                       
                                                                                                                                                    
       Package.json                                                                                                                                 
                                                                                                                                                    
       {                                                                                                                                            
         "name": "dashboard",                                                                                                                       
         "version": "0.1.0",                                                                                                                        
         "private": true,                                                                                                                           
         "type": "module",                                                                                                                          
         "dependencies": {                                                                                                                          
           "@signal-incubator/shared": "workspace:*",                                                                                               
           "@phosphor-icons/react": "^2.1.0",                                                                                                       
           "@tanstack/react-query": "^5.0.0",                                                                                                       
           "react": "^18.2.0",                                                                                                                      
           "react-dom": "^18.2.0",                                                                                                                  
           "react-router-dom": "^6.20.0",                                                                                                           
           "clsx": "^2.0.0",                                                                                                                        
           "tailwind-merge": "^2.0.0"                                                                                                               
         },                                                                                                                                         
         "scripts": {                                                                                                                               
           "dev": "vite",                                                                                                                           
           "build": "tsc && vite build",                                                                                                            
           "preview": "vite preview",                                                                                                               
           "lint": "eslint src",                                                                                                                    
           "typecheck": "tsc --noEmit"                                                                                                              
         }                                                                                                                                          
       }                                                                                                                                            
                                                                                                                                                    
       Main Components                                                                                                                              
                                                                                                                                                    
       - App.tsx - Main container with 3-panel layout (conversations, messages, advisor)                                                            
       - MatrixLogin.tsx - Login/auth management                                                                                                    
       - ConversationList.tsx - List of rooms                                                                                                       
       - MessageView.tsx - Message display                                                                                                          
       - CommandInput.tsx - Slash commands (/summarize, /actions, /ask, /digest)                                                                    
       - AdvisorPanel.tsx - AI insights panel                                                                                                       
       - ChannelTabs.tsx - Multi-room tab management                                                                                                
                                                                                                                                                    
       Authentication Integration                                                                                                                   
                                                                                                                                                    
       File: /Users/paulgarcia/Dev/signal-incubator/apps/dashboard/src/lib/matrix.ts                                                                
                                                                                                                                                    
       Credentials Storage:                                                                                                                         
       - In-memory store with localStorage persistence                                                                                              
       - Key: matrix:credentials (JSON: { userId, accessToken })                                                                                    
                                                                                                                                                    
       Auth Endpoints (Matrix Synapse v3 API):                                                                                                      
       - POST /_matrix/client/v3/login - User login                                                                                                 
         - Body: { type: "m.login.password", identifier: { type: "m.id.user", user }, password }                                                    
         - Response: { user_id, access_token }                                                                                                      
       - POST /_matrix/client/v3/logout - Logout                                                                                                    
                                                                                                                                                    
       Matrix Server Detection:                                                                                                                     
       const MATRIX_HOMESERVER = import.meta.env.VITE_MATRIX_HOMESERVER || 'http://100.66.200.39:8008';                                             
                                                                                                                                                    
       Environment Variables                                                                                                                        
                                                                                                                                                    
       File: /Users/paulgarcia/Dev/signal-incubator/apps/dashboard/.env                                                                             
       VITE_MATRIX_HOMESERVER=http://mac-mini-1:8008                                                                                                
                                                                                                                                                    
       File: /Users/paulgarcia/Dev/signal-incubator/apps/dashboard/.env.example                                                                     
       # Local: http://localhost:8008                                                                                                               
       # Mac Mini via Tailscale: http://mac-mini-1:8008                                                                                             
       VITE_MATRIX_HOMESERVER=http://localhost:8008                                                                                                 
                                                                                                                                                    
       Matrix Integration Details                                                                                                                   
                                                                                                                                                    
       Connection Points:                                                                                                                           
       1. Login: Username + password → Matrix login endpoint                                                                                        
       2. Room Access: Fetches joined rooms via /_matrix/client/v3/joined_rooms                                                                     
       3. Message Loading: Loads messages from room with pagination support                                                                         
       4. Display Names: Auto-detects Signal ghost identity by analyzing room membership                                                            
       5. Auto-join: Automatically joins pending room invites                                                                                       
       6. Caching: Uses localStorage to cache conversations (5-min TTL)                                                                             
                                                                                                                                                    
       System Filters:                                                                                                                              
       - Filters bot accounts: signalbot, signal_bot, mautrix-signal                                                                                
       - Filters user's Signal ghost identity (detected automatically)                                                                              
                                                                                                                                                    
       Dev Config                                                                                                                                   
                                                                                                                                                    
       File: /Users/paulgarcia/Dev/signal-incubator/apps/dashboard/vite.config.ts                                                                   
       import { defineConfig } from 'vite';                                                                                                         
       import react from '@vitejs/plugin-react';                                                                                                    
       import path from 'path';                                                                                                                     
                                                                                                                                                    
       export default defineConfig({                                                                                                                
         plugins: [react()],                                                                                                                        
         resolve: {                                                                                                                                 
           alias: {                                                                                                                                 
             '@': path.resolve(__dirname, './src'),                                                                                                 
           },                                                                                                                                       
         },                                                                                                                                         
       });                                                                                                                                          
                                                                                                                                                    
       Base Paths & Domains                                                                                                                         
                                                                                                                                                    
       - Development: http://localhost:5173                                                                                                         
       - Matrix Homeserver: http://mac-mini-1:8008 (Tailscale) or http://localhost:8008 (local)                                                     
       - No API auth layer - Direct Matrix API calls with bearer tokens                                                                             
       - CORS: Already configured in Tailwind/build                                                                                                 
                                                                                                                                                    
       ---                                                                                                                                          
       4. Shared Packages                                                                                                                           
                                                                                                                                                    
       @mc/ui (UI Component Library)                                                                                                                
                                                                                                                                                    
       Location: /Users/paulgarcia/Dev/signal-incubator/packages/ui                                                                                 
                                                                                                                                                    
       Exports:                                                                                                                                     
       - Components: PanelLayout, ModuleNav, NavItem, BottomNavItem, ThemeToggle                                                                    
       - Styles: ./src/styles/base.css                                                                                                              
       - CSS Variables for theme support (dark/light mode)                                                                                          
                                                                                                                                                    
       Consumers: console app imports @mc/ui                                                                                                        
                                                                                                                                                    
       @signal-incubator/shared (Shared Types)                                                                                                      
                                                                                                                                                    
       Location: /Users/paulgarcia/Dev/signal-incubator/packages/shared                                                                             
                                                                                                                                                    
       Types: Conversation, Message, and other shared TypeScript types                                                                              
                                                                                                                                                    
       Consumers: dashboard app imports this                                                                                                        
                                                                                                                                                    
       ---                                                                                                                                          
       5. Deployment & Infrastructure                                                                                                               
                                                                                                                                                    
       Local Development: Docker Compose                                                                                                            
                                                                                                                                                    
       File: /Users/paulgarcia/Dev/signal-incubator/docker-compose.yml                                                                              
                                                                                                                                                    
       Services:                                                                                                                                    
       - Synapse (Matrix homeserver) - Port 8008                                                                                                    
         - Image: matrixdotorg/synapse:latest                                                                                                       
         - Database: PostgreSQL 15                                                                                                                  
         - Config: matrix-config/                                                                                                                   
         - Data: matrix-data/                                                                                                                       
       - PostgreSQL - Port 5432                                                                                                                     
         - User: synapse                                                                                                                            
         - DB: synapse                                                                                                                              
                                                                                                                                                    
       Signal Bridge Infrastructure                                                                                                                 
                                                                                                                                                    
       Location: /Users/paulgarcia/Dev/signal-incubator/deploy/signal-bridge/                                                                       
                                                                                                                                                    
       - Synapse - Matrix homeserver instance                                                                                                       
       - Mautrix-signal - Signal bridge connector                                                                                                   
       - Docker Compose setup with persistent data volumes                                                                                          
                                                                                                                                                    
       Cloudflare Workers (Insights API)                                                                                                            
                                                                                                                                                    
       Planned Deployment: CF Workers + D1 database + Durable Objects                                                                               
                                                                                                                                                    
       Details from /Users/paulgarcia/Dev/signal-incubator/docs/plans/2026-02-04-workstream-1-cf-infrastructure.md:                                 
       - Worker Name: insights-worker                                                                                                               
       - Database: D1 (SQLite)                                                                                                                      
       - Auth: CF Access JWT                                                                                                                        
       - API Base URL (prod): https://insights.sigmablox.com                                                                                        
       - Durable Objects: SSE broadcast for real-time updates                                                                                       
       - Service Token: For scheduler ingest                                                                                                        
                                                                                                                                                    
       ---                                                                                                                                          
       6. Auth Integration Points Summary                                                                                                           
       ┌─────────────┬────────────────┬────────────────────────────────┬──────────────────────────────────────┬──────────────────────────┬─────     
       ────────┐                                                                                                                                    
       │     App     │  Auth System   │           Base Path            │              Endpoints               │       User Object        │          
       Storage    │                                                                                                                                 
       ├─────────────┼────────────────┼────────────────────────────────┼──────────────────────────────────────┼──────────────────────────┼─────     
       ────────┤                                                                                                                                    
       │ Console     │ VIA            │ Relative (proxied)             │ /auth/me, /auth/login, /auth/logout  │ {sub, email, name,       │          
       Cookies      │                                                                                                                               
       │             │ (Authentik)    │                                │                                      │ groups}                  │ (VIA     
               │                                                                                                                                    
       ├─────────────┼────────────────┼────────────────────────────────┼──────────────────────────────────────┼──────────────────────────┼─────     
       ────────┤                                                                                                                                    
       │ Dashboard   │ Matrix Direct  │ VITE_MATRIX_HOMESERVER env var │ /_matrix/client/v3/login,            │ {userId, accessToken}    │          
       localStorage │                                                                                                                               
       │             │                │                                │ /_matrix/...                         │                          │          
               │                                                                                                                                    
       ├─────────────┼────────────────┼────────────────────────────────┼──────────────────────────────────────┼──────────────────────────┼─────     
       ────────┤                                                                                                                                    
       │ Insights    │ CF Access      │ https://insights.sigmablox.com │ JWT headers or service tokens        │ CF Access JWT payload    │          
       Headers      │                                                                                                                               
       │ API         │                │                                │                                      │                          │          
               │                                                                                                                                    
       └─────────────┴────────────────┴────────────────────────────────┴──────────────────────────────────────┴──────────────────────────┴─────     
       ────────┘                                                                                                                                    
                                                                                                                                                    
                                                                                                                                                    
       ---                                                                                                                                          
       7. Current Ports & Services                                                                                                                  
                                                                                                                                                    
       - Console Dev: Port 3003                                                                                                                     
       - Dashboard Dev: Port 5173 (default Vite)                                                                                                    
       - Matrix Synapse: Port 8008                                                                                                                  
       - PostgreSQL: Port 5432                                                                                                                      
       - Insights Worker (local): Port 8787 (when running wrangler dev)                                                                             
                                                                                                                                                    
       ---                                                                                                                                          
       8. Key Files Reference                                                                                                                       
       ┌───────────────────────┬──────────────────────────────────────────────────────────┐                                                         
       │        Purpose        │                         Location                         │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Console Auth          │ /apps/console/src/lib/auth.ts                            │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Dashboard Matrix Auth │ /apps/dashboard/src/lib/matrix.ts                        │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Dashboard Login UI    │ /apps/dashboard/src/components/MatrixLogin.tsx           │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Root Workspace Config │ /pnpm-workspace.yaml                                     │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Docker Setup          │ /docker-compose.yml                                      │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Environment Example   │ /.env.example                                            │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Project Docs          │ /docs/ (plans, requirements, sitreps)                    │                                                         
       ├───────────────────────┼──────────────────────────────────────────────────────────┤                                                         
       │ Insights API Plan     │ /docs/plans/2026-02-04-workstream-1-cf-infrastructure.md │                                                         
       └───────────────────────┴──────────────────────────────────────────────────────────┘                                                         
       ---                                                                                                                                          
       Summary                                                                                                                                      
                                                                                                                                                    
       The signal-incubator project contains two production applications:                                                                           
                                                                                                                                                    
       1. MC Console (Defense Builders Dashboard) - React app with VIA authentication, deployed to Cloudflare Workers, accessible at port 3003      
       2. Wingman Dashboard - React app with direct Matrix Synapse authentication, runs on port 5173, provides Signal message analysis with AI      
       advisor                                                                                                                                      
                                                                                                                                                    
       Both apps share UI components and types, with deployment infrastructure supporting local Docker-based development and cloud deployment t     
        Cloudflare. The project is actively developing an Insights API on Cloudflare Workers for real-time insight delivery.  