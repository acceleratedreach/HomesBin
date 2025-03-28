#!/bin/bash

# This script runs the environment synchronization
# Run with: bash sync-env.sh

echo "Running environment synchronization..."
node scripts/env-sync.js

# Print success message
echo "Environment synchronization complete!"
echo "You can now start your application with: npm run dev"