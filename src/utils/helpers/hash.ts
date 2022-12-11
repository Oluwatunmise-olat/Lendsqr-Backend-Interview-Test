import * as bcrypt from 'bcrypt';

export class Hash {
  private static BCRYPT_ROUNDS = 10;

  static make(value: string): Promise<string> {
    return bcrypt.hash(value, this.BCRYPT_ROUNDS);
  }

  static verify(hashedValue: string, plainValue: string): Promise<boolean> {
    return bcrypt.compare(plainValue, hashedValue);
  }
}
