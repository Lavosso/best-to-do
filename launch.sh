#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if [[ ! -x .venv/bin/python ]]; then
    python3 -m venv .venv
fi

if ! .venv/bin/python -c 'import fastapi, uvicorn; from pydantic import BaseModel; assert hasattr(BaseModel, "model_dump")' 2>/dev/null; then
    .venv/bin/python -m pip install fastapi 'pydantic>=2,<3' uvicorn
fi

exec .venv/bin/python -m uvicorn middlepoint.api:app --app-dir src "$@"
