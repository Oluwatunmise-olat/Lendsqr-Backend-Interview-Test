export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum TransactionStatus {
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  PENDING = 'pending',
}

export interface ServiceResponse {
  status:
    | 'created'
    | 'successful'
    | 'not-found'
    | 'bad-request'
    | 'internal-server-error';
  message: string;
  data?: any;
}

export enum PaymentProviders {
  PAYSTACK = 'paystack',
  INTERNAL_WALLET_TRANSFER = 'internal',
}

export enum PayStackWebhookEvents {
  TRANSACTION_SUCCESS = 'charge.success',
  TRANSFER_SUCCESS = 'transfer.success',
  TRANSFER_FAILED = 'transfer.failed',
  TRANSFER_REVERSED = 'transfer.reversed',
}

export interface PaystackDebitTransactionMetaData {
  transfer_code: string;
  recipient_code: string;
}
