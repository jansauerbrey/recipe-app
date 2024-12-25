import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { BaseController, ControllerContext } from './base.controller.ts';
import { UserService } from '../../business/services/user.service.ts';
import { AppError } from '../../types/middleware.ts';
import { User } from '../../types/mod.ts';

export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  async validateCredentials(ctx: ControllerContext): Promise<void> {
    try {
      const body = ctx.request.body();
      const { email, password } = await body.value;

      const token = await this.userService.validateCredentials(email, password);
      await this.ok(ctx, { token });
    } catch (error) {
      if (error instanceof AppError) {
        await this.unauthorized(ctx, error.message);
      } else {
        await this.internalServerError(ctx, 'Failed to validate credentials');
      }
    }
  }

  async create(ctx: ControllerContext): Promise<void> {
    try {
      const body = ctx.request.body();
      const userData = await body.value;

      const user = await this.userService.createUser({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: 'user',
      } as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);

      await this.created(ctx, user);
    } catch (error) {
      if (error instanceof AppError) {
        if (error.message.includes('Invalid email')) {
          await this.badRequest(ctx, error.message);
        } else {
          await this.internalServerError(ctx, error.message);
        }
      } else {
        await this.internalServerError(ctx, 'Failed to create user');
      }
    }
  }

  async checkUser(ctx: ControllerContext): Promise<void> {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AppError(Status.Unauthorized, 'User not authenticated');
      }

      const user = await this.userService.getUserById(userId);
      await this.ok(ctx, { user }); // Wrap user in an object
    } catch (error) {
      if (error instanceof AppError) {
        await this.internalServerError(ctx, error.message);
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
      if (error instanceof AppError) {
        if (error.message.includes('not found')) {
          await this.notFound(ctx, error.message);
        } else if (error.message.includes('Invalid email')) {
          await this.badRequest(ctx, error.message);
        } else {
          await this.internalServerError(ctx, error.message);
        }
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
      if (error instanceof AppError) {
        await this.internalServerError(ctx, error.message);
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
      if (error instanceof AppError) {
        await this.internalServerError(ctx, error.message);
      } else {
        await this.internalServerError(ctx, 'Failed to delete user');
      }
    }
  }
}
