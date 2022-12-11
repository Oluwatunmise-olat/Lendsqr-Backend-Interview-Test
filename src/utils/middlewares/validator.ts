import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';

import { ServiceResponse } from '../types';
import { ApiResponse } from '../helpers/api-response';

export const RequestPayloadValidator = (validatorSchema: Joi.AnySchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = validatorSchema.validate(req.body, { abortEarly: false });

    if (!error) return next();

    const errors = error.details.map((error) => {
      return { message: error.message };
    });

    const data: ServiceResponse = {
      status: 'bad-request',
      message: 'Invalid api payloads',
      data: errors,
    };
    const apiResponse = ApiResponse(data);

    return res.status(apiResponse.statusCode).json({
      status: apiResponse.status,
      message: apiResponse.message,
      data: apiResponse.data,
    });
  };
};
