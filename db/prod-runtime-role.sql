-- The role the game connects with in production: it reads and writes rows, and nothing else.
-- Migrations run with the database's owner, which this role never is, so the game itself can't
-- drop or alter a table.
--
-- Run it as the owner, after the migrations, and again whenever its password changes:
--   psql "<owner url>" -v app_password="<password>" -f db/prod-runtime-role.sql
-- It can run any number of times.

\set ON_ERROR_STOP on

SELECT format('CREATE ROLE tcg_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tcg_app')
\gexec

ALTER ROLE tcg_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION
  PASSWORD :'app_password';

SELECT format('GRANT CONNECT ON DATABASE %I TO tcg_app', current_database())
\gexec

GRANT USAGE ON SCHEMA public TO tcg_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tcg_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tcg_app;

-- Tables and sequences that later migrations create, as the owner running this script, get the
-- same rights on their own, so that a new table never fails only in production.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tcg_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO tcg_app;

-- Fails loudly if the role could ever step around the rules.
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_roles
    WHERE rolname = 'tcg_app' AND (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb)
  ) THEN
    RAISE EXCEPTION 'tcg_app has more rights than it should';
  END IF;
END
$$;
