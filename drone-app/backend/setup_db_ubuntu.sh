#!/bin/bash
set -e

# Ubuntu Server PostgreSQL setup script for Autonomous Litter Detection System

echo "🐧 Configuring for Ubuntu Server..."

# Check for apt-get
if ! command -v apt-get &> /dev/null; then
    echo "❌ Error: 'apt-get' not found. This script is intended for Ubuntu Server."
    exit 1
fi

# Install PostgreSQL if not present
echo "📦 Checking for PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Installing..."
    sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
else
    echo "✅ PostgreSQL is installed."
fi

# Start and enable PostgreSQL service
echo "🚀 Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Create user 'malek' with password and CREATEDB privilege
echo "👤 Setting up user 'malek'..."
sudo -u postgres psql -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'malek') THEN CREATE ROLE malek WITH LOGIN PASSWORD 'password' CREATEDB; END IF; END $$;"
sudo -u postgres psql -c "ALTER ROLE malek CREATEDB;"

# Create database 'litter_detection' if it doesn't exist
echo "🗄️ Setting up database 'litter_detection'..."
DB_EXISTS=$(sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'litter_detection'" | tr -d '[:space:]')
if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database..."
    sudo -u postgres createdb -O malek litter_detection
else
    echo "Database 'litter_detection' already exists."
fi

# Apply schema
echo "📝 Applying schema..."
export PGPASSWORD=password
psql -h localhost -U malek -d litter_detection -f schema.sql

echo "✅ Database setup complete!"
echo "-----------------------------------------------"
echo "You can now start the backend with: node server.js"
