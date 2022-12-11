import { Knex } from 'knex';

import { IUserDTO } from '../users/dto/create-user.dto';
import {
  generateReferenceCode,
  generateUUID,
  getCurrentTime,
  logger,
  PaymentProviders,
  PayStack,
  PaystackDebitTransactionMetaData,
  ServiceResponse,
  TransactionStatus,
  TransactionType,
} from '../utils';
import KnexDataSource from '../database/datasource';
import { TransferDTO } from './dto/transfer.dto';

export default class WalletService {
  static async initializeWalletFundingTransaction(
    user: IUserDTO,
    payload: { amount: number },
  ): Promise<ServiceResponse> {
    // monetary values are stored in the lowest denomination of the currency
    const KOBO = 100;
    const AMOUNT_IN_KOBO = payload.amount * KOBO;
    const transaction_id = generateUUID();
    const transaction_ref = generateReferenceCode();

    await KnexDataSource('transactions').insert({
      user_id: user.uuid,
      wallet_id: user.wallet.uuid,
      provider: PaymentProviders.PAYSTACK,
      amount: AMOUNT_IN_KOBO,
      previous_balance: Number(user.wallet.balance),
      current_balance: Number(user.wallet.balance) + Number(AMOUNT_IN_KOBO),
      type: TransactionType.CREDIT,
      status: TransactionStatus.PENDING,
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
      uuid: transaction_id,
      transaction_reference: transaction_ref,
    });

    const { status, message, data } =
      await PayStack.getTransactionCheckoutPaymentLink({
        amount_in_kobo: AMOUNT_IN_KOBO.toString(),
        email: user.email,
        transaction_ref: transaction_ref,
      });

    if (!status) return { status: 'bad-request', message: message };

    return {
      status: 'successful',
      message: 'Transaction checkout link generated successfully',
      data: {
        authorization_url: data.authorization_url,
        reference: transaction_ref,
      },
    };
  }

  // TODO: account for under payment and over payment
  static async verifyWalletFundingTransaction(
    user: IUserDTO,
    reference: string,
  ): Promise<ServiceResponse> {
    const transaction = await KnexDataSource('transactions')
      .whereNull('deleted_at')
      .where('transaction_reference', reference)
      .where('user_id', user.uuid)
      .first();

    if (!transaction)
      return { status: 'not-found', message: 'Transaction record not found ' };

    if (transaction.status === TransactionStatus.SUCCESSFUL) {
      return {
        status: 'successful',
        message: 'Successful',
        data: { transaction_status: 'success' },
      };
    }

    if (transaction.status === TransactionStatus.PENDING) {
      const { status, message, data } = await PayStack.verifyTransaction(
        reference,
      );

      if (!status) return { status: 'bad-request', message: message };

      if (data.status === 'success') {
        await this.creditWallet(user, transaction);
      }

      if (data.status === 'failed') {
        await KnexDataSource('transactions')
          .whereNull('deleted_at')
          .where('transaction_ref', reference)
          .where('status', TransactionStatus.PENDING)
          .where('user_id', user.uuid)
          .update({ status: TransactionStatus.FAILED });
      }

      return {
        status: 'successful',
        message: data.gateway_response,
        data: { transaction_status: data.status },
      };
    }
  }

  // TODO: endpoint to fetch supported banks and cached in redis
  static async debitWalletTransaction(
    user: IUserDTO,
    payload: { amount: number; account_number: string; bank_code: string },
  ): Promise<ServiceResponse> {
    const KOBO = 100;
    const AMOUNT_IN_KOBO = payload.amount * KOBO;

    const hasSufficientFunds = Number(user.wallet.balance) > AMOUNT_IN_KOBO;
    if (!hasSufficientFunds)
      return { status: 'bad-request', message: 'Insufficient wallet balance' };

    const { status, message, data } = await PayStack.generateTransferRecipient({
      account_number: payload.account_number,
      bank_code: payload.bank_code,
      name: `${user.first_name} ${user.last_name}`,
    });

    if (!status)
      return {
        status: 'bad-request',
        message:
          data && data.is_axios_error
            ? `${message}. Please provide valid bank_code and associated account number`
            : 'Could not withdraw at the moment',
      };

    const transaction_ref = generateReferenceCode();
    const { status: initializeTransferStatus, data: initializeTransferData } =
      await PayStack.initializeTransfer(AMOUNT_IN_KOBO, data, transaction_ref);

    if (!initializeTransferStatus) {
      return {
        status: 'bad-request',
        message: 'Could not withdraw at the moment',
      };
    }

    const metadata: PaystackDebitTransactionMetaData = {
      transfer_code: initializeTransferData,
      recipient_code: data,
    };

    const transaction_id = generateUUID();

    const finalizeTransferPayload = await PayStack.finalizeTransfer(
      initializeTransferData,
    );

    if (!finalizeTransferPayload.status) {
      return {
        status: 'bad-request',
        message: 'Could not withdraw at the moment',
      };
    }
    await KnexDataSource('transactions').insert({
      user_id: user.uuid,
      wallet_id: user.wallet.uuid,
      provider: PaymentProviders.PAYSTACK,
      amount: AMOUNT_IN_KOBO,
      previous_balance: Number(user.wallet.balance),
      current_balance: Number(user.wallet.balance) - Number(AMOUNT_IN_KOBO),
      type: TransactionType.DEBIT,
      status: TransactionStatus.PENDING,
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
      uuid: transaction_id,
      transaction_reference: transaction_ref,
      meta: JSON.stringify(metadata),
    });

    return {
      status: 'successful',
      message: 'Transfer is being processed.',
    };
  }

  static async transferFunds(
    user: IUserDTO,
    payload: TransferDTO,
  ): Promise<ServiceResponse> {
    const KOBO = 100;
    const AMOUNT_IN_KOBO = payload.amount * KOBO;

    const recipientExists = (await KnexDataSource('users')
      .whereNull('users.deleted_at')
      .where('users.email', payload.recipient_email)
      .first()
      .innerJoin('wallets', 'wallets.user_id', 'users.uuid')
      .select([
        'users.*',
        KnexDataSource.raw(
          `JSON_OBJECT("uuid", wallets.uuid, "balance", wallets.balance) AS wallet`,
        ),
      ])) as IUserDTO;

    if (!recipientExists)
      return { status: 'not-found', message: 'Recipient account not found' };

    if (recipientExists.email === user.email)
      return {
        status: 'bad-request',
        message: 'Cannot perform transfer to self',
      };

    // wallet balance has to be greater than amount to be transferred because of payment gateway transaction fee in cases where cards are used instead of wallet
    const hasSufficientFunds = Number(user.wallet.balance) > AMOUNT_IN_KOBO;

    if (!hasSufficientFunds)
      return { status: 'bad-request', message: 'Insufficient wallet balance' };

    try {
      await KnexDataSource.transaction(async (trx) => {
        await Promise.all([
          this.performTransfer({
            transaction_type: TransactionType.DEBIT,
            user,
            amount_in_kobo: AMOUNT_IN_KOBO,
            knex_transaction: trx,
          }),
          this.performTransfer({
            transaction_type: TransactionType.CREDIT,
            user: recipientExists,
            amount_in_kobo: AMOUNT_IN_KOBO,
            knex_transaction: trx,
          }),
        ]);
      });
      return { status: 'successful', message: 'Transfer successful' };
    } catch (error) {
      logger.error(
        'Could not perform wallet transfer %o',
        {
          ...payload,
          sender_email: user.email,
        },
        error,
      );
      return {
        status: 'internal-server-error',
        message: 'Internal server error',
      };
    }
  }

  static async getWalletBalance(email: string): Promise<ServiceResponse> {
    const KOBO = 100;
    const user = (await KnexDataSource('users')
      .whereNull('users.deleted_at')
      .where('users.email', email)
      .first()
      .innerJoin('wallets', 'wallets.user_id', 'users.uuid')
      .select([
        'users.*',
        KnexDataSource.raw(
          `JSON_OBJECT("uuid", wallets.uuid, "balance", wallets.balance) AS wallet`,
        ),
      ])) as IUserDTO;

    if (!user)
      return { status: 'not-found', message: 'Users record not found' };

    return {
      status: 'successful',
      message: 'Wallet balance fetched successfully',
      data: { balance_in_naira: user.wallet.balance / KOBO, currency: 'NGN' },
    };
  }

  private static async performTransfer({
    transaction_type,
    user,
    amount_in_kobo,
    knex_transaction,
  }: {
    transaction_type: TransactionType;
    user: IUserDTO;
    amount_in_kobo: number;
    knex_transaction: Knex.Transaction;
  }) {
    const transaction_id = generateUUID();

    await knex_transaction('transactions').insert({
      user_id: user.uuid,
      wallet_id: user.wallet.uuid,
      provider: PaymentProviders.INTERNAL_WALLET_TRANSFER,
      amount: amount_in_kobo,
      previous_balance: Number(user.wallet.balance),
      current_balance:
        transaction_type === TransactionType.CREDIT
          ? Number(user.wallet.balance) + Number(amount_in_kobo)
          : Number(user.wallet.balance) - Number(amount_in_kobo),
      type: transaction_type,
      status: TransactionStatus.SUCCESSFUL,
      created_at: getCurrentTime(),
      updated_at: getCurrentTime(),
      uuid: transaction_id,
    });

    if (transaction_type === TransactionType.DEBIT) {
      await knex_transaction('wallets')
        .whereNull('deleted_at')
        .where('user_id', user.uuid)
        .decrement('balance', amount_in_kobo);
    }

    if (transaction_type === TransactionType.CREDIT) {
      await knex_transaction('wallets')
        .whereNull('deleted_at')
        .where('user_id', user.uuid)
        .increment('balance', amount_in_kobo);
    }
  }

  static async creditWallet(user: IUserDTO, transaction_object: any) {
    const userWallet = user.wallet;
    await KnexDataSource.transaction(async (trx) => {
      await trx('transactions')
        .whereNull('deleted_at')
        .where(
          'transaction_reference',
          transaction_object.transaction_reference,
        )
        .where('status', TransactionStatus.PENDING)
        .where('user_id', user.uuid)
        .update({
          status: TransactionStatus.SUCCESSFUL,
          previous_balance: Number(userWallet.balance),
          current_balance:
            Number(userWallet.balance) + Number(transaction_object.amount),
        });

      await trx('wallets')
        .whereNull('deleted_at')
        .where('user_id', user.uuid)
        .increment('balance', Number(transaction_object.amount));
    });
  }
}
