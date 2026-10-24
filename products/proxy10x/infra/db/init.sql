-- Proxy10x PostgreSQL Initialisation
-- Runs once when the postgres container starts for the first time
-- Creates the proxy10x database user and database, then applies the schema

-- This file is executed as the postgres superuser via docker-entrypoint-initdb.d

-- Create application user (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'proxy10x') THEN
        CREATE USER proxy10x WITH PASSWORD 'proxy10x_local_dev';
    END IF;
END
$$;

-- Create database (idempotent via shell wrapper in docker-compose)
-- The database 'proxy10x' is created by POSTGRES_DB env var in docker-compose

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE proxy10x TO proxy10x;
GRANT ALL ON SCHEMA public TO proxy10x;

-- Switch to proxy10x database and apply schema
\c proxy10x

-- Apply full schema
\i /docker-entrypoint-initdb.d/schema.sql

-- Grant table/sequence permissions after schema creation
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO proxy10x;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO proxy10x;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO proxy10x;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO proxy10x;
