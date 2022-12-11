import KnexDataSource from '../database/datasource';
import {
  ServiceResponse,
  Hash,
  logger,
  getCurrentTime,
  generateUUID,
  generateJwt,
} from '../utils';
import { IUserDTO } from './dto/create-user.dto';
export default class UserService {
  static async register(payload: IUserDTO): Promise<ServiceResponse> {
    const userExistsWithEmail = await KnexDataSource('users')
      .whereNull('deleted_at')
      .where('email', payload.email)
      .first();

    if (userExistsWithEmail)
      return { status: 'bad-request', message: 'Email already taken' };

    const password = await Hash.make(payload.password);

    try {
      await KnexDataSource.transaction(async (trx) => {
        const user_id = generateUUID();
        const user = (await trx('users').insert({
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          password,
          created_at: getCurrentTime(),
          updated_at: getCurrentTime(),
          uuid: user_id,
        })) as any as IUserDTO;

        // Note: balances are stored in the lowest denominations i.e in this case kobo
        await trx('wallets').insert({
          user_id: user_id,
          balance: 0,
          created_at: getCurrentTime(),
          updated_at: getCurrentTime(),
          uuid: generateUUID(),
        });
      });
      return { status: 'created', message: 'User created successfully' };
    } catch (error) {
      logger.error('Could not create user', error, { payload });
      return {
        status: 'internal-server-error',
        message: 'Internal server error',
      };
    }
  }

  static async logIn(
    payload: Pick<IUserDTO, 'email' | 'password'>,
  ): Promise<ServiceResponse> {
    const errorMessage = 'Invalid login credentials';

    const userExists = await KnexDataSource('users')
      .whereNull('deleted_at')
      .where('email', payload.email)
      .first();

    if (!userExists) return { status: 'bad-request', message: errorMessage };

    const passwordMatch = await Hash.verify(
      userExists.password,
      payload.password,
    );

    if (!passwordMatch) return { status: 'bad-request', message: errorMessage };

    const token = await generateJwt(userExists.uuid);

    return {
      status: 'successful',
      message: 'Login success',
      data: { auth_token: token },
    };
  }
}
