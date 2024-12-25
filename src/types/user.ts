export type UserRole = 'admin' | 'user';

export interface BaseUser {
  username: string;
  password: string;
  role: UserRole;
}

export interface DbUser extends BaseUser {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserInput = BaseUser;

export type UpdateUserInput = Partial<BaseUser>;

export interface UserResponse {
  id: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type ValidateCredentialsResult = 'valid' | 'invalid' | 'not_found';
