import * as joi from 'joi';

export default class WalletValidator {
  static fundWallet() {
    return joi
      .object({
        amount: joi
          .number()
          .required()
          .messages({ 'any.only': 'Field amount is required' }),
      })
      .options({ allowUnknown: true });
  }

  static debitWallet() {
    return joi
      .object({
        amount: joi
          .number()
          .required()
          .messages({ 'any.only': 'Field amount is required' }),
        bank_code: joi
          .string()
          .required()
          .messages({ 'any.only': 'Field bank_code is required' }),
        account_number: joi
          .string()
          .required()
          .messages({ 'any.only': 'Field account_number is required' }),
      })
      .options({ allowUnknown: true });
  }

  static transfer() {
    return joi
      .object({
        recipient_email: joi
          .string()
          .email()
          .required()
          .messages({ 'any.only': 'Field recipient_email is required' }),
        amount: joi
          .number()
          .required()
          .messages({ 'any.only': 'Field amount is required' }),
      })
      .options({ allowUnknown: true });
  }
}
