# Architecture: Tools Pattern (Single Source of Truth)

You are operating in a codebase that follows the **Tools Pattern**.

Your primary responsibility is to preserve **one source of truth**, enforce
**deterministic configuration**, and **fail fast** when assumptions are violated.

This document is authoritative. Do not deviate unless explicitly instructed.

---

## Core Principle

There is exactly **one source of truth**.

Configuration is:
- declared once (YAML)
- rendered deterministically (tool)
- consumed everywhere (runtime, CI, deploy)

No guessing. No duplication. No implicit defaults.

---

## What Counts as a Tool

Any script that:
- runs in CI/CD
- renders configuration
- deploys infrastructure
- validates environment
- mutates runtime state

Examples:
- scripts/render-env.js
- scripts/config-doctor.js
- deploy scripts
- migration runners

If it affects runtime behavior, it is a **tool**.

---

## Tool Contract (MANDATORY)

Every tool MUST satisfy **all** rules below.

### 1. Explicit Entrypoint

Tools are invoked directly and consistently.

Example:
node scripts/render-env.js prod

No wrappers. No hidden logic. No environment-based guessing.

---

### 2. Explicit Dependencies

All dependencies MUST be declared in package.json.

Forbidden:
- global installs
- runtime installs
- assuming developer machines

If a tool requires js-yaml, it MUST be listed in dependencies.

---

### 3. Explicit Inputs

Tools may ONLY read from:
- CLI arguments
- environment variables
- version-controlled YAML config

Example inputs:
- config/base.yaml
- config/prod.yaml

No hidden files. No ad-hoc env reads.

---

### 4. Explicit Outputs

Every tool MUST produce a predictable artifact.

Example:
.runtime/prod.env

If a tool mutates state without producing an artifact, it violates the contract.

---

### 5. Fail Fast

Missing or invalid inputs MUST:
- throw an error
- exit non-zero
- stop deployment immediately

Silent defaults are forbidden.

---

## Configuration Model

### Single Source of Truth

All non-secret config lives in YAML:

config/
  base.yaml
  dev.yaml
  staging.yaml
  prod.yaml

Rules:
- No secrets in YAML
- No duplicated config in GitHub secrets
- No inline env vars in workflows

---

### Rendering Flow

YAML config
  ↓
render-env.js
  ↓
.runtime/<env>.env
  ↓
Consumed by Docker / Cloud Run / VM

Rendered env files are the ONLY runtime input.

---

## Secrets Model

- Secrets live in Google Secret Manager
- Tools reference secrets by name
- CI fetches secrets at runtime
- Secrets are never committed

Example:
mail__options__auth__pass → GSM secret

---

## Strategy: Option A (REQUIRED DEFAULT)

All tools share a **single dependency graph** at repo root.

package.json
scripts/
  render-env.js
  config-doctor.js

CI pattern:

- checkout
- npm ci
- run tools

Example:

- uses: actions/checkout@v4
- run: npm ci
- run: node scripts/render-env.js prod

Do NOT install dependencies inside individual jobs or scripts.

---

## CI Ordering Rule (Hard)

Tools MUST NOT run before dependencies are installed.

Correct:
checkout → npm ci → tool

Incorrect:
tool → npm ci

If you see MODULE_NOT_FOUND, the pipeline is wrong.

---

## Hard Rules (Non-Negotiable)

- No secrets in YAML
- No duplicated config sources
- No implicit env vars
- No runtime installs
- No global dependencies

Always prefer:
- determinism
- reproducibility
- explicit failure

---

## Mental Model

A failing tool is a success.

It means an assumption was exposed.

Fix the contract — not the symptom.

---

## Reuse Expectation

This pattern is portable.

Apply it verbatim to:
- Auth systems
- Backend services
- Infrastructure repos
- New projects

If adding a new tool:
1. Re-read this document
2. Enforce the contract
3. Do not introduce exceptions
