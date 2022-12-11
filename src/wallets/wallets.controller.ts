import { NextFunction, Request, Response } from 'express';

import { ApiResponse, ServiceResponse } from '../utils';
import WalletService from './wallets.service';

export class WalletController {
  static async fundWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await WalletService.initializeWalletFundingTransaction(
        req['user'],
        req.body,
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

  static async debitWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await WalletService.debitWalletTransaction(
        req['user'],
        req.body,
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

  static async verifyWalletFunding(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await WalletService.verifyWalletFundingTransaction(
        req['user'],
        req.params['reference'],
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

  static async getWalletBalance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.query.email) {
        const data: ServiceResponse = {
          status: 'bad-request',
          message: 'Query field email is required',
        };
        const apiResponse = ApiResponse(data);

        return res.status(apiResponse.statusCode).json({
          status: apiResponse.status,
          message: apiResponse.message,
          data: apiResponse.data,
        });
      }

      const data = await WalletService.getWalletBalance(
        req.query.email as string,
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

  static async transferFunds(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await WalletService.transferFunds(req['user'], req.body);
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
