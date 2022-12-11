import * as express from 'express';
import * as cors from 'cors';
import helmet from 'helmet';

import apiRoutes from './routes';
import { ApiResponse, logger, ServiceResponse } from './utils';

const app = express();

app.use([express.json()]);
app.use(cors());
app.use(helmet());
app.use(apiRoutes);

app.use(
  '*',
  (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    return 'ok';
  },
);

app.use(
  (
    error: any,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error('Unhandled server error', error);
    const data: ServiceResponse = {
      status: 'internal-server-error',
      message: 'Internal server error',
    };
    const apiResponse = ApiResponse(data);

    return response.status(apiResponse.statusCode).json({
      status: apiResponse.status,
      message: apiResponse.message,
      data: apiResponse.data,
    });
  },
);

export default app;
