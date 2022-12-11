import httpStatus from 'http-status-codes';

import { ServiceResponse } from '../types';

export const ApiResponse = (payload: ServiceResponse) => {
  if (payload.status === 'successful') {
    return {
      statusCode: httpStatus.OK,
      message: payload.message,
      data: payload.data,
      status: true,
    };
  }

  if (payload.status === 'bad-request') {
    return {
      statusCode: httpStatus.BAD_REQUEST,
      message: payload.message,
      data: payload.data,
      status: false,
    };
  }

  if (payload.status === 'not-found') {
    return {
      statusCode: httpStatus.NOT_FOUND,
      message: payload.message,
      data: payload.data,
      status: false,
    };
  }

  if (payload.status === 'created') {
    return {
      statusCode: httpStatus.CREATED,
      message: payload.message,
      data: payload.data,
      status: true,
    };
  }

  if (payload.status === 'internal-server-error') {
    return {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: payload.message,
      data: payload.data,
      status: false,
    };
  }
};
