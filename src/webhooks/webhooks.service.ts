import {
  logger,
  PayStack,
  PayStackWebhookEvents,
  ServiceResponse,
  TransactionStatus,
} from '../utils';

import KnexDataSource from '../database/datasource';
import WalletService from '../wallets/wallets.service';
import { IUserDTO } from '../users/dto/create-user.dto';

export default class WebhookService {
  static async handlePaystackWebhook(
    payload: any,
    headers: any,
  ): Promise<ServiceResponse> {
    const isPaystackWebhook = PayStack.validateWebhook(payload, headers);

    if (!isPaystackWebhook)
      return { status: 'bad-request', message: 'Unauthorized to access' };

    logger.info('Paystack Webhook Payload %o', payload);

    if (payload.event === PayStackWebhookEvents.TRANSACTION_SUCCESS) {
      await this.handleSuccessfulTransactionEvent(
        payload.data.reference,
        payload.data.amount,
      );
    }

    if (payload.event === PayStackWebhookEvents.TRANSFER_SUCCESS) {
      await this.handleSuccessfulTransferEvent(
        payload.data.reference,
        payload.data.session.id,
      );
    }

    if (payload.event === PayStackWebhookEvents.TRANSFER_FAILED) {
      await this.handleFailedTransferEvent(
        payload.data.reference,
        payload.data.session.id,
      );
    }

    return { status: 'successful', message: 'Webhook payload received' };
  }

  private static async handleSuccessfulTransactionEvent(
    transaction_reference: string,
    amount: number,
  ) {
    const transaction = await KnexDataSource('transactions')
      .whereNull('deleted_at')
      .where('transaction_reference', transaction_reference)
      .where((queryBuilder) =>
        queryBuilder
          .where('status', TransactionStatus.PENDING)
          .orWhere('status', TransactionStatus.SUCCESSFUL),
      )
      .first();

    if (!transaction) {
      logger.error('Transaction record not found', {
        transaction_reference,
        amount,
      });
      return;
    }

    if (transaction.status === TransactionStatus.SUCCESSFUL) {
      return;
    }

    if (transaction.status === TransactionStatus.PENDING) {
      const user = (await KnexDataSource('users')
        .whereNull('users.deleted_at')
        .where('users.uuid', transaction.user_id)
        .first()
        .innerJoin('wallets', 'wallets.user_id', 'users.uuid')
        .select([
          'users.*',
          KnexDataSource.raw(
            `JSON_OBJECT('balance', wallets.balance, 'uuid', wallets.uuid) AS wallet`,
          ),
        ])) as IUserDTO;

      await WalletService.creditWallet(user, transaction);
    }
  }

  private static async handleSuccessfulTransferEvent(
    transaction_reference: string,
    session_id: string,
  ) {
    const transaction = await KnexDataSource('transactions')
      .whereNull('deleted_at')
      .where('transaction_reference', transaction_reference)
      .where((queryBuilder) =>
        queryBuilder
          .where('status', TransactionStatus.PENDING)
          .orWhere('status', TransactionStatus.SUCCESSFUL),
      )
      .first();

    if (!transaction) {
      logger.error('Transaction record not found', { transaction_reference });
      return;
    }

    if (transaction.status === TransactionStatus.SUCCESSFUL) {
      return;
    }

    if (transaction.status === TransactionStatus.PENDING) {
      await KnexDataSource.transaction(async (trx) => {
        await trx('transactions')
          .whereNull('deleted_at')
          .where('transaction_reference', transaction_reference)
          .where('status', TransactionStatus.PENDING)
          .update({ status: TransactionStatus.SUCCESSFUL, session_id });

        await trx('wallets')
          .whereNull('deleted_at')
          .where('user_id', transaction.user_id)
          .where('wallet_id', transaction.wallet_id)
          .decrement('balance', transaction.amount);
      });
    }
  }

  private static async handleFailedTransferEvent(
    transaction_reference: string,
    session_id: string,
  ) {
    const transaction = await KnexDataSource('transactions')
      .whereNull('deleted_at')
      .where('transaction_reference', transaction_reference)
      .where((queryBuilder) =>
        queryBuilder
          .where('status', TransactionStatus.PENDING)
          .orWhere('status', TransactionStatus.SUCCESSFUL),
      )
      .first();

    if (!transaction) {
      logger.error('Transaction record not found', { transaction_reference });
      return;
    }

    if (transaction.status === TransactionStatus.SUCCESSFUL) {
      return;
    }

    if (transaction.status === TransactionStatus.PENDING) {
      await KnexDataSource('transactions')
        .whereNull('deleted_at')
        .where('transaction_reference', transaction_reference)
        .where('status', TransactionStatus.PENDING)
        .update({ status: TransactionStatus.FAILED, session_id });
    }
  }
}
