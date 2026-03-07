# Architecture Decision Records (ADR)

This folder contains small, focused decision documents that explain **why** we made a technical choice.

## Index

- [ADR 0001: SQLite constraints and sync soft-deletes](0001-sqlite-constraints.md)
- [ADR 0002: Shared core store across desktop and mobile](0002-shared-core-store.md)
- [ADR 0003: Revision-aware sync with deterministic tombstone resolution](0003-revision-aware-sync.md)

## Template

Use this structure when adding a new ADR:

```
# ADR XXXX: Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated | Superseded

## Context
Explain the problem and constraints.

## Decision
Describe the choice and reasoning.

## Consequences
List trade-offs, risks, and follow-up work.
```
