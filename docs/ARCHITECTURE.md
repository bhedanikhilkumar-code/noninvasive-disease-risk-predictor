# Architecture — Noninvasive Disease Risk Predictor

## Purpose

Final year project: A web-based system that predicts early disease risk (e.g., diabetes/heart risk) using non-invasive user inputs like symptoms, lifestyle, and basic vitals. Provides risk score, insights, and analytics dashboard.

This document explains the project from an engineering-review perspective: layers, workflow, data/state movement, and extension points.

## System Context

```mermaid
flowchart LR
    User[User / Reviewer] --> Interface[Project Interface]
    Interface --> Logic[Application Logic]
    Logic --> Data[Data / Device / File Layer]
    Logic --> Output[UI, Report, Generated Asset, or Action]
    Output --> User
```

## Primary Workflow

```mermaid
flowchart TD
    A[Collect input data] --> B[Preprocess and score/classify]
    B --> C[Explain result or recommendation]
    C --> D[Improve model/data quality]
    D --> E[Document, test, and improve]
```

## Layered Design

| Layer | Responsibility | Review Focus |
| --- | --- | --- |
| Interface | Screens, pages, commands, forms, or hardware entry points | Is the user flow clear and easy to demo? |
| State / Logic | Validation, calculations, orchestration, and workflow rules | Is behavior predictable and maintainable? |
| Data / Services | Local storage, API calls, generated files, device APIs, or models | Is data handled safely and consistently? |
| Presentation | README, diagrams, screenshots, and demo notes | Can someone understand the project quickly? |
| Quality | Tests, linting, review checklist, and roadmap | Can the project grow without becoming messy? |

## Technology Profile

| Category | Value |
| --- | --- |
| Primary stack | JavaScript, AI/ML |
| Repository type | Public portfolio |
| GitHub topics | analytics-dashboard, final-year-project, healthcare, javascript, machine-learning, risk-prediction, web-app |

## Data / State Flow

```mermaid
sequenceDiagram
    participant U as User
    participant I as Interface
    participant L as Logic
    participant D as Data/Device Layer
    U->>I: Start main workflow
    I->>L: Send validated intent
    L->>D: Read/write required state
    D-->>L: Return result
    L-->>I: Prepare display/output
    I-->>U: Show final state
```

## Extension Points

- Add screenshots or demo GIFs for the most important workflow.
- Add automated checks that match the stack.
- Add environment documentation if external services are used.
- Add test fixtures or sample data for repeatable demos.
- Convert roadmap items into small, reviewable issues.

## Engineering Review Notes

A strong reviewer should be able to answer:

1. What problem does this project solve?
2. What is the main user workflow?
3. Which files/layers own the core behavior?
4. What tradeoffs are documented?
5. What would be the next professional improvement?
