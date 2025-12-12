# Security Policy Summary

DomainScope is built with a "Security by Design" approach. This document summarizes the key security controls, encryption algorithms, and policies implemented to protect the application and its data within the KSDC environment.

---

## 1. Access Control

*   **Authentication**: All protected endpoints require a valid JWT (JSON Web Token) signed with a strong secret.
*   **Session Management**: Sessions have a strict 24-hour timeout and can be revoked via Redis.
*   **Least Privilege**: Database users and application roles are configured with minimum necessary permissions.
*   **Anti-Enumeration**: Authentication endpoints return generic error messages ("Invalid credentials") to prevent attackers from discovering valid email addresses.

---

## 2. Cryptography & Encryption

### 2.1 Encryption Algorithms Used

| Layer | Technology | Algorithm | Details |
|:------|:-----------|:----------|:--------|
| **Password Hashing** | `bcryptjs` | **Bcrypt** | Work factor 10 (2^10 = 1,024 iterations) |
| **JWT Signing** | `jsonwebtoken` | **HS256** (HMAC-SHA256) | 24-hour token expiry |
| **Data in Transit** | HTTPS | **TLS 1.2 / TLS 1.3** | All API and web traffic encrypted |
| **OTP Generation** | Node.js `crypto` | **CSPRNG** | `crypto.randomInt()` - 6-digit secure random code |
| **Reset Tokens** | Node.js `crypto` | **CSPRNG** | `crypto.randomBytes(32)` - 256-bit hex token |
| **Database** | PostgreSQL | **AES-256** (at rest) | Managed by KSDC infrastructure |

### 2.2 Password Policy

*   **Minimum Length**: 8 characters
*   **Complexity Requirements**:
    *   At least one uppercase letter (A-Z)
    *   At least one number (0-9)
    *   At least one special character (!@#$%^&*)
*   **Storage**: Never stored in plain text; only Bcrypt hashes are persisted.

### 2.3 Token Security

*   **JWT Structure**: Header.Payload.Signature (Base64URL encoded)
*   **Signing Algorithm**: HMAC-SHA256 (HS256)
*   **Secret Key**: Stored in environment variable `JWT_SECRET` (minimum 32 characters)
*   **Expiration**: 24 hours from issuance
*   **Claims**: `userId`, `email`, `iat` (issued at), `exp` (expiration)

---

## 3. Network Security

*   **Encryption in Transit**: All data transmission occurs over HTTPS (TLS 1.2/1.3).
*   **Certificate**: Valid SSL certificate (DigiCert/LetsEncrypt) with strong cipher suites.
*   **Firewall**: The application sits behind a WAF/Firewall (provided by KSDC), allowing traffic only on ports 80/443.
*   **Internal Isolation**: Database and Redis instances are in a private subnet, inaccessible from the public internet.
*   **CORS Protection**: API access is strictly limited to trusted frontend domains.

---

## 4. Application Security

*   **Rate Limiting**:
    *   **Global**: 100 requests per 15 minutes per IP to prevent DDoS.
    *   **Auth**: 10 requests per hour on login/signup to prevent brute-force attacks.
*   **Input Validation**: All user inputs are validated using **Zod** schemas to prevent Injection attacks (SQLi, XSS).
*   **Output Encoding**: React automatically escapes content to prevent XSS.
*   **Secure Headers**: Implemented via **Helmet**:
    *   `Strict-Transport-Security` (HSTS)
    *   `X-Frame-Options: DENY`
    *   `X-Content-Type-Options: nosniff`
    *   `Content-Security-Policy`
    *   `Referrer-Policy`
*   **Dependency Management**: Regular `npm audit` checks to identify and remediate vulnerable packages.
*   **HTTP Parameter Pollution (HPP)**: Protected against HPP attacks.

---

## 5. Data Protection

*   **Password Storage**: Passwords are never stored in plain text. We use **Bcrypt** with a work factor of 10.
*   **Data Masking**: Sensitive fields are masked in logs (passwords never logged).
*   **Backups**: Encrypted backups of the database are performed daily (managed by KSDC).
*   **API Keys**: External API keys stored only in environment variables, never in code.

---

## 6. Secure Random Generation

All security-critical random values use Node.js `crypto` module (CSPRNG - Cryptographically Secure Pseudo-Random Number Generator):

```javascript
// OTP Generation (6-digit)
crypto.randomInt(100000, 999999)

// Password Reset Token (256-bit)
crypto.randomBytes(32).toString('hex')
```

---

## 7. Incident Response

*   **Monitoring**: Real-time monitoring via Prometheus/Grafana to detect anomalies.
*   **Logging**: Comprehensive audit logs track all failed login attempts, privileged actions, and system errors.
*   **Alerting**: Automated alerts for high error rates or potential security breaches.
*   **Failed Login Tracking**: Consecutive failed attempts are logged with IP address and timestamp.

---

## 8. Compliance

*   **Cert-In**: The application is designed to meet Cert-In (Indian Computer Emergency Response Team) security guidelines.
*   **Data Localization**: All data resides within the KSDC (India), complying with data sovereignty laws.
*   **OWASP Top 10**: Protected against common web vulnerabilities (Injection, XSS, CSRF, etc.).

---

## 9. Summary of Cryptographic Controls

| Control | Implementation | Status |
|:--------|:---------------|:-------|
| Password Hashing | Bcrypt (10 rounds) | ✅ Implemented |
| JWT Authentication | HS256 (HMAC-SHA256) | ✅ Implemented |
| HTTPS/TLS | TLS 1.2/1.3 | ✅ Required |
| Secure Random | crypto.randomBytes / randomInt | ✅ Implemented |
| Database Encryption | AES-256 at rest | ✅ KSDC Managed |

---