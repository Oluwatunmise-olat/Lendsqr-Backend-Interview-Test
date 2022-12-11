import { NextFunction, Request, Response } from 'express';

import { ApiResponse, logger, ServiceResponse } from '../utils';
import WebhookService from './webhooks.service';

export class WebhookController {
  static async handlePaystackWebhook(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await WebhookService.handlePaystackWebhook(
        req.body,
        req.headers,
      );
      const apiResponse = ApiResponse(data);
      return res.status(apiResponse.statusCode).json({
        status: apiResponse.status,
        message: apiResponse.message,
        data: apiResponse.data,
      });
    } catch (error) {
      next(error);
    }
  }
}
