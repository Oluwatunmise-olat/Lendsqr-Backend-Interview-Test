import * as joi from 'joi';

export default class UserValidator {
  static register() {
    return joi
      .object({
        first_name: joi
          .string()
          .required()
          .messages({ 'any.only': 'Field first_name is required' }),
        last_name: joi
          .string()
          .required()
          .messages({ 'any.only': 'Field last_name is required' }),
        email: joi
          .string()
          .email()
          .required()
          .messages({ 'any.only': 'Field email is required' }),
        password: joi
          .string()
          .required()
          .messages({ 'any.only': 'Field password is required' }),
      })
      .options({ allowUnknown: true });
  }

  static logIn() {
    return joi
      .object({
        email: joi
          .string()
          .email()
          .required()
          .messages({ 'any.only': 'Field email is required' }),
        password: joi
          .string()
          .required()
          .messages({ 'any.only': 'Field password is required' }),
      })
      .options({ allowUnknown: true });
  }
}
