# GRABB-IT Clothing — Production Backup & Disaster Recovery Guide

This document outlines automated backup procedures, database dump strategies, and recovery workflows for production databases and image assets.

---

## 1. PostgreSQL Database Automated Backups

### Daily Automated Backups via pg_dump
Set up a cron job or scheduled worker on your server / CI pipeline to dump the PostgreSQL database daily:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/grabb_it"
mkdir -p $BACKUP_DIR

pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_DIR/grabb_it_backup_$TIMESTAMP.dump"

# Retain backups for 30 days
find $BACKUP_DIR -type f -name "*.dump" -mtime +30 -delete
```

### Point-in-Time Recovery (PITR)
Managed database services (Render PostgreSQL, Neon, AWS RDS) include continuous WAL archiving. In the event of data corruption, restore the database to any specific second in the past 7 to 30 days via the provider management console.

---

## 2. Disaster Recovery Workflow

### Scenario A: Database Instance Failure / Data Corruption

1. Provision a clean PostgreSQL instance.
2. Restore the latest backup file:

```bash
pg_restore --clean --no-acl --no-owner -d "NEW_POSTGRESQL_DATABASE_URL" /var/backups/grabb_it/grabb_it_backup_LATEST.dump
```

3. Update `DATABASE_URL` in backend environment variables and restart backend.

### Scenario B: Cloudinary Image Storage Recovery

Since image URLs stored in the PostgreSQL database point to Cloudinary persistent CDN endpoints, database restoration automatically reconnects all product images and banner URLs without needing local image file transfers.
