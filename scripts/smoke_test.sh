#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
TEST_FILE="${TEST_FILE:-/tmp/rag_for_study_smoke.txt}"

cat > "$TEST_FILE" <<'TXT'
RAG помогает отвечать на вопросы по загруженным материалам.
Система должна показывать источники и не выдумывать факты вне документа.
Для учебы можно делать краткое содержание, вопросы, карточки и мнемоники.
TXT

echo "1. Health"
curl -sS "$BASE_URL/health"
echo

echo "2. Upload"
UPLOAD_RESPONSE="$(curl -sS -F "file=@${TEST_FILE};type=text/plain" "$BASE_URL/api/documents/upload")"
echo "$UPLOAD_RESPONSE"
DOCUMENT_ID="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["document_id"])' <<< "$UPLOAD_RESPONSE")"

echo "3. Process"
curl -sS -X POST "$BASE_URL/api/documents/$DOCUMENT_ID/process"
echo

echo "4. Chat"
curl -sS -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"document_id\":\"$DOCUMENT_ID\",\"message\":\"Что должна делать система?\",\"top_k\":4}"
echo
