import { Collection, MongoClient, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { User } from '../../types/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppError } from '../../types/middleware.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

type UserDoc = Omit<User, 'id'> & { _id: ObjectId };

export class UserRepository {
  private collection: Collection<UserDoc>;

  constructor(client: MongoClient) {
    const dbName = Deno.env.get('MONGO_DB_NAME') || 'recipe_app_test';
    this.collection = client.database(dbName).collection<UserDoc>('users');
  }

  private toUser(doc: UserDoc): User {
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password);
    const now = new Date();

    const doc = await this.collection.insertOne({
      ...userData,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      _id: new ObjectId(),
    });

    return this.toUser({
      _id: doc,
      ...userData,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(id) });
      return doc ? this.toUser(doc) : null;
    } catch {
      throw new AppError(Status.BadRequest, 'Invalid user ID');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? this.toUser(doc) : null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password);
      }

      const doc = await this.collection.findAndModify(
        { _id: new ObjectId(id) },
        {
          update: {
            $set: { ...updates, updatedAt: new Date() },
          },
          new: true,
        },
      );

      if (!doc) {
        throw new AppError(Status.NotFound, 'User not found');
      }

      return this.toUser(doc);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Status.BadRequest, 'Invalid user ID');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
      if (!result) {
        throw new AppError(Status.NotFound, 'User not found');
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(Status.BadRequest, 'Invalid user ID');
    }
  }

  async validatePassword(id: string, password: string): Promise<boolean> {
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return false;
    }

    return bcrypt.compare(password, doc.password);
  }
}
