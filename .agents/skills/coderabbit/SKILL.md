---
name: coderabbit
description: Automated AI code reviews, static audits, PR reviews, and quality checks using CodeRabbit. Use when auditing codebases, configuring .coderabbit.yaml, running local reviews, or connecting repositories to CodeRabbit.
---

# CodeRabbit Audit & Review Skill

## Overview
CodeRabbit is an AI-powered code review and static analysis system that reviews git repositories, pull requests, and local changes for:
- Security vulnerabilities and secret leaks
- Logic bugs, race conditions, and error handling gaps
- Type safety and edge case validation
- Architecture, performance, and best practices
- Domain-specific guidelines (e.g. Indian legal compliance, API validation)

---

## 1. Installation & Setup

### CLI Installation (macOS & Linux)

```bash
# Option 1: Official installer script
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# Option 2: Homebrew (macOS)
brew install coderabbit
```

Verify installation:
```bash
coderabbit --version
# or short alias:
cr --version
```

### Authentication
```bash
# Authenticate interactively via browser
cr auth login

# Or headless authentication (CI/CD / automation)
cr auth login --api-key "<YOUR_CODERABBIT_API_KEY>"
```

### Health Check
```bash
cr doctor
```

---

## 2. Running Code Reviews with CodeRabbit CLI

### Audit Uncommitted Changes (Default)
Reviews modified and staged files:
```bash
cr review
```

### Audit With Untracked Files
```bash
cr review --include-untracked
```

### Machine-Readable Structured JSON (For Coding Agents)
Output structured JSON findings for automatic remediation:
```bash
cr review --agent
```

### Audit Committed Changes (Last Commit / Range)
```bash
cr review --committed
```

### Audit Specific Branch Against Base
```bash
cr review --base main
```

### View or Clear Recent Findings
```bash
# View last findings
cr review findings

# Dismiss stored findings
cr review findings --clear
```

---

## 3. Repository Configuration (`.coderabbit.yaml`)

Place `.coderabbit.yaml` at the root of the repository to configure CodeRabbit's behavior:

```yaml
version: "2"
language: "en-US"
tone_instructions: "Be concise, analytical, and provide clear code snippets for suggested improvements. Focus on security, performance, and legal tech UX accuracy."

reviews:
  profile: "chill"
  request_changes_workflow: false
  high_level_summary: true
  poem: false
  review_status: true
  collapse_walkthrough: false
  auto_review:
    enabled: true
    drafts: false
    base_branches:
      - "main"

chat:
  auto_reply: true

knowledge_base:
  opt_out: false
  learnings:
    enabled: true

path_instructions:
  - path: "src/lib/**"
    instructions: "Ensure Indian legal statutes (ICA 1872, CPA 2019, IT Act 2000, Constitution of India) and Gemini API integrations have robust fallback logic, input validation, and proper error handling."
  - path: "src/components/**"
    instructions: "Verify accessibility (ARIA, semantic HTML), responsive UI layout, keyboard navigation, and seamless state transitions between upload, analysis, and result display."
  - path: "firestore.rules"
    instructions: "Strictly verify authentication and user isolation so documents cannot be read or modified by unauthorized users."
```

---

## 4. GitHub Integration Workflow

CodeRabbit operates continuously on GitHub repositories:

1. **Connect Repo**: Install CodeRabbit GitHub App from [coderabbit.ai](https://coderabbit.ai) or [github.com/apps/coderabbitai](https://github.com/apps/coderabbitai).
2. **Grant Access**: Authorize the target repository (e.g. `chourasiavinit9-dev/lexai`).
3. **Automatic PR Reviews**: Any pull request opened to `main` receives an instant AI review comment with summaries, file walkthroughs, and inline code suggestions.
4. **Interactive Chat in PR**:
   - Comment `@coderabbitai review` to re-trigger a complete audit.
   - Comment `@coderabbitai generate docstrings` to add documentation.
   - Comment `@coderabbitai fix this issue` to get an instant patch.

---

## 5. Complementary Local Audit Tools

When CodeRabbit CLI requires authentication or network credentials, always pair it with local static verification:

```bash
# TypeScript strict type checking
npx tsc --noEmit

# ESLint audit with zero warnings
npm run lint

# Next.js static build validation
npm run build
```
