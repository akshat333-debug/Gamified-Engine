# LogicForge 🚀

**AI-Powered Programme Design Tool for Education NGOs**

LogicForge is a comprehensive web application that helps education NGOs design, track, and export intervention programs using AI-powered features aligned with Indian education policies like NIPUN Bharat and NEP 2020.

![LogicForge](https://img.shields.io/badge/Version-4.0-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Workflow](#-workflow)
- [Installation](#-installation)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Screenshots](#-screenshots)

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **5-Step Program Builder** | Guided workflow: Problem → Stakeholders → Theory of Change → Indicators → Review |
| **AI-Powered Assistance** | Groq AI (Llama 3.3 70B) refines problems, suggests stakeholders, generates SMART indicators |
| **Indian Education Context** | Aligned with NIPUN Bharat, NEP 2020, FLN benchmarks, ASER standards |
| **Multi-Format Export** | Export to PDF, CSV, JSON, USAID format, Gates Foundation format |

### Gamification System

| Feature | Description |
|---------|-------------|
| **XP Points** | Earn experience points for completing program steps |
| **Levels** | Progress through levels (1-10) based on XP earned |
| **Leaderboard** | Compete with other users on program completion |
| **Badges** | Earn achievement badges for milestones |
| **Streaks** | Track daily activity streaks with fire mode |

### Advanced Features (v4.0)

| Feature | Description |
|---------|-------------|
| **Template Library** | Pre-built templates: FLN, Career Readiness, STEM, Life Skills |
| **PWA Support** | Install as app, works offline with service worker caching |
| **Collaboration** | Comments and version history for team collaboration |
| **Analytics Dashboard** | Charts for program status, progress timelines, stakeholder engagement |
| **NIPUN Benchmarks** | Compare indicators with national FLN standards |

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Framer Motion** | Smooth animations and transitions |
| **Recharts** | Data visualization charts |
| **React Flow** | Theory of Change diagram builder |
| **html-to-image** | Export diagrams as images |
| **Supabase Auth** | User authentication |

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python API framework |
| **SQLAlchemy** | ORM for database operations |
| **asyncpg** | Async PostgreSQL driver |
| **Pydantic** | Data validation and settings |
| **Groq AI** | AI inference (Llama 3.3 70B model) |
| **WeasyPrint** | PDF generation |

### Database & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Supabase PostgreSQL** | Cloud-hosted database |
| **Service Worker** | Offline caching (PWA) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js 16 (App Router) + TypeScript               │    │
│  │  ├── Pages: Home, Program Builder, Templates,       │    │
│  │  │          Dashboard, Benchmarks, Export           │    │
│  │  ├── Components: Charts, Gamification, Forms        │    │
│  │  └── Auth: Supabase + AuthContext                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                      Axios HTTP                              │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FastAPI + SQLAlchemy                                │    │
│  │  ├── Routers: programs, ai, export, templates,       │    │
│  │  │           gamification, collaboration             │    │
│  │  ├── Services: AI Service (Groq), Export Service     │    │
│  │  └── Models: Program, ProgramStep, Organization      │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
└───────────────────────────┼─────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                                 ▼
┌──────────────────────┐         ┌──────────────────────┐
│   Supabase PostgreSQL │         │      Groq AI API     │
│   (Cloud Database)    │         │  (Llama 3.3 70B)     │
└──────────────────────┘         └──────────────────────┘
```

---

## 📊 Workflow

### 5-Step Program Design Process

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Step 1    │───▶│   Step 2    │───▶│   Step 3    │───▶│   Step 4    │───▶│   Step 5    │
│  Problem    │    │ Stakeholders│    │   Theory    │    │ Indicators  │    │   Review    │
│ Statement   │    │   Mapping   │    │  of Change  │    │ Generation  │    │  & Export   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼                  ▼
   AI Refines       AI Suggests       User Builds         AI Generates      Export to
   Challenge        Stakeholders      ToC Diagram         SMART KPIs        PDF/CSV
```

### Step Details

**Step 1: Problem Statement**
- User enters a vague challenge statement
- AI refines it with Indian education context (NIPUN Bharat, NEP 2020)
- Identifies root causes and suggests theme (FLN, STEM, Career, Life Skills)

**Step 2: Stakeholder Mapping**
- AI suggests relevant stakeholders from Indian education ecosystem
- Includes: Teachers, BEO, CRC, SMC, Parents, Anganwadi workers
- User can add/remove stakeholders with priority levels

**Step 3: Theory of Change**
- Visual diagram builder using React Flow
- Define: Inputs → Activities → Outputs → Outcomes → Impact
- Drag-and-drop interface

**Step 4: Indicator Generation**
- AI generates SMART indicators based on outcome
- Aligned with NIPUN Bharat benchmarks for FLN themes
- Output indicators (activities) + Outcome indicators (impact)

**Step 5: Review & Export**
- Review all program components
- Export options: PDF, CSV, JSON
- Donor formats: USAID, Gates Foundation

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or Supabase account)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and Groq API key

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
GROQ_API_KEY=gsk_your_groq_api_key
APP_ENV=development
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

---

## 🔌 API Endpoints

### Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs/` | List all programs |
| POST | `/api/programs/` | Create new program |
| GET | `/api/programs/{id}` | Get program details |
| PUT | `/api/programs/{id}` | Update program |
| DELETE | `/api/programs/{id}` | Delete program |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/refine-problem` | Refine challenge statement |
| POST | `/api/ai/suggest-stakeholders` | Get stakeholder suggestions |
| POST | `/api/ai/generate-indicators` | Generate SMART indicators |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/{id}/pdf` | Export to PDF |
| GET | `/api/export/{id}/csv` | Export to CSV |
| GET | `/api/export/{id}/json` | Export to JSON |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates/` | List all templates |
| POST | `/api/templates/{id}/create` | Create program from template |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gamification/leaderboard` | Get leaderboard |
| POST | `/api/gamification/award-xp` | Award XP to user |

---

## 🗄 Database Schema

```sql
-- Programs Table
CREATE TABLE programs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50),  -- draft, in_progress, completed
    current_step INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Program Steps Table
CREATE TABLE program_steps (
    id UUID PRIMARY KEY,
    program_id UUID REFERENCES programs(id),
    step_number INTEGER,
    step_type VARCHAR(50),  -- problem, stakeholders, toc, indicators, review
    data JSONB,
    created_at TIMESTAMP
);

-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),  -- ngo, government, foundation
    created_at TIMESTAMP
);
```

---

## 📁 Project Structure

```
GamifiedEngine/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js pages
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── program/[id]/       # Program builder steps
│   │   │   ├── templates/          # Template library
│   │   │   ├── dashboard/          # Analytics dashboard
│   │   │   ├── benchmarks/         # NIPUN benchmarks
│   │   │   └── export/             # Export center
│   │   ├── components/
│   │   │   ├── charts/             # Recharts visualizations
│   │   │   ├── gamification/       # XP, Badges, Leaderboard
│   │   │   └── collaboration/      # Comments, Versions
│   │   ├── contexts/               # Auth context
│   │   └── lib/                    # Supabase client
│   └── public/
│       ├── manifest.json           # PWA manifest
│       └── sw.js                   # Service worker
│
├── backend/
│   └── app/
│       ├── main.py                 # FastAPI app entry
│       ├── config.py               # Settings
│       ├── database.py             # DB connection
│       ├── models/                 # SQLAlchemy models
│       ├── schemas/                # Pydantic schemas
│       ├── routers/                # API routes
│       │   ├── programs.py
│       │   ├── ai.py
│       │   ├── export.py
│       │   ├── templates.py
│       │   ├── gamification.py
│       │   └── collaboration.py
│       ├── services/
│       │   └── ai_service.py       # Groq AI integration
│       └── data/
│           ├── benchmarks.json     # NIPUN benchmarks
│           └── program_templates.json
│
└── .gitignore
```

---

## 🎮 Gamification System

### XP Rewards
| Action | XP Earned |
|--------|-----------|
| Complete Step 1 (Problem) | +50 XP |
| Complete Step 2 (Stakeholders) | +75 XP |
| Complete Step 3 (ToC) | +100 XP |
| Complete Step 4 (Indicators) | +75 XP |
| Complete Program | +200 XP |

### Levels
| Level | XP Required | Title |
|-------|-------------|-------|
| 1 | 0 | Beginner |
| 2 | 500 | Apprentice |
| 3 | 1,500 | Designer |
| 4 | 3,000 | Expert |
| 5 | 5,000 | Master |

---

## 🇮🇳 Indian Education Alignment

### NIPUN Bharat Benchmarks
- **Grade 1**: 15 words/min ORF, basic numeracy
- **Grade 2**: 30 words/min ORF, addition/subtraction
- **Grade 3**: 45 words/min ORF, multiplication/division

### NEP 2020 Focus Areas
- Foundational Literacy & Numeracy (FLN)
- Vocational Education
- Life Skills & Values
- STEM Education

### Stakeholder Ecosystem
- Block Education Officers (BEO)
- Cluster Resource Coordinators (CRC)
- School Management Committees (SMC)
- Anganwadi Workers
- Gram Panchayat Representatives

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Akshat Agrawal**

- GitHub: [@akshat333-debug](https://github.com/akshat333-debug)
- Repository: [Gamified-Engine](https://github.com/akshat333-debug/Gamified-Engine)

---

Built with ❤️ for Indian Education NGOs
