# Backup & Disaster Recovery Plan

To ensure business continuity and data integrity, DomainScope implements a robust backup and recovery strategy.

## 1. Backup Strategy

### 1.1. Database (PostgreSQL)
*   **Type**: Full daily backups + WAL (Write Ahead Log) archiving for Point-in-Time Recovery (PITR).
*   **Frequency**:
    *   **Full Backup**: Daily at 02:00 AM IST.
    *   **Incremental**: Every 6 hours.
*   **Retention**:
    *   Daily backups: 30 days.
    *   Monthly backups: 1 year.
*   **Storage**: Encrypted and stored in a separate storage zone (e.g., KSDC Backup Server or S3-compatible object storage).

### 1.2. Configuration & Code
*   **Code**: Version controlled via Git (GitHub/GitLab).
*   **Configuration**: Environment variables (`.env`) are backed up securely in a password manager or KSDC's secrets management system.

### 1.3. Redis (Cache)
*   **Strategy**: Redis is primarily a cache, but persistence (AOF) is enabled to survive restarts.
*   **Backup**: Snapshot (RDB) taken daily. Note: Loss of Redis data is non-critical as it can be repopulated.

## 2. Disaster Recovery (DR)

### 2.1. Recovery Scenarios
*   **Server Failure**: Spin up a new application instance and connect to the existing database. (RTO: < 1 hour).
*   **Database Corruption**: Restore from the latest healthy backup. (RPO: < 6 hours, RTO: < 4 hours).
*   **Data Center Outage**: If KSDC has a DR site, replicate data to the secondary site.

### 2.2. Restoration Procedure
1.  **Identify Incident**: Confirm data loss or corruption.
2.  **Stop Application**: Prevent further writes to the corrupt DB.
3.  **Retrieve Backup**: Fetch the latest valid backup file.
4.  **Restore**:
    ```bash
    pg_restore -h <db_host> -U <db_user> -d <db_name> <backup_file>
    ```
5.  **Verify**: Check data integrity.
6.  **Restart Application**: Bring services back online.

### 2.3. Testing
*   Disaster recovery drills will be conducted **quarterly** to verify backup integrity and restoration procedures.
