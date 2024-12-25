import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { UserRepository } from '../../data/repositories/user.repository.ts';
import { User } from '../../types/mod.ts';
import { AuthenticationError, ResourceNotFoundError, ValidationError } from '../../types/errors.ts';
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
      throw new ValidationError('Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValidPassword = await this.userRepository.validatePassword(user.id, password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    return generateToken(user.id, user.role);
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.isValidEmail(userData.email)) {
      throw new ValidationError('Invalid email format');
    }

    this.validatePassword(userData.password);

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already in use');
    }

    return this.userRepository.create(userData);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ResourceNotFoundError('User');
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ResourceNotFoundError('User');
    }

    if (updates.email && !this.isValidEmail(updates.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updates.email);
      if (existingUser) {
        throw new ValidationError('Email already in use');
      }
    }

    return this.userRepository.update(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ResourceNotFoundError('User');
    }

    await this.userRepository.delete(id);
  }
}
