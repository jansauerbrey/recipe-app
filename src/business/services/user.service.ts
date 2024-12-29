import { Status } from '@std/http/http_status.ts';
import { UserRepository } from '../../data/repositories/user.repository.ts';
import { User } from '../../types/mod.ts';
import { AuthenticationError, ResourceNotFoundError, ValidationError } from '../../types/errors.ts';
import { generateToken } from '../../presentation/middleware/auth.middleware.ts';
import { logger } from '../../utils/logger.ts';

export interface IUserService {
  validateCredentials(email: string, password: string): Promise<string>;
  refreshToken(userId: string, role: string): Promise<string>;
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(private userRepository: UserRepository) {}

  async refreshToken(userId: string, role: string): Promise<string> {
    logger.debug('Refreshing token for user', { userId });
    
    // Verify user still exists and has same role
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.debug('User not found during token refresh', { userId });
      throw new AuthenticationError('Invalid token');
    }
    
    if (user.role !== role) {
      logger.debug('User role mismatch during token refresh', { userId, expectedRole: role, actualRole: user.role });
      throw new AuthenticationError('Invalid token');
    }

    logger.debug('Generating new token', { userId });
    return generateToken(userId, role);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUsername(username: string): boolean {
    return Boolean(username) && username.length >= 3;
  }

  async validateCredentials(email: string, password: string): Promise<string> {
    logger.debug('Validating user credentials', { email });

    if (!email || !password) {
      logger.debug('Missing email or password');
      throw new ValidationError('Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      logger.debug('Invalid email format', { email });
      throw new ValidationError('Invalid email format');
    }

    logger.debug('Looking up user by email');
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.debug('User not found with email', { email });
      throw new AuthenticationError('Invalid credentials');
    }

    logger.debug('Validating password for user', { userId: user.id });
    const isValidPassword = await this.userRepository.validatePassword(user.id, password);
    if (!isValidPassword) {
      logger.debug('Invalid password for user', { userId: user.id });
      throw new AuthenticationError('Invalid credentials');
    }

    logger.debug('Credentials validated successfully, generating token', { userId: user.id });
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

    if (!this.isValidUsername(userData.username)) {
      throw new ValidationError('Username must be at least 3 characters');
    }

    this.validatePassword(userData.password);

    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(userData.email),
      this.userRepository.findByUsername(userData.username)
    ]);

    if (existingEmail) {
      throw new ValidationError('Email already in use');
    }

    if (existingUsername) {
      throw new ValidationError('Username already taken');
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
