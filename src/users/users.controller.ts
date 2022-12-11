import { NextFunction, Request, Response } from 'express';

import { ApiResponse } from '../utils';
import UserService from './users.service';

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    const { body } = req;
    try {
      const data = await UserService.register(body);
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

  static async logIn(req: Request, res: Response, next: NextFunction) {
    const { body } = req;
    try {
      const data = await UserService.logIn(body);
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
