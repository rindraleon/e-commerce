#!/usr/bin/env bash
set -Eeuo pipefail

: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
BACKUP_PREFIX="${BACKUP_PREFIX:-eshop}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
BACKUP_FILENAME="${BACKUP_PREFIX}-${TIMESTAMP}.sql.gz"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

mkdir -p "${BACKUP_DIR}"

pg_dump \
  --no-owner \
  --no-privileges \
  --format=plain \
  "${BACKUP_DATABASE_URL}" | gzip -c > "${BACKUP_FILEPATH}"

find "${BACKUP_DIR}" -type f -name "${BACKUP_PREFIX}-*.sql.gz" -mtime +"${BACKUP_RETENTION_DAYS}" -delete || true

echo "Backup created: ${BACKUP_FILEPATH}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "backup_file=${BACKUP_FILEPATH}"
    echo "backup_filename=${BACKUP_FILENAME}"
  } >> "${GITHUB_OUTPUT}"
fi

if [[ -n "${S3_BACKUP_BUCKET:-}" ]]; then
  S3_PREFIX="${S3_BACKUP_PREFIX:-postgres}"
  aws s3 cp \
    "${BACKUP_FILEPATH}" \
    "s3://${S3_BACKUP_BUCKET}/${S3_PREFIX}/${BACKUP_FILENAME}"
  echo "Backup uploaded to s3://${S3_BACKUP_BUCKET}/${S3_PREFIX}/${BACKUP_FILENAME}"
fi
