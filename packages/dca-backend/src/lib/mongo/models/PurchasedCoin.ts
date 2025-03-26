import { Schema, model } from 'mongoose';

const PurchasedCoinSchema = new Schema(
  {
    coinAddress: {
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/,
      required: true,
      type: String,
    },
    purchaseAmount: {
      required: true,
      type: String,
      validate: {
        message: 'Purchase amount must be a valid decimal number',
        validator(v: string) {
          return /^\d*\.?\d+$/.test(v);
        },
      },
    },
    purchasePrice: {
      required: true,
      type: String,
      validate: {
        message: 'Price must be a valid decimal number',
        validator(v: string) {
          return /^\d*\.?\d+$/.test(v);
        },
      },
    },
    schedule: {
      index: true,
      ref: 'Schedule',
      required: true,
      type: Schema.Types.ObjectId,
    },
    symbol: {
      required: true,
      type: String,
    },
    txHash: {
      sparse: true,
      type: String,
      unique: true,
    },
    walletAddress: {
      index: true,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/,
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

// Create compound indices for common query patterns
PurchasedCoinSchema.index({ purchasedAt: -1, walletAddress: 1 });
PurchasedCoinSchema.index({ createdAt: 1, schedule: 1 });

export const PurchasedCoin = model('PurchasedCoin', PurchasedCoinSchema);
