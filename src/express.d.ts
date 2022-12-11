import { Request } from 'express';

import { IUserDTO } from './users/dto/create-user.dto';

declare module 'express' {
  export interface Request {
    user?: IUserDTO;
  }
}
