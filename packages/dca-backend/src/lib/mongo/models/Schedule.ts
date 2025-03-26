import { Schema, model } from 'mongoose';

export const ScheduleSchema = new Schema(
  {
    active: {
      default: true,
      index: true,
      required: true,
      type: Boolean, // Index for faster queries on active status
    },
    enabledAt: {
      default: Date.now,
      required: true,
      type: Date,
    },
    purchaseAmount: {
      required: true,
      type: String,
      validate: {
        message: 'Purchase amount must be a valid decimal number',
        validator(v: string) {
          // Validate that it's a proper decimal string
          return /^\d*\.?\d+$/.test(v);
        },
      },
    },
    purchaseIntervalHuman: {
      required: true,
      type: String,
    },
    userEditedAt: {
      default: Date.now,
      index: true,
      required: true,
      type: Date,
    },
    walletAddress: {
      index: true, // Index for faster lookups by wallet address
      lowercase: true, // Ethereum addresses should be lowercase
      match: /^0x[a-fA-F0-9]{40}$/, // Validate Ethereum address format
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

// Create compound indices for common query patterns
ScheduleSchema.index({ active: 1, walletAddress: 1 });
ScheduleSchema.index({ enabledAt: 1, walletAddress: 1 });

export const Schedule = model('Schedule', ScheduleSchema);
