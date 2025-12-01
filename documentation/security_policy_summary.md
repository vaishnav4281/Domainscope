# Security Policy Summary

DomainScope is built with a "Security by Design" approach. This document summarizes the key security controls and policies implemented to protect the application and its data within the KSDC environment.

## 1. Access Control

*   **Authentication**: All protected endpoints require a valid JWT (JSON Web Token) signed with a strong secret.
*   **Session Management**: Sessions have a strict timeout and can be revoked via Redis.
*   **Least Privilege**: Database users and application roles are configured with minimum necessary permissions.

## 2. Network Security

*   **Encryption in Transit**: All data transmission occurs over HTTPS (TLS 1.2/1.3).
*   **Firewall**: The application sits behind a WAF/Firewall (provided by KSDC), allowing traffic only on ports 80/443.
*   **Internal Isolation**: Database and Redis instances are in a private subnet, inaccessible from the public internet.

## 3. Application Security

*   **Rate Limiting**:
    *   **Global**: Limits total requests per IP to prevent DDoS.
    *   **Auth**: Strict limits on login/signup to prevent brute-force attacks.
*   **Input Validation**: All user inputs are validated using **Zod** schemas to prevent Injection attacks (SQLi, XSS).
*   **Output Encoding**: React automatically escapes content to prevent XSS.
*   **Secure Headers**: Implemented via **Helmet** (HSTS, X-Frame-Options, X-Content-Type-Options, etc.).
*   **Dependency Management**: Regular `npm audit` checks to identify and remediate vulnerable packages.

## 4. Data Protection

*   **Password Storage**: Passwords are never stored in plain text. We use **Bcrypt** with a work factor of 10+.
*   **Data Masking**: Sensitive fields are masked in logs.
*   **Backups**: Encrypted backups of the database are performed daily.

## 5. Incident Response

*   **Monitoring**: Real-time monitoring via Prometheus/Grafana to detect anomalies.
*   **Logging**: Comprehensive audit logs track all failed login attempts, privileged actions, and system errors.
*   **Alerting**: Automated alerts for high error rates or potential security breaches.

## 6. Compliance

*   **Cert-In**: The application is designed to meet Cert-In (Indian Computer Emergency Response Team) security guidelines.
*   **Data Localization**: All data resides within the KSDC (India), complying with data sovereignty laws.
