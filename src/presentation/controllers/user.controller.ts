import { Context, RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { BaseController } from "./base.controller.ts";
import { IUserService, User } from "../../types/mod.ts";
import { generateToken } from "../middleware/auth.middleware.ts";

interface CreateUserBody {
  email: string;
  password: string;
  name: string;
}

interface UpdateUserBody {
  email?: string;
  password?: string;
  name?: string;
}

export class UserController extends BaseController {
  constructor(private userService: IUserService) {
    super();
  }

  async create(ctx: Context) {
    const body = await this.getRequestBody<CreateUserBody>(ctx);
    if (!body) {
      return await this.badRequest(ctx, "Invalid request body");
    }

    const { email, password, name } = body;

    try {
      const user = await this.userService.createUser({
        email,
        password,
        name,
        role: "user",
      });
      await this.created(ctx, user);
    } catch (error) {
      if (error.message.includes("Invalid email")) {
        await this.badRequest(ctx, error.message);
      } else {
        await this.internalServerError(ctx, error.message);
      }
    }
  }

  async getById(ctx: RouterContext<"/users/:id">) {
    const id = ctx.params.id;
    try {
      const user = await this.userService.getUser(id);
      if (!user) {
        return await this.notFound(ctx, "User not found");
      }
      await this.ok(ctx, user);
    } catch (error) {
      await this.internalServerError(ctx, error.message);
    }
  }

  async update(ctx: RouterContext<"/users/:id">) {
    const id = ctx.params.id;
    const body = await this.getRequestBody<UpdateUserBody>(ctx);
    if (!body) {
      return await this.badRequest(ctx, "Invalid request body");
    }

    try {
      const user = await this.userService.updateUser(id, body);
      await this.ok(ctx, user);
    } catch (error) {
      if (error.message.includes("not found")) {
        await this.notFound(ctx, error.message);
      } else if (error.message.includes("Invalid email")) {
        await this.badRequest(ctx, error.message);
      } else {
        await this.internalServerError(ctx, error.message);
      }
    }
  }

  async delete(ctx: RouterContext<"/users/:id">) {
    const id = ctx.params.id;
    try {
      const deleted = await this.userService.deleteUser(id);
      if (!deleted) {
        return await this.notFound(ctx, "User not found");
      }
      await this.noContent(ctx);
    } catch (error) {
      await this.internalServerError(ctx, error.message);
    }
  }

  async checkUser(ctx: Context) {
    const token = ctx.request.headers.get("Authorization");
    if (!token) {
      return await this.unauthorized(ctx, "No token provided");
    }

    try {
      const [type, jwt] = token.split(" ");
      if (!jwt || (type !== "Bearer" && type !== "AUTH")) {
        return await this.unauthorized(ctx, "Invalid token format");
      }

      // The token validation will be handled by auth middleware
      await this.ok(ctx, { status: "ok" });
    } catch (error) {
      await this.unauthorized(ctx, "Invalid token");
    }
  }

  async validateCredentials(ctx: Context) {
    console.log("Validating credentials...");
    const body = await this.getRequestBody<{ username: string; password: string }>(ctx);
    console.log("Request body:", body);

    if (!body || !body.username || !body.password) {
      console.log("Missing username or password");
      return await this.badRequest(ctx, "Username and password are required");
    }

    try {
      console.log("Looking up user and validating password...");
      const isValid = await this.userService.validatePassword(body.username, body.password);
      if (!isValid) {
        console.log("Invalid password");
        return await this.unauthorized(ctx, "Invalid credentials");
      }

      if (!isValid) {
        console.log("Invalid credentials");
        return await this.unauthorized(ctx, "Invalid credentials");
      }

      // Get user details for token generation
      const user = await this.userService.getUserWithPassword(body.username);
      if (!user) {
        console.log("User not found after password validation");
        return await this.internalServerError(ctx, "User not found after validation");
      }

      console.log("Generating token...");
      const token = await generateToken(user.id, user.role);
      const response = {
        token: token,
        permissions: user.role === 'admin' ? ['User', 'Admin'] : ['User'],
        is_admin: user.role === 'admin',
        _id: user.id
      };
      console.log("Login successful");
      await this.ok(ctx, response);
    } catch (error) {
      console.error("Login error:", error);
      await this.internalServerError(ctx, error.message);
    }
  }
}
