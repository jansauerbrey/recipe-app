import { User, IUserService, IUserRepository } from "../../types/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.0/mod.ts";

type UserWithPassword = User & { password: string };

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password);
    
    // Validate email format
    if (!this.isValidEmail(userData.email)) {
      throw new Error("Invalid email format");
    }

    // Create user with hashed password
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async getUser(idOrEmail: string): Promise<User | null> {
    let user: UserWithPassword | null;
    
    // Try to find by email first if it's an email
    if (this.isValidEmail(idOrEmail)) {
      user = await this.userRepository.findByEmail(idOrEmail);
    } else {
      user = await this.userRepository.findById(idOrEmail);
    }

    if (!user) return null;

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async getUserWithPassword(idOrUsername: string): Promise<UserWithPassword | null> {
    console.log("Getting user with password for:", idOrUsername);
    // Try to find by username first
    console.log("Looking up user by username");
    const user = await this.userRepository.findByUsername(idOrUsername);
    if (user) {
      console.log("Found user by username:", user);
      return user;
    }
    // Fall back to ID lookup
    console.log("Looking up user by ID");
    const userById = await this.userRepository.findById(idOrUsername);
    console.log("Found user by ID:", userById);
    return userById;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    // If updating email, validate format
    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new Error("Invalid email format");
    }

    // If updating password, hash it
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password);
    }

    const user = await this.userRepository.update(id, userData);
    
    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  async validatePassword(idOrEmail: string, password: string): Promise<boolean> {
    console.log("Validating password for:", idOrEmail);
    const user = await this.getUserWithPassword(idOrEmail);
    if (!user) {
      console.log("No user found for password validation");
      return false;
    }

    console.log("Comparing passwords...");
    console.log("Input password:", password);
    console.log("Stored hash:", user.password);
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Password validation result:", isValid);
    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
