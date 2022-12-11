export interface IUserDTO {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  uuid: string;
  created_at: string;
  updated_at: string;

  wallet: {
    uuid: string;
    user_id: string;
    balance: number;
    created_at: string;
    updated_at: string;
  };
}
