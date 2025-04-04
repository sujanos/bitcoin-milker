import cors from 'cors';
import express, { Express } from 'express';

import { asAuthenticatedReq, getAuthenticateUserExpressHandler } from './auth/auth';
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

const { ALLOWED_AUDIENCE, CORS_ALLOWED_DOMAIN, IS_DEVELOPMENT } = env;

const authenticateUser = getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);

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

  app.get('/purchases', authenticateUser, asAuthenticatedReq(handleListPurchasesRoute));
  app.get('/schedules', authenticateUser, asAuthenticatedReq(handleListSchedulesRoute));
  app.post('/schedule', authenticateUser, asAuthenticatedReq(handleCreateScheduleRoute));
  app.put('/schedules/:scheduleId', authenticateUser, asAuthenticatedReq(handleEditScheduleRoute));
  app.put(
    '/schedules/:scheduleId/enable',
    authenticateUser,
    asAuthenticatedReq(handleEnableScheduleRoute)
  );
  app.put(
    '/schedules/:scheduleId/disable',
    authenticateUser,
    asAuthenticatedReq(handleDisableScheduleRoute)
  );
  app.delete(
    '/schedules/:scheduleId',
    authenticateUser,
    asAuthenticatedReq(handleDeleteScheduleRoute)
  );

  serviceLogger.info(`Routes registered`);
};
