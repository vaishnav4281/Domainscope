# Data Flow Model

This document describes the flow of data through the DomainScope system, from user initiation to data storage and retrieval.

## 1. User Authentication Flow

1.  **User Action**: User submits login credentials (Email/Password) via the Frontend.
2.  **Transmission**: Data is sent over HTTPS (TLS 1.2+) to the Load Balancer.
3.  **Processing**:
    *   Backend receives the request.
    *   Rate Limiter checks for abuse (Login attempts).
    *   Password is hashed (Bcrypt) and compared with the stored hash in **PostgreSQL**.
4.  **Response**:
    *   If valid, a JWT (JSON Web Token) is generated.
    *   The token is returned to the user (HttpOnly Cookie or Bearer Token).
    *   Session data is cached in **Redis** for fast validation.

## 2. Domain Scan Data Flow

1.  **Initiation**: User enters a domain (e.g., `example.gov.in`) and clicks "Scan".
2.  **Validation**:
    *   Frontend performs basic format validation.
    *   Backend validates the domain format and checks user quota.
3.  **Cache Check**:
    *   Backend checks **Redis** for existing, fresh results for this domain.
    *   **Hit**: Cached data is returned immediately (Latency: < 50ms).
    *   **Miss**: A new scan job is created.
4.  **Job Enqueueing**:
    *   The scan job is pushed to a **BullMQ** queue in **Redis**.
    *   Backend returns a "Job ID" to the Frontend to poll for status.
5.  **Processing (Worker Layer)**:
    *   Worker picks up the job.
    *   **Parallel Fetching** (with fallback chains):
        *   **WHOIS**: Queries Port 43 or RDAP endpoints.
        *   **DNS**: Queries public DNS resolvers (Google/Cloudflare).
        *   **Subdomains**: crt.sh → HackerTarget → AlienVault OTX (fallback chain).
        *   **IP Intelligence**: IPInfo → ProxyCheck.io → IP2Location.io (fallback chain).
        *   **Threat Intel**: VirusTotal, AbuseIPDB, Google Safe Browsing, URLScan.io, AlienVault OTX.
        *   **Security Analysis**: Checks SSL Certificates, HTTP Headers, Email Security (SPF/DKIM/DMARC).
        *   **Historical**: Queries Wayback Machine.
    *   **Aggregation**: Results are combined into a standardized JSON format.
6.  **Storage**:
    *   Final result is saved to **PostgreSQL** (`ScanHistory` table).
    *   Result is cached in **Redis** with a TTL (Time To Live).
7.  **Completion**:
    *   Frontend polls/receives notification of job completion.
    *   Data is displayed to the user.

## 3. Data Classification

| Data Type | Classification | Storage | Encryption |
| :--- | :--- | :--- | :--- |
| User Credentials | Confidential | PostgreSQL | Bcrypt Hash |
| User Profile (Email) | Private | PostgreSQL | At Rest (DB Level) |
| Scan History | Internal | PostgreSQL | At Rest (DB Level) |
| Domain Intelligence | Public/Open | Redis/PostgreSQL | None |
| API Keys (External) | Secret | Environment Vars | N/A |

## 4. Data Retention Policy

*   **User Data**: Retained until account deletion.
*   **Scan History**: Retained for 1 year, then archived or pruned.
*   **Cache**: Retained for 24 hours (configurable) to ensure data freshness.
*   **Logs**: Retained for 90 days for audit and security compliance.
