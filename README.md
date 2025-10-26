# BitcoinMilker

A Vincent App that maximizes yield on idle cbBTC by using it as collateral for AAVE lending and weETH strategies on Base network.

## Overview

BitcoinMilker allows users to:

- Deposit cbBTC (Coinbase Bitcoin)
- Automatically deploy capital in AAVE lending protocol on Base network
- Borrow assets at low rates and swap to weETH for enhanced yield
- Generate safe, sustainable yield on Bitcoin holdings

## Prerequisites

- Node ^22.16.0
- pnpm ^10.7.0
- Docker or a local MongoDB instance
- A Vincent App with AAVE lending and token swap abilities

## Project Structure

This monorepo contains:

- **Frontend**: React app for depositing cbBTC and monitoring yield positions
- **Backend**: Node.js API server and job scheduler for automated yield optimization
- **Database**: MongoDB to persist positions and yield strategies

## Quick Start

```bash
# Install dependencies and build
pnpm install && pnpm build

# Start local development
pnpm dev
```

## Example Yield Strategy

The yield strategy works as follows:

1. User deposits cbBTC (Coinbase Bitcoin)
2. System supplies cbBTC to AAVE as collateral on Base network
3. Borrows ETH at competitive rates (~2.5%)
4. Swaps ETH to weETH for enhanced yield (~7%)
5. Supplies weETH as additional collateral
6. Net yield: ~5-8% APY with risk management

## Risk Management

- **Health Factor Monitoring**: Maintains >2.0 health factor
- **Liquidation Protection**: Automated position management
- **Emergency Exits**: Fast unwinding capabilities
