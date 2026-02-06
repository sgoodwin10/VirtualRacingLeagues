#!/usr/bin/env bash
set -euo pipefail



# collect metadata

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ROOT=$(git rev-parse --show-toplevel)
  REPO_NAME=$(basename "$REPO_ROOT")
  GIT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
  GIT_COMMIT=$(git rev-parse HEAD)
else
  REPO_ROOT=""
  REPO_NAME=""
  GIT_BRANCH=""
  GIT_COMMIT=""
fi

DEV_NAME=${DEV_NAME:-$(whoami)}

TIMEZONE=${DEV_TIMEZONE:-'Australia/Sydney'}
if [ -n "$TIMEZONE" ]; then
    DATETIME_TZ=$(TZ="$TIMEZONE" date '+%Y-%m-%d %H:%M:%S %Z')
    DATETIME_TZ_ISO=$(TZ="$TIMEZONE" date '+%Y-%m-%dT%H:%M:%S%:z')
    FILENAME_TS=$(TZ="$TIMEZONE" date '+%Y-%m-%d_%H-%M-%S')
else
    DATETIME_TZ=$(date '+%Y-%m-%d %H:%M:%S %Z')
    DATETIME_TZ_ISO=$(date '+%Y-%m-%dT%H:%M:%S%:z')
    FILENAME_TS=$(date '+%Y-%m-%d_%H-%M-%S')
fi



# output the metadata

[ -n "$REPO_NAME" ] && echo "Repository Name: $REPO_NAME"
[ -n "$GIT_BRANCH" ] && echo "Current Branch Name: $GIT_BRANCH"
[ -n "$GIT_COMMIT" ] && echo "Current Git Commit Hash: $GIT_COMMIT"

[ -n "$DEV_NAME" ] && echo "Developer Name: $DEV_NAME"

echo "Current Date/Time (TZ): $DATETIME_TZ"
echo "Current Date/Time (ISO): $DATETIME_TZ_ISO"
echo "Timestamp For Filename: $FILENAME_TS"
