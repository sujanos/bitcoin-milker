import cors from 'cors';
import express, { Express } from 'express';

import { authenticateUser } from './auth';
import { handleListPurchasesRoute } from './purchases';
import {
  handleListSchedulesRoute,
  handleEnableScheduleRoute,
  handleDisableScheduleRoute,
  handleCreateScheduleRoute,
  handleDeleteScheduleRoute,
  handleEditScheduleRoute,
} from './schedules';
import { env } from '../../env';
import { serviceLogger } from '../../logger';

const { CORS_ALLOWED_DOMAIN, IS_DEVELOPMENT } = env;

const corsConfig = {
  optionsSuccessStatus: 204,
  origin: IS_DEVELOPMENT ? true : [CORS_ALLOWED_DOMAIN],
};

export const registerRoutes = (app: Express) => {
  app.use(express.json());

  if (IS_DEVELOPMENT) {
    serviceLogger.info(`CORS is disabled for development`);
  } else {
    serviceLogger.info(`Configuring CORS with allowed domain: ${CORS_ALLOWED_DOMAIN}`);
  }
  app.use(cors(corsConfig));

  app.get('/purchases', authenticateUser, handleListPurchasesRoute);
  app.get('/schedules', authenticateUser, handleListSchedulesRoute);
  app.post('/schedule', authenticateUser, handleCreateScheduleRoute);
  app.put('/schedules/:scheduleId', authenticateUser, handleEditScheduleRoute);
  app.put('/schedules/:scheduleId/enable', authenticateUser, handleEnableScheduleRoute);
  app.put('/schedules/:scheduleId/disable', authenticateUser, handleDisableScheduleRoute);
  app.delete('/schedules/:scheduleId', authenticateUser, handleDeleteScheduleRoute);

  serviceLogger.info(`Routes registered`);
};
