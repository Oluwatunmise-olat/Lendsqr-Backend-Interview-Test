import * as jwt from 'jsonwebtoken';

import { Env } from '../config';

export const generateJwt = (uuid: string) => {
  const token = jwt.sign(uuid, Env.SECRET_KEY);
  return token;
};

export const decodeJwt = (token: string) => {
  const user_id = jwt.verify(token, Env.SECRET_KEY) as jwt.JwtPayload;

  return user_id;
};
