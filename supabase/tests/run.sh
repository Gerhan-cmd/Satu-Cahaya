#!/bin/sh
# Menjalankan migrasi + uji RLS pada database Postgres sementara.
# Contoh: ADMIN_URL=postgresql://postgres:test@localhost:5432/postgres sh supabase/tests/run.sh
set -eu
cd "$(dirname "$0")"
: "${ADMIN_URL:?Set ADMIN_URL ke koneksi superuser Postgres (bukan database produksi!)}"
DB=satu_cahaya_test
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -q -c "drop database if exists $DB" -c "create database $DB"
# Role bersifat cluster-wide; buat ulang agar skrip bisa diulang.
psql "$ADMIN_URL" -q -c "drop role if exists anon" -c "drop role if exists authenticated" -c "drop role if exists service_role" >/dev/null 2>&1 || true
TEST_URL=$(echo "$ADMIN_URL" | sed "s#/[^/]*\$#/$DB#")
psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -f stubs.sql
for f in ../migrations/*.sql; do psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -f "$f"; done
psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -f rls_test.sql
