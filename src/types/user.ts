export type UserRole = 'admin' | 'user';

export interface UserSettings {
  preferredLanguage: string;
  spokenLanguages: string[];
}

export interface BaseUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  settings?: UserSettings;
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
  email: string;
  role: UserRole;
  settings?: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type ValidateCredentialsResult = 'valid' | 'invalid' | 'not_found';
