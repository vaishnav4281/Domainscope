# Expected Load & User Base

This document provides an estimation of the user base and system load for the DomainScope application to assist in capacity planning at the Kerala State Data Centre (KSDC).

## 1. Target User Base

The application is intended for use by:
*   **Primary Users**: Cybersecurity Analysts within the Kerala State IT Mission and related departments.
*   **Secondary Users**: IT Administrators of various government departments verifying their own assets.
*   **Estimated User Count**:
    *   **Initial Phase (Months 1-3)**: 50 - 100 active users.
    *   **Growth Phase (Months 4-12)**: 200 - 500 active users.

## 2. Traffic Estimation

### 2.1. Request Patterns
*   **Average Session Duration**: 10 minutes.
*   **Scans per Session**: 5 - 10 domains.
*   **Peak Usage Hours**: 10:00 AM - 05:00 PM IST (Office Hours).

### 2.2. Throughput Estimates (Initial Phase)
*   **Daily Active Users (DAU)**: ~50
*   **Total Scans per Day**: 50 users * 10 scans = 500 scans/day.
*   **API Requests per Scan**: ~10 internal requests (Frontend -> Backend).
*   **Total Daily Requests**: 5000 requests/day.
*   **Requests Per Second (RPS)**:
    *   **Average**: < 1 RPS.
    *   **Peak**: 5 - 10 RPS (during concurrent usage or bulk scanning).

### 2.3. Throughput Estimates (Growth Phase)
*   **Daily Active Users (DAU)**: ~300
*   **Total Scans per Day**: 3000 scans/day.
*   **Peak RPS**: 20 - 50 RPS.

## 3. Resource Utilization Estimates

### 3.1. Compute (CPU/RAM)
*   **Node.js Backend**: Lightweight, mostly I/O bound.
    *   **Requirement**: 2 vCPUs, 4GB RAM (Sufficient for up to 100 RPS).
*   **Background Workers**: CPU intensive during parsing/crypto.
    *   **Requirement**: 2 vCPUs, 4GB RAM.

### 3.2. Storage (Database)
*   **User Data**: Negligible (< 100MB).
*   **Scan History**:
    *   Size per scan record: ~5KB (JSON).
    *   Daily growth (Initial): 500 * 5KB = 2.5MB.
    *   Annual growth: ~1GB.
    *   **Requirement**: 20GB SSD (Sufficient for 3-5 years).

### 3.3. Bandwidth
*   **Inbound**: Minimal (Search queries).
*   **Outbound**: Moderate (Fetching data from external APIs).
*   **Estimate**: < 100GB/month.

## 4. Scalability Plan
The system is designed to scale horizontally. If load exceeds estimates:
1.  **Application**: Increase the number of PM2 instances or deploy additional VM nodes behind the Load Balancer.
2.  **Database**: Enable Read Replicas for PostgreSQL.
3.  **Caching**: Increase Redis memory allocation to cache more results and reduce backend load.
