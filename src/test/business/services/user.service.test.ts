import {
  assertEquals,
  assertNotEquals,
  assertRejects,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { UserService } from '../../../business/services/user.service.ts';
import { UserRepository } from '../../../data/repositories/user.repository.ts';
import { cleanupTest, setupTest } from '../../test_utils.ts';
import { AuthenticationError, ValidationError } from '../../../types/errors.ts';
import { User } from '../../../types/mod.ts';
import { AppError } from '../../../types/middleware.ts';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let client: any;

  beforeEach(async () => {
    const testContext = await setupTest();
    client = testContext.mongoClient;
    userRepository = new UserRepository(client);
    userService = new UserService(userRepository);
  });

  afterEach(async () => {
    await cleanupTest();
  });

  const createTestUserData = (): Omit<User, 'id' | 'createdAt' | 'updatedAt'> => ({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'user' as const,
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = createTestUserData();
      const user = await userService.createUser(userData);

      assertEquals(user.email, userData.email);
      assertEquals(user.name, userData.name);
      assertEquals(user.role, userData.role);
      assertNotEquals(user.password, userData.password); // Password should be hashed
      assertEquals(typeof user.id, 'string');
      assertEquals(user.createdAt instanceof Date, true);
      assertEquals(user.updatedAt instanceof Date, true);
    });

    it('should not create user with duplicate email', async () => {
      const userData = createTestUserData();
      await userService.createUser(userData);

      await assertRejects(
        async () => {
          await userService.createUser(userData);
        },
        AppError,
        'Email already in use',
      );
    });

    it('should validate email format', async () => {
      const userData = {
        ...createTestUserData(),
        email: 'invalid-email',
      };

      await assertRejects(
        async () => {
          await userService.createUser(userData);
        },
        AppError,
        'Invalid email format',
      );
    });

    it('should validate password strength', async () => {
      const userData = {
        ...createTestUserData(),
        password: 'weak',
      };

      await assertRejects(
        async () => {
          await userService.createUser(userData);
        },
        AppError,
        'Password must be at least 8 characters',
      );
    });
  });

  describe('validateCredentials', () => {
    it('should validate correct credentials and return token', async () => {
      const userData = createTestUserData();
      await userService.createUser(userData);

      const token = await userService.validateCredentials(
        userData.email,
        userData.password,
      );

      assertEquals(typeof token, 'string');
      assertEquals(token.split('.').length, 3); // JWT has 3 parts
    });

    it('should not validate incorrect password', async () => {
      const userData = createTestUserData();
      await userService.createUser(userData);

      await assertRejects(
        async () => {
          await userService.validateCredentials(
            userData.email,
            'wrongpassword',
          );
        },
        AppError,
        'Invalid credentials',
      );
    });

    it('should handle non-existent user', async () => {
      await assertRejects(
        async () => {
          await userService.validateCredentials(
            'nonexistent@example.com',
            'password123',
          );
        },
        AppError,
        'Invalid credentials',
      );
    });
  });

  describe('getUserById', () => {
    it('should get user by id', async () => {
      const userData = createTestUserData();
      const createdUser = await userService.createUser(userData);
      const user = await userService.getUserById(createdUser.id);

      assertEquals(user.email, userData.email);
      assertEquals(user.name, userData.name);
      assertEquals(user.role, userData.role);
    });

    it('should throw error for non-existent user', async () => {
      await assertRejects(
        async () => {
          await userService.getUserById('nonexistent-id');
        },
        AppError,
        'User not found',
      );
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const userData = createTestUserData();
      const user = await userService.createUser(userData);
      const updatedUser = await userService.updateUser(user.id, {
        name: 'Updated Name',
      });

      assertEquals(updatedUser.name, 'Updated Name');
      assertEquals(updatedUser.email, userData.email);
      assertNotEquals(updatedUser.updatedAt, user.updatedAt);
    });

    it('should not update to existing email', async () => {
      const user1Data = {
        ...createTestUserData(),
        email: 'user1@example.com',
      };
      const user2Data = {
        ...createTestUserData(),
        email: 'user2@example.com',
      };

      const user1 = await userService.createUser(user1Data);
      await userService.createUser(user2Data);

      await assertRejects(
        async () => {
          await userService.updateUser(user1.id, {
            email: 'user2@example.com',
          });
        },
        AppError,
        'Email already in use',
      );
    });
  });
});
