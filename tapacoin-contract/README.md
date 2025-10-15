# Tapacoin (TAPA) Smart Contract

A Stacks-based fungible token smart contract implementing the SIP-010 standard for Tapacoin (TAPA).

## Overview

Tapacoin is a fungible token built on the Stacks blockchain that follows the SIP-010 trait standard. The contract provides comprehensive token functionality including minting, burning, transfers, and administrative controls.

## Features

- **SIP-010 Compliance**: Fully implements the SIP-010 fungible token standard
- **Minting Control**: Only authorized contracts and the owner can mint tokens
- **Burn Functionality**: Users can burn their own tokens or authorized contracts can burn
- **Batch Transfers**: Support for multiple transfers in a single transaction
- **Access Control**: Owner-only functions for administrative tasks
- **Contract Approval System**: Ability to approve other contracts for minting/burning

## Token Details

- **Name**: Tapacoin
- **Symbol**: TAPA
- **Decimals**: 6
- **Standard**: SIP-010

## Prerequisites

- [Clarinet CLI](https://docs.hiro.so/clarinet/) installed
- Node.js and npm (for testing)
- Stacks CLI (optional, for deployment)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tapacoin-contract
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development

1. **Check contract syntax:**
```bash
clarinet check
```

2. **Run tests:**
```bash
npm test
```

3. **Start local development environment:**
```bash
clarinet integrate
```

### Contract Functions

#### Read-Only Functions

- `(get-name)` - Returns the token name
- `(get-symbol)` - Returns the token symbol  
- `(get-decimals)` - Returns number of decimal places
- `(get-balance (who principal))` - Returns balance for a principal
- `(get-total-supply)` - Returns total token supply
- `(get-token-uri)` - Returns token metadata URI
- `(is-contract-approved (contract principal))` - Check if contract is approved
- `(get-contract-owner)` - Returns contract owner address

#### Public Functions

##### Core Token Functions

- `(transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))` 
  - Transfer tokens between addresses
  - Follows SIP-010 standard

- `(mint (amount uint) (to principal))`
  - Mint new tokens (owner/approved contracts only)
  - Increases total supply

- `(burn (amount uint) (from principal))`
  - Burn tokens (owner or token holder)
  - Decreases total supply

##### Administrative Functions

- `(initialize (initial-supply uint) (recipient principal))`
  - One-time initialization with initial supply
  - Owner only

- `(set-token-uri (value (optional (string-utf8 256))))`
  - Set token metadata URI
  - Owner only

- `(set-contract-approved (contract principal) (approved bool))`
  - Approve/disapprove contracts for minting/burning
  - Owner only

##### Utility Functions

- `(transfer-many (transfers (list 100 {...})))`
  - Batch transfer multiple amounts to different recipients
  - More gas-efficient for multiple transfers

### Error Codes

- `u100` - Owner only operation
- `u101` - Not token owner  
- `u102` - Insufficient balance
- `u103` - Invalid amount (zero or negative)
- `u104` - Token already exists (initialization)
- `u105` - Token not found

## Testing

The project includes comprehensive TypeScript tests using Clarinet's testing framework:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tapacoin.test.ts
```

## Deployment

### Testnet Deployment

1. Configure your testnet settings in `settings/Testnet.toml`
2. Deploy using Clarinet:
```bash
clarinet deployments apply --network testnet
```

### Mainnet Deployment

1. Configure your mainnet settings in `settings/Mainnet.toml`
2. Deploy using Clarinet:
```bash
clarinet deployments apply --network mainnet
```

## Security Considerations

- Only the contract owner can mint tokens initially
- Approved contracts system allows for controlled minting by other contracts
- Users can only burn their own tokens unless authorized
- All state changes go through proper validation
- Follows established Stacks/Clarity security patterns

## API Examples

### JavaScript/TypeScript Integration

```typescript
import { Clarinet, Tx, Chain, Account, types } from '@hirosystems/clarinet-sdk';

// Transfer tokens
const transfer = Tx.contractCall(
  'tapacoin',
  'transfer',
  [
    types.uint(1000000), // 1 TAPA (6 decimals)
    types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.tapacoin'),
    types.principal('ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB'),
    types.none()
  ],
  'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
);
```

### Curl Examples

Get token balance:
```bash
curl -X POST https://stacks-node-api.mainnet.stacks.co/v2/contracts/call-read/ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE/tapacoin/get-balance \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE",
    "arguments": ["0x0516df4b2f057d1e1a4e2b59e7c1e6b0f8b4c7d3a2"]
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Create an issue in the GitHub repository
- Join the Stacks Discord community
- Review Stacks documentation at [docs.stacks.co](https://docs.stacks.co)

## Changelog

### v1.0.0
- Initial implementation
- SIP-010 compliance
- Basic minting, burning, and transfer functionality
- Batch transfer support
- Access control system
- Comprehensive test suite