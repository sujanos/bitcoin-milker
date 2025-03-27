import { Types } from 'mongoose';

export interface CreateScheduleParams {
  name: string;
  purchaseAmount: string;
  purchaseIntervalHuman: string;
  walletAddress: string;
}

export interface DeleteScheduleParams {
  scheduleId: Types.ObjectId;
}
