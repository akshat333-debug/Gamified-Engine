# LogicForge

A gamified, AI-assisted programme design tool for Education NGOs.

## Project Structure

```
GamifiedEngine/
├── frontend/     # Next.js 14 + TypeScript + Tailwind + Framer Motion
├── backend/      # FastAPI + Python
└── database/     # PostgreSQL schema
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your API keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/logicforge
OPENAI_API_KEY=your-api-key
# or
GOOGLE_API_KEY=your-gemini-key
```

## Features

- 🎮 **Gamified Workflow** - 5-step progressive unlocking
- 🤖 **AI-Assisted** - Problem refinement, stakeholder suggestions, indicator generation
- 📊 **RAG Search** - Find proven education models
- 📄 **PDF Export** - Professional program design documents
