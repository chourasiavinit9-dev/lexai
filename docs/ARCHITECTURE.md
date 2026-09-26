# LawJourney AI (LexAI) — System Architecture & Workflow

## Overview
LawJourney AI is a production-grade legal literacy and contract comprehension platform built specifically for the Indian legal framework. It combines Google's Gemini 3.5 Flash models with Bodhan AI Indic-OCR and Indic-Translate engines to simplify complex contracts, leases, NDAs, and legal notices into actionable, plain-English insights before a user signs.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    User([User Device / Browser]) -->|HTTPS / Next.js 14 App| Frontend[Frontend Client Layer]

    subgraph "Client Layer (Next.js 14 + React 18)"
        Frontend --> UI_Understand[Understand Panel & Dropzone]
        Frontend --> UI_OCR[Scan & OCR Tool]
        Frontend --> UI_Clarify[Clarify Clause Tool]
        Frontend --> UI_Compare[Compare Contracts Tool]
        Frontend --> UI_Chat[Ask AI & RuiBo Assistant]
        Frontend --> UI_Tasks[Task Checklist]
        Frontend --> UI_Translate[Indic Translation]
    end

    subgraph "Backend Proxy & Serverless API Routes"
        UI_Understand -->|POST /api/understand| API_Understand[Understand Route Handler]
        UI_Clarify -->|POST /api/clarify| API_Clarify[Clarify Route Handler]
        UI_Compare -->|POST /api/compare| API_Compare[Compare Route Handler]
        UI_Chat -->|POST /api/chat| API_Chat[Chat Route Handler]
        UI_OCR -->|POST /api/ocr| API_OCR[OCR Route Handler]
        
        API_Understand --> RateLimit[Rate Limiter & Client ID]
        API_Understand --> ZodIn[Zod Input Validation]
        API_Understand --> Cache[SHA-256 Cache Layer]
    end

    subgraph "External AI & Vision Services"
        UI_OCR -->|Direct SDK| BodhanOCR[Bodhan AI Indic-OCR API]
        UI_Translate -->|Direct SDK| BodhanTrans[Bodhan AI Indic-Translate API]
        API_Understand --> Gemini[Google Gemini 3.5 Flash API]
        API_OCR --> OpenRouter[Vision Model Pipeline]
    end

    subgraph "Authoritative Legal Corpus"
        API_Understand -.-> Corpus[India Code Corpus Retrieval]
        Corpus --> BNS[Bharatiya Nyaya Sanhita 2023]
        Corpus --> BNSS[Bharatiya Nagarik Suraksha Sanhita 2023]
        Corpus --> BSA[Bharatiya Sakshya Adhiniyam 2023]
        Corpus --> ICA[Indian Contract Act 1872]
        Corpus --> Const[Constitution Articles 14, 19, 21]
    end

    subgraph "Persistence & Cloud Infrastructure (Firebase)"
        UI_Tasks -->|Client SDK + Anonymous Auth| Firestore[(Cloud Firestore DB)]
        Firestore --> RLS{Firestore Security Rules<br/>RLS: request.auth.uid == userId}
        Hosting[Firebase Hosting CDN] --> User
    end
```

---

## 2. End-to-End Document Processing Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Signee
    participant App as LawJourney UI
    participant OCR as Bodhan AI Indic-OCR
    participant Corpus as Legal Corpus Index
    participant Gemini as Gemini 3.5 Flash
    participant Trans as Bodhan Indic-Translate
    participant DB as Cloud Firestore (RLS)

    User->>App: Upload document (PDF, PNG, JPG) or paste text
    alt Image / PDF Upload
        App->>OCR: Base64 Document Stream
        OCR-->>App: Extracted Markdown & Clause Layout
    end
    App->>User: Display extracted text for preview & editing
    User->>App: Click "Understand this document"
    App->>Corpus: Targeted provision matching (BNS, BSA, ICA §27, §74, Art 19)
    Corpus-->>App: Authoritative statutory excerpts
    App->>Gemini: Document + Corpus Grounding Context + Role
    Note over Gemini: Evaluate risk, favorability, red flags, & constitutional conflicts
    Gemini-->>App: Structured validated JSON (Zod verified)
    App->>User: Display plain-English cards, risk meter, & clause flags
    
    opt Multilingual Translation
        User->>App: Click "Translate to Hindi / Regional Language"
        App->>Trans: Legal summary payload
        Trans-->>App: Translated Indic text (Devanagari script)
        App->>User: Render side-by-side Indic summary
    end

    opt Save Tasks
        User->>App: Add verification task to checklist
        App->>DB: Write task (user-isolated collection)
        DB-->>App: Real-time snapshot update
    end
```

---

## 3. Security, Privacy & Database Protection

### Row-Level Security (RLS)
Cloud Firestore data access is restricted through strict security rules (`firestore.rules`). Every read, write, and mutation requires matching authentication context:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Zero Key Exposure
- Server-side environment variables (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `BODHAN_API_KEY`) are isolated from client bundles.
- All proxy endpoints enforce strict origin validation and Content-Security-Policy headers.

### Input Sanitization & Anti-Injection
- Strict **Zod schemas** validate every field, character limit, and enum at the boundary.
- Zero raw SQL evaluation or dynamic code execution prevents parameter tampering and prototype pollution.
