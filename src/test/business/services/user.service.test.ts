import {
  assertEquals,
  assertNotEquals,
  assertRejects,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { UserService } from '../../../business/services/user.service.ts';
import { UserRepository } from '../../../data/repositories/user.repository.ts';
import { cleanupTest, setupTest } from '../../test_utils.ts';
import {
  AuthenticationError,
  ResourceNotFoundError,
  ValidationError,
} from '../../../types/errors.ts';
import { User } from '../../../types/mod.ts';

Deno.test({
  name: 'UserService Tests',
  async fn() {
    const testContext = await setupTest();
    const userRepository = new UserRepository(testContext.database);
    const userService = new UserService(userRepository);

    try {
      // Clean up any existing users
      await testContext.database.users.deleteMany({});

      const createTestUserData = (suffix = ''): Omit<User, 'id' | 'createdAt' | 'updatedAt'> => ({
        email: `test${suffix}@example.com`,
        password: 'password123',
        username: `Test User ${suffix}`,
        role: 'user' as const,
      });

      // Test: should create a new user
      {
        const userData = createTestUserData('1');
        const user = await userService.createUser(userData);

        assertEquals(user.email, userData.email);
        assertEquals(user.username, userData.username);
        assertEquals(user.role, userData.role);
        assertNotEquals(user.password, userData.password); // Password should be hashed
        assertEquals(typeof user.id, 'string');
        assertEquals(user.createdAt instanceof Date, true);
        assertEquals(user.updatedAt instanceof Date, true);
      }

      // Test: should not create user with duplicate email
      {
        const userData = createTestUserData('2');
        await userService.createUser(userData);

        await assertRejects(
          async () => {
            await userService.createUser(userData);
          },
          ValidationError,
          'Email already in use',
        );
      }

      // Test: should validate email format
      {
        const userData = {
          ...createTestUserData('3'),
          email: 'invalid-email',
        };

        await assertRejects(
          async () => {
            await userService.createUser(userData);
          },
          ValidationError,
          'Invalid email format',
        );
      }

      // Test: should validate password strength
      {
        const userData = {
          ...createTestUserData('4'),
          password: 'weak',
        };

        await assertRejects(
          async () => {
            await userService.createUser(userData);
          },
          ValidationError,
          'Password must be at least 8 characters',
        );
      }

      // Test: should validate correct credentials and return token
      {
        const userData = createTestUserData('5');
        await userService.createUser(userData);

        const token = await userService.validateCredentials(
          userData.email,
          userData.password,
        );

        assertEquals(typeof token, 'string');
        assertEquals(token.split('.').length, 3); // JWT has 3 parts
      }

      // Test: should not validate incorrect password
      {
        const userData = createTestUserData('6');
        await userService.createUser(userData);

        await assertRejects(
          async () => {
            await userService.validateCredentials(
              userData.email,
              'wrongpassword',
            );
          },
          AuthenticationError,
          'Invalid credentials',
        );
      }

      // Test: should handle non-existent user
      {
        await assertRejects(
          async () => {
            await userService.validateCredentials(
              'nonexistent@example.com',
              'password123',
            );
          },
          AuthenticationError,
          'Invalid credentials',
        );
      }

      // Test: should get user by id
      {
        const userData = createTestUserData('7');
        const createdUser = await userService.createUser(userData);
        const user = await userService.getUserById(createdUser.id);

        assertEquals(user.email, userData.email);
        assertEquals(user.username, userData.username);
        assertEquals(user.role, userData.role);
      }

      // Test: should throw error for non-existent user
      {
        await assertRejects(
          async () => {
            await userService.getUserById('507f1f77bcf86cd799439011');
          },
          ResourceNotFoundError,
          'User not found',
        );
      }

      // Test: should update user details
      {
        const userData = createTestUserData('8');
        const user = await userService.createUser(userData);
        const updatedUser = await userService.updateUser(user.id, {
          username: 'Updated Name',
        });

        assertEquals(updatedUser.username, 'Updated Name');
        assertEquals(updatedUser.email, userData.email);
        assertNotEquals(updatedUser.updatedAt, user.updatedAt);
      }

      // Test: should not update to existing email
      {
        const user1Data = {
          ...createTestUserData('9'),
          email: 'user1@example.com',
        };
        const user2Data = {
          ...createTestUserData('10'),
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
          ValidationError,
          'Email already in use',
        );
      }
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
