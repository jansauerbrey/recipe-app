import { Collection, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Database } from '../database.ts';
import { User } from '../../types/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppError, ResourceNotFoundError, ValidationError } from '../../types/errors.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { logger } from '../../utils/logger.ts';

type UserDoc = Omit<User, 'id'> & { _id: ObjectId };

export class UserRepository {
  private collection: Collection<UserDoc>;

  constructor(db: Database) {
    this.collection = db.users;
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

  private toObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch {
      throw new ValidationError('Invalid user ID');
    }
  }

  async findById(id: string): Promise<User> {
    const _id = this.toObjectId(id);
    const doc = await this.collection.findOne({ _id });
    if (!doc) {
      throw new ResourceNotFoundError('User');
    }
    return this.toUser(doc);
  }

  async findByEmail(email: string): Promise<User | null> {
    logger.debug('Looking up user by email in database', { email });
    const doc = await this.collection.findOne({ email });
    if (!doc) {
      logger.debug('No user found with email', { email });
      return null;
    }
    logger.debug('User found with email', { userId: doc._id.toString() });
    return this.toUser(doc);
  }

  async findByUsername(username: string): Promise<User | null> {
    const doc = await this.collection.findOne({ username });
    return doc ? this.toUser(doc) : null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const _id = this.toObjectId(id);

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password);
    }

    const doc = await this.collection.findAndModify(
      { _id },
      {
        update: {
          $set: { ...updates, updatedAt: new Date() },
        },
        new: true,
      },
    );

    if (!doc) {
      throw new ResourceNotFoundError('User');
    }

    return this.toUser(doc);
  }

  async delete(id: string): Promise<void> {
    const _id = this.toObjectId(id);
    const result = await this.collection.deleteOne({ _id });
    if (!result) {
      throw new ResourceNotFoundError('User');
    }
  }

  async validatePassword(id: string, password: string): Promise<boolean> {
    logger.debug('Validating password for user', { userId: id });
    const _id = this.toObjectId(id);
    
    const doc = await this.collection.findOne({ _id });
    if (!doc) {
      logger.debug('User not found during password validation', { userId: id });
      throw new ResourceNotFoundError('User');
    }

    logger.debug('Comparing password hash');
    const isValid = await bcrypt.compare(password, doc.password);
    logger.debug('Password validation result', { userId: id, isValid });
    return isValid;
  }
}
