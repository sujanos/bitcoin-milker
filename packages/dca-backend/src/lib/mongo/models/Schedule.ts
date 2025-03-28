import { Schema, model } from 'mongoose';

// This may seem like a very verbose file with excess local variables, but getting type inference to work with mongoose is extremely finicky.
const scheduleSchemaDefinition = {
  name: {
    required: true,
    type: String,
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
} as const;

export const ScheduleSchema = new Schema(scheduleSchemaDefinition, { timestamps: true });

export const Schedule = model('Schedule', ScheduleSchema);
