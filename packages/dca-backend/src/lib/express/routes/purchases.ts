import { Response } from 'express';

import { AuthenticatedRequest } from './auth/types';
import { PurchasedCoin } from '../../mongo/models/PurchasedCoin';

export const handleListPurchasesRoute = async (req: AuthenticatedRequest, res: Response) => {
  const walletAddress = req.user.pkpAddress;

  const purchases = await PurchasedCoin.find({ walletAddress })
    .sort({
      purchasedAt: -1,
    })
    .lean();

  if (purchases.length === 0) {
    res.status(404).json({ error: `No purchases found  for wallet address ${walletAddress}` });
    return;
  }

  res.json({ data: purchases, success: true });
};
