#!/bin/bash
set -e

echo "🐧 Configuring for Arch Linux..."

# Check for pacman to confirm Arch/Manjaro environment
if ! command -v pacman &> /dev/null; then
    echo "❌ Error: 'pacman' not found. This script is intended for Arch Linux."
    # Fallback for Debian/Ubuntu just in case
    if command -v apt-get &> /dev/null; then
        echo "⚠️  Debian/Ubuntu detected. Installing with apt..."
        sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
        sudo service postgresql start
    else
        echo "❌ Unsupported distribution."
        exit 1
    fi
else
    # Arch Linux flow
    echo "📦 Checking for PostgreSQL..."
    if ! command -v psql &> /dev/null; then
        echo "PostgreSQL not found. Installing..."
        sudo pacman -Sy --noconfirm postgresql
    else
        echo "✅ PostgreSQL is installed."
    fi

    # Initialize DB cluster if needed (Arch specific step)
    if [ ! -d "/var/lib/postgres/data/base" ]; then
        echo "⚙️ Initializing PostgreSQL data directory..."
        # We need to run initdb as postgres user
        # Check if the directory is empty or non-existent
        sudo -u postgres initdb -D /var/lib/postgres/data
    else
        echo "✅ PostgreSQL data directory already initialized."
    fi

    echo "🚀 Starting PostgreSQL service..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

echo "👤 Setting up user 'malek'..."
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'malek') THEN CREATE ROLE malek WITH LOGIN PASSWORD 'password' CREATEDB; END IF; END \$\$;"
sudo -u postgres psql -c "ALTER ROLE malek CREATEDB;"

echo "🗄️ Setting up database 'litter_detection'..."
# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'litter_detection'" | tr -d '[:space:]')
if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database..."
    sudo -u postgres createdb -O malek litter_detection
else
    echo "Database 'litter_detection' already exists."
fi

echo "📝 Applying schema..."
export PGPASSWORD=password
psql -h localhost -U malek -d litter_detection -f schema.sql

echo "✅ Database setup complete!"
echo "-----------------------------------------------"
echo "You can now start the backend with: node server.js"
