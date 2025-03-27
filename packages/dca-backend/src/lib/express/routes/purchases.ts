import { Request, Response } from 'express';

import { PurchasedCoin } from '../../mongo/models/PurchasedCoin';

export const handleListPurchasesRoute = async (req: Request, res: Response) => {
  const { walletAddress } = req.params as { walletAddress?: string };

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
