import axios, { AxiosError, isAxiosError } from 'axios';
import * as crypto from 'crypto';

import { Env } from '../config';
import { logger } from '../helpers/logger';

export class PayStack {
  private static BASE_URL = 'https://api.paystack.co';
  private static HEADERS = {
    Authorization: `Bearer ${Env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  static validateWebhook(payload: any, headers: any) {
    const hash = crypto
      .createHmac('sha512', Env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === headers['x-paystack-signature'];
  }

  static async getTransactionCheckoutPaymentLink({
    currency_code = 'NGN',
    amount_in_kobo,
    email,
    transaction_ref,
  }: {
    amount_in_kobo: string;
    email: string;
    currency_code?: string;
    transaction_ref: string;
  }) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/transaction/initialize`,
        {
          amount: amount_in_kobo,
          email: email,
          reference: transaction_ref,
          currency: currency_code,
        },
        { headers: this.HEADERS },
      );

      return { status: true, data: response.data.data, message: null };
    } catch (error) {
      logger.error(
        'Ann error occurred generating paystack transaction checkout link',
      );
      return {
        status: false,
        data: null,
        message: 'Could not generate transaction checkout link',
      };
    }
  }

  static async verifyTransaction(transaction_ref: string) {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/transaction/verify/${transaction_ref}`,

        { headers: this.HEADERS },
      );

      return { status: true, data: response.data.data, message: null };
    } catch (error) {
      logger.error('An error occurred verifying paystack transaction');
      return {
        status: false,
        data: null,
        message: 'Could not verify transaction',
      };
    }
  }

  static async generateTransferRecipient({
    currency_code = 'NGN',
    name,
    account_number,
    bank_code,
  }: {
    name: string;
    account_number: string;
    bank_code: string;
    currency_code?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/transferrecipient`,
        {
          type: 'nuban',
          name,
          account_number,
          bank_code,
          currency: currency_code,
        },
        { headers: this.HEADERS },
      );

      return {
        status: true,
        data: response.data.data.recipient_code,
        message: null,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {
          status: false,
          data: { is_axios_error: true },
          message: error.response.data.message,
        };
      }

      logger.error('An error occurred generating transfer recipient');
      return {
        status: false,
        data: null,
        message: 'Could not generate transfer recipient',
      };
    }
  }

  static async initializeTransfer(
    amount: number,
    recipient_code: string,
    reference: string,
  ) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/transfer`,
        { source: 'balance', amount, recipient: recipient_code, reference },
        { headers: this.HEADERS },
      );
      return { status: true, message: null, data: response.data.transfer_code };
    } catch (error) {
      logger.error(
        'An error occurred initializing paystack transfer',
        {
          amount,
          recipient_code,
        },
        error,
      );
      return {
        status: false,
        message: 'Could not initialize transfer',
        data: null,
      };
    }
  }

  static async finalizeTransfer(transfer_code: string) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/transfer/finalize_transfer`,
        { transfer_code },
        { headers: this.HEADERS },
      );
      return { status: true, message: null, data: response.status };
    } catch (error) {
      logger.error(
        'An error occurred finalizing paystack transfer',
        {
          transfer_code,
        },
        error,
      );
      return {
        status: false,
        message: 'Could not finalize transfer',
        data: null,
      };
    }
  }
}
