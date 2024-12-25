import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { UserRepository } from '../../data/repositories/user.repository.ts';
import { User } from '../../types/mod.ts';
import { AppError } from '../../types/middleware.ts';
import { generateToken } from '../../presentation/middleware/auth.middleware.ts';

export interface IUserService {
  validateCredentials(email: string, password: string): Promise<string>;
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(private userRepository: UserRepository) {}

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async validateCredentials(email: string, password: string): Promise<string> {
    if (!email || !password) {
      throw new AppError(Status.BadRequest, 'Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new AppError(Status.BadRequest, 'Invalid email format');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(Status.Unauthorized, 'Invalid credentials');
    }

    const isValidPassword = await this.userRepository.validatePassword(user.id, password);
    if (!isValidPassword) {
      throw new AppError(Status.Unauthorized, 'Invalid credentials');
    }

    return generateToken(user.id, user.role);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.isValidEmail(userData.email)) {
      throw new AppError(Status.BadRequest, 'Invalid email format');
    }

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError(Status.Conflict, 'Email already in use');
    }

    return this.userRepository.create(userData);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError(Status.NotFound, 'User not found');
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError(Status.NotFound, 'User not found');
    }

    if (updates.email && !this.isValidEmail(updates.email)) {
      throw new AppError(Status.BadRequest, 'Invalid email format');
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updates.email);
      if (existingUser) {
        throw new AppError(Status.Conflict, 'Email already in use');
      }
    }

    return this.userRepository.update(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError(Status.NotFound, 'User not found');
    }

    await this.userRepository.delete(id);
  }
}
