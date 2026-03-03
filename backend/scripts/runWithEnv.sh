#!/bin/bash

# Wrapper script for running the student progress cron job with environment variables
# This ensures the .env file is loaded before running the Node.js script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Change to the backend directory
cd "$BACKEND_DIR"

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "⚠️  No .env file found, using system environment variables"
fi

# Run the student progress cron job
echo "🚀 Starting Student Progress Analysis..."
node scripts/studentProgressCron.js

# Capture exit code
EXIT_CODE=$?

# Log completion
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Cron job completed successfully"
else
    echo "❌ Cron job failed with exit code $EXIT_CODE"
fi

# Exit with the same code as the Node.js script
exit $EXIT_CODE
