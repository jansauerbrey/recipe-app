import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { BaseController, ControllerContext } from './base.controller.ts';
import { UserService } from '../../business/services/user.service.ts';
import { User, CreateUserInput } from '../../types/mod.ts';
import {
  AppError,
  AuthenticationError,
  ResourceNotFoundError,
  ValidationError,
} from '../../types/errors.ts';

export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  async refreshToken(ctx: ControllerContext): Promise<void> {
    try {
      const userId = ctx.state.user?.id;
      const userRole = ctx.state.user?.role;
      
      if (!userId || !userRole) {
        throw new AuthenticationError('User not authenticated');
      }

      const token = await this.userService.refreshToken(userId, userRole);
      await this.ok(ctx, { token });
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'AUTHENTICATION_ERROR') {
        await this.unauthorized(ctx, err.message);
      } else {
        await this.internalServerError(ctx, 'Failed to refresh token');
      }
    }
  }

  async validateCredentials(ctx: ControllerContext): Promise<void> {
    try {
      const body = ctx.request.body();
      const { email, password } = await body.value;

      const token = await this.userService.validateCredentials(email, password);
      await this.ok(ctx, { token });
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'AUTHENTICATION_ERROR') {
        await this.unauthorized(ctx, err.message);
      } else {
        await this.internalServerError(ctx, 'Failed to validate credentials');
      }
    }
  }

  async create(ctx: ControllerContext): Promise<void> {
    try {
      const body = ctx.request.body();
      const userData = await body.value;

      // Validate required fields
      if (!userData.email || !userData.password || !userData.username) {
        throw new ValidationError('Email, password, and username are required');
      }

      const createUserData: CreateUserInput = {
        email: userData.email,
        password: userData.password,
        username: userData.username,
        settings: userData.settings,
        role: 'user',
      };

      const user = await this.userService.createUser(createUserData);

      await this.created(ctx, user);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'VALIDATION_ERROR') {
        await this.badRequest(ctx, err.message);
      } else if (err.code === 'RESOURCE_NOT_FOUND') {
        await this.notFound(ctx, err.message);
      } else {
        await this.internalServerError(ctx, 'Failed to create user');
      }
    }
  }

  async checkUser(ctx: ControllerContext): Promise<void> {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const user = await this.userService.getUserById(userId);
      await this.ok(ctx, { user }); // Wrap user in an object
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'AUTHENTICATION_ERROR') {
        await this.unauthorized(ctx, err.message);
      } else if (err.code === 'RESOURCE_NOT_FOUND') {
        await this.notFound(ctx, err.message);
      } else {
        await this.internalServerError(ctx, 'Failed to check user');
      }
    }
  }

  async getById(ctx: ControllerContext): Promise<void> {
    try {
      const { id } = ctx.params;
      const user = await this.userService.getUserById(id);
      await this.ok(ctx, user);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'RESOURCE_NOT_FOUND') {
        await this.notFound(ctx, err.message);
      } else if (err.code === 'VALIDATION_ERROR') {
        await this.badRequest(ctx, err.message);
      } else {
        await this.internalServerError(ctx, 'Failed to get user');
      }
    }
  }

  async update(ctx: ControllerContext): Promise<void> {
    try {
      const { id } = ctx.params;
      const body = ctx.request.body();
      const updates = await body.value;

      const user = await this.userService.updateUser(id, updates);
      await this.ok(ctx, user);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'RESOURCE_NOT_FOUND') {
        await this.notFound(ctx, err.message);
      } else if (err.code === 'VALIDATION_ERROR') {
        await this.badRequest(ctx, err.message);
      } else {
        await this.internalServerError(ctx, 'Failed to update user');
      }
    }
  }

  async delete(ctx: ControllerContext): Promise<void> {
    try {
      const { id } = ctx.params;
      await this.userService.deleteUser(id);
      await this.noContent(ctx);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === 'RESOURCE_NOT_FOUND') {
        await this.notFound(ctx, err.message);
      } else if (err.code === 'VALIDATION_ERROR') {
        await this.badRequest(ctx, err.message);
      } else {
        await this.internalServerError(ctx, 'Failed to delete user');
      }
    }
  }
}
