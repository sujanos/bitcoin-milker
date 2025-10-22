# BitcoinMilker

A Vincent App that maximizes yield on idle wBTC by using it as collateral for AAVE lending and yield-bearing token strategies.

## Overview

BitcoinMilker allows users to:

- Deposit wBTC
- Automatically deploy capital in AAVE lending protocol
- Borrow assets at low rates and purchase high-yield tokens
- Generate safe, sustainable yield on Bitcoin holdings

## Prerequisites

- Node ^22.16.0
- pnpm ^10.7.0
- Docker or a local MongoDB instance
- A Vincent App with AAVE lending and token swap abilities

## Project Structure

This monorepo contains:

- **Frontend**: React app for depositing wBTC and monitoring yield positions
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

1. User deposits wBTC
2. System supplies wBTC to AAVE as collateral
3. Borrows ETH at competitive rates (~2.5%)
4. Purchases PT-ETH tokens yielding ~7%
5. Net yield: ~4.5% APY with risk management

## Risk Management

- **Health Factor Monitoring**: Maintains >2.0 health factor
- **Liquidation Protection**: Automated position management
- **Emergency Exits**: Fast unwinding capabilities
