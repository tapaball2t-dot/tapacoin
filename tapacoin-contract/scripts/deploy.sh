#!/bin/bash

# Tapacoin Deployment Script
# Usage: ./deploy.sh [network] [initial-supply] [recipient]
# Example: ./deploy.sh testnet 1000000000000 ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE

set -e

# Default values
NETWORK=${1:-devnet}
INITIAL_SUPPLY=${2:-1000000000000}  # 1M TAPA with 6 decimals
RECIPIENT=${3:-"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"}

echo "🚀 Deploying Tapacoin to $NETWORK network..."
echo "📊 Initial supply: $INITIAL_SUPPLY micro-TAPA"
echo "👤 Initial recipient: $RECIPIENT"
echo ""

# Check if Clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo "❌ Error: Clarinet CLI is not installed"
    echo "Please install Clarinet: https://docs.hiro.so/clarinet/getting-started"
    exit 1
fi

# Validate network
if [[ ! "$NETWORK" =~ ^(devnet|testnet|mainnet)$ ]]; then
    echo "❌ Error: Invalid network. Use: devnet, testnet, or mainnet"
    exit 1
fi

# Check contract syntax
echo "🔍 Checking contract syntax..."
if ! clarinet check; then
    echo "❌ Contract syntax check failed"
    exit 1
fi
echo "✅ Contract syntax is valid"

# Run tests before deployment
echo "🧪 Running tests..."
if ! npm test; then
    echo "❌ Tests failed. Please fix before deploying."
    exit 1
fi
echo "✅ All tests passed"

# Deploy based on network
case $NETWORK in
    devnet)
        echo "🏗️  Deploying to devnet..."
        clarinet integrate --no-dashboard &
        CLARINET_PID=$!
        sleep 10  # Wait for devnet to start
        
        # Deploy contract
        echo "📄 Deploying contract..."
        clarinet deployments apply --devnet
        
        # Initialize contract (you may need to adjust this based on your setup)
        echo "🎯 Initializing contract..."
        # Note: In practice, you'd use clarinet console or a script to call initialize
        
        kill $CLARINET_PID 2>/dev/null || true
        ;;
        
    testnet)
        echo "🌐 Deploying to testnet..."
        if [[ ! -f "settings/Testnet.toml" ]]; then
            echo "❌ Error: Testnet.toml configuration not found"
            exit 1
        fi
        
        # Check if mnemonic is configured
        if grep -q "<YOUR PRIVATE TESTNET MNEMONIC HERE>" settings/Testnet.toml; then
            echo "❌ Error: Please configure your testnet mnemonic in settings/Testnet.toml"
            exit 1
        fi
        
        clarinet deployments apply --network testnet
        echo "✅ Deployed to testnet. Don't forget to initialize with initial supply!"
        ;;
        
    mainnet)
        echo "🌍 Deploying to mainnet..."
        if [[ ! -f "settings/Mainnet.toml" ]]; then
            echo "❌ Error: Mainnet.toml configuration not found"
            exit 1
        fi
        
        # Check if mnemonic is configured
        if grep -q "<YOUR PRIVATE MAINNET MNEMONIC HERE>" settings/Mainnet.toml; then
            echo "❌ Error: Please configure your mainnet mnemonic in settings/Mainnet.toml"
            exit 1
        fi
        
        # Extra confirmation for mainnet
        echo "⚠️  WARNING: You are about to deploy to MAINNET!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ $confirm != "yes" ]]; then
            echo "Deployment cancelled."
            exit 0
        fi
        
        clarinet deployments apply --network mainnet
        echo "✅ Deployed to mainnet. Don't forget to initialize with initial supply!"
        ;;
esac

echo ""
echo "🎉 Deployment completed successfully!"
echo "📋 Next steps:"
echo "   1. Initialize the contract with: clarinet console"
echo "   2. Call (contract-call? .tapacoin initialize u$INITIAL_SUPPLY '$RECIPIENT')"
echo "   3. Set token URI if needed"
echo "   4. Verify deployment on Stacks Explorer"
echo ""
echo "📚 For more information, see the README.md file"
