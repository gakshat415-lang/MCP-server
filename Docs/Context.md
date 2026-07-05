# Context — MCP Server for Gmail & Google Docs

> Derived from [Ps.txt](file:///c:/MCP%20Server/Docs/Ps.txt)

---

## 1. Project Overview

Build a **Model Context Protocol (MCP) server** that exposes Google Workspace capabilities — specifically **Gmail** and **Google Docs** — as tools that any MCP-compatible AI agent (including Antigravity) can invoke.

The server must be **generic and standards-compliant** so it is not locked to a single AI agent; any client speaking MCP can discover and call its tools.

---

## 2. Core Functionalities

| # | Capability | Description |
|---|-----------|-------------|
| 1 | **Send / Draft Email (Gmail)** | Compose and send emails (or save as drafts) through the Gmail API. Supports `to`, `cc`, `bcc`, subject, body (plain text & HTML), and attachments. |
| 2 | **Append Content to Google Doc** | Append text or rich content to an existing Google Doc via the Google Docs API. Enables the agent to log results, build reports, or maintain living documents. |

---

## 3. Target Consumers

| Consumer | Notes |
|----------|-------|
| **Antigravity (primary)** | The Google DeepMind AI coding agent — first-class integration target. |
| **Other MCP-compatible agents** | Any agent or tool chain that speaks the MCP protocol should be able to discover and call these tools without modification. |

---

## 4. High-Level Architecture

```
┌──────────────────────┐
│   MCP Client         │  (Antigravity, other AI agents)
│   (any MCP agent)    │
└────────┬─────────────┘
         │  MCP protocol (stdio / SSE)
         ▼
┌──────────────────────┐
│   MCP Server         │
│  ┌────────────────┐  │
│  │ Gmail Tools    │  │  send_email, draft_email
│  ├────────────────┤  │
│  │ Google Docs    │  │  append_to_doc
│  │ Tools          │  │
│  ├────────────────┤  │
│  │ Auth Layer     │  │  OAuth 2.0 / Service Account
│  └────────────────┘  │
└────────┬─────────────┘
         │  HTTPS (Google APIs)
         ▼
┌──────────────────────┐
│  Google Workspace    │
│  (Gmail, Docs APIs)  │
└──────────────────────┘
```

---

## 5. Planned MCP Tools

### 5.1 Gmail

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `send_email` | Send an email immediately | `to`, `subject`, `body`, `cc?`, `bcc?`, `html_body?`, `attachments?` |
| `draft_email` | Save an email as a draft | Same as `send_email` |

### 5.2 Google Docs

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `append_to_doc` | Append content to an existing Google Doc | `document_id`, `content`, `content_type?` (plain text / markdown) |

---

## 6. Technical Considerations

### Authentication
- **OAuth 2.0** for user-context access (personal Gmail / Docs).
- Alternatively, **Google Service Accounts** for organisation-managed access.
- Credentials and tokens must be stored securely (e.g., environment variables, encrypted config).

### MCP Compliance
- Implement the MCP tool-calling specification so any compliant client can introspect and invoke tools.
- Expose proper JSON-schema descriptions for every tool and parameter.

### Transport
- Support **stdio** transport (standard for local MCP servers).
- Optionally support **SSE** for remote / networked deployments.

### Genericity
- No agent-specific logic inside the server; all behaviour is driven purely by tool inputs and MCP protocol.
- Clean separation of concerns: transport ↔ tool logic ↔ Google API calls.

---

## 7. Key Design Principles

1. **Standards-first** — Strict MCP compliance so any agent can plug in.
2. **Minimal surface area** — Ship the two core tools first; extend later.
3. **Secure by default** — OAuth tokens never logged; scopes narrowly requested.
4. **Idempotent where possible** — Draft creation can be retried safely.
5. **Clear error reporting** — Surface Google API errors back through MCP error responses with actionable messages.

---

## 8. Open Questions

- [ ] **Language / runtime**: Node.js (TypeScript) or Python?
- [ ] **Auth flow**: OAuth 2.0 (interactive consent) or Service Account (headless)?
- [ ] **Attachment support**: Required for v1, or deferred?
- [ ] **Google Doc formatting**: Plain text append only, or support for Markdown / rich text conversion?
- [ ] **Deployment model**: Local stdio only, or also a hosted SSE endpoint?

---

*This document is the single source of truth for project intent and scope. Update it as decisions are made.*
