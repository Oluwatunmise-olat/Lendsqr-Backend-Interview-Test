import { NextFunction, Response, Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { ApiResponse, decodeJwt, ServiceResponse } from '..';
import KnexDataSource from '../../database/datasource';

export class AuthMiddleware {
  static async authenticate(req: Request, res: Response, next: NextFunction) {
    const [status, label, token] = AuthMiddleware.extractAuthenticationHeader(
      req.headers,
    );
    try {
      if (!status) {
        const data: ServiceResponse = {
          status: 'bad-request',
          message: 'Auth header missing',
        };
        const apiResponse = ApiResponse(data);

        return res.status(apiResponse.statusCode).json({
          status: apiResponse.status,
          message: apiResponse.message,
          data: apiResponse.data,
        });
      }

      if (!((label as unknown as string) === 'Bearer')) {
        const data: ServiceResponse = {
          status: 'bad-request',
          message: 'Invalid auth label',
        };
        const apiResponse = ApiResponse(data);

        return res.status(apiResponse.statusCode).json({
          status: apiResponse.status,
          message: apiResponse.message,
          data: apiResponse.data,
        });
      }
      const uuid = decodeJwt(token as unknown as string);

      const user = await KnexDataSource('users')
        .whereNull('users.deleted_at')
        .where('users.uuid', uuid)
        .first()
        .innerJoin('wallets', 'wallets.user_id', 'users.uuid')
        .select([
          'users.*',
          KnexDataSource.raw(
            `JSON_OBJECT("uuid", wallets.uuid, "balance", wallets.balance) AS wallet`,
          ),
        ]);

      if (!user) {
        const data: ServiceResponse = {
          status: 'bad-request',
          message: 'Unauthenticated',
        };
        const apiResponse = ApiResponse(data);

        return res.status(apiResponse.statusCode).json({
          status: apiResponse.status,
          message: apiResponse.message,
          data: apiResponse.data,
        });
      }

      // @ts-ignore
      req.user = user;

      return next();
    } catch (error) {
      if (
        error instanceof TokenExpiredError ||
        error instanceof JsonWebTokenError
      ) {
        const data: ServiceResponse = {
          status: 'bad-request',
          message: 'Invalid Access Token',
        };
        const apiResponse = ApiResponse(data);

        return res.status(apiResponse.statusCode).json({
          status: apiResponse.status,
          message: apiResponse.message,
          data: apiResponse.data,
        });
      }
      next(error);
    }
  }

  private static extractAuthenticationHeader(headers: any) {
    const tag = 'authorization';
    if (!Object.keys(headers).includes(tag)) return [false, null, null];
    const [label, token] = headers.authorization!.split(' ');
    return [true, label, token];
  }
}
