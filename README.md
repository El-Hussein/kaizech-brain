# Kaizech Brain — System Documentation & Operations Guide

This document contains the setup, architecture, Docker container workflows, API specifications, and Tool Manifest documentation for **Kaizech Brain (Multi-tenant AI Agent Platform)**.

---

## 1. System Architecture & Docker Services

All services for the platform run within isolated Docker containers defined in `docker-compose.yml`.

| Service Container Name | Description | Host Access URL | Internal Port | Environment / Driver |
| :--- | :--- | :--- | :--- | :--- |
| **`kaizech-dashboard`** | Tenant Customer Dashboard UI | [http://localhost:5173](http://localhost:5173) | `80` | Nginx + Production Build |
| **`kaizech-admin`** | Platform Super Admin UI | [http://localhost:5174](http://localhost:5174) | `80` | Nginx + Production Build |
| **`kaizech-api`** | NestJS Backend API Server | [http://localhost:3000](http://localhost:3000) | `3000` | Node.js 20 / NestJS |
| **`kaizech-postgres`** | Database Server | `localhost:5432` | `5432` | PostgreSQL 16 + pgvector |
| **`kaizech-redis`** | Cache & Queue Manager | `localhost:6379` | `6379` | Redis 7 Alpine |

---

## 2. Docker Operations & Code Change Workflows

### Overview
Docker containers run compiled or bundled images. Edits made on your local filesystem do not update inside running containers automatically. Follow the workflows below when modifying code.

### A. Updating Code After Changes
When you modify code in any package or application, rebuild and restart the Docker stack using:

```bash
# Rebuild and start all containers in background
docker compose up -d --build
```

### B. Updating Specific Components Only
To save time, you can target and rebuild only the modified service:

- **Backend API & Shared Libraries (`apps/api`, `libs/*`)**:
  ```bash
  docker compose up -d --build api
  ```
- **Tenant Dashboard (`apps/dashboard`)**:
  ```bash
  pnpm build:dashboard && docker compose up -d --build dashboard
  ```
- **Super Admin Dashboard (`apps/admin`)**:
  ```bash
  pnpm build:admin && docker compose up -d --build admin
  ```

### C. Useful Docker Commands

- **Check status of containers**:
  ```bash
  docker compose ps
  ```
- **Stream live logs for all services**:
  ```bash
  docker compose logs -f
  ```
- **Stream live logs for Backend API only**:
  ```bash
  docker compose logs -f api
  ```
- **Restart a container without rebuilding**:
  ```bash
  docker compose restart api
  ```
- **Stop all running Docker services**:
  ```bash
  docker compose down
  ```

---

## 3. Registered Tool Specification: `getUserInfo`

The `getUserInfo` tool allows the AI Agent and tenant operators to fetch full user profile details, buyer/seller roles, account classifications, verification status, active user papers, ticket sizes, and primary addresses.

### Tool Manifest Overview
- **Tool Name**: `getUserInfo`
- **HTTP Method**: `POST`
- **Target Customer Endpoint**: `https://api-stg.markoontest.online/api/chatbot/getUserInfo`
- **Authentication**: Tenant API Key header (`x-api-key: kb_demo_tenant_key`)
- **Timeout**: `30000ms`
- **Status**: `Active`

### Accepted JSON Parameters Schema
```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "integer",
      "description": "The unique ID of the user (e.g. 42)"
    },
    "phone": {
      "type": "string",
      "description": "User mobile phone number (e.g. 201000000000)"
    },
    "email": {
      "type": "string",
      "description": "User email address"
    }
  }
}
```

### Sample Request Payload (Tool Execution)
```json
{
  "user_id": 4594
}
```

---

## 4. API Endpoints Reference

### A. List Registered Tools
```http
GET /api/v1/tools
Header: x-api-key: kb_demo_tenant_key
```

### B. Register or Update Tool Manifest
```http
POST /api/v1/tools
Header: Content-Type: application/json
Header: x-api-key: kb_demo_tenant_key

{
  "name": "getUserInfo",
  "description": "Fetch user profile details...",
  "apiEndpoint": "https://api-stg.markoontest.online/api/chatbot/getUserInfo",
  "httpMethod": "POST",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "integer", "description": "The unique ID of the user" },
      "phone": { "type": "string", "description": "User phone number" },
      "email": { "type": "string", "description": "User email address" }
    }
  }
}
```

### C. Test Tool Execution (Interactive Tool Tester)
```http
POST /api/v1/tools/test
Header: Content-Type: application/json
Header: x-api-key: kb_demo_tenant_key

{
  "toolName": "getUserInfo",
  "parameters": {
    "user_id": 4594
  }
}
```

### D. Client-Initiated Human Handoff API
```http
POST /api/v1/channels/handoff
Header: Content-Type: application/json
Header: x-api-key: kb_demo_tenant_key

{
  "sessionId": "user_session_98765",
  "reason": "client_button_clicked",
  "notice": "Customer requested live agent support"
}
```

---

## 5. Dashboard Features & Enhancements

1. **Interactive Tool Tester**:
   - Selecting a tool in the dropdown displays an **Accepted Tool Parameters** box showing parameter names, data types, and descriptions.
   - Automatically pre-fills a valid sample JSON test payload.
   - Includes an **`Auto-fill Sample Body`** button to re-generate test payloads on demand.

2. **Editing Registered Tools**:
   - Each card under **Active Registered Tools** includes an **`Edit`** button.
   - Clicking **`Edit`** populates the tool registration form so you can update the URL endpoint, HTTP method, description, or parameter schema seamlessly.
