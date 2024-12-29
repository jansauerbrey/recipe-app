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
    logger.debug('Starting email lookup', { 
      email,
      collectionName: this.collection.name
    });

    try {
      // Log the exact query we're about to execute
      const filter = { email: email };
      logger.debug('Executing findOne query', { 
        filter,
        collectionName: this.collection.name
      });

      // Try to count documents in collection
      try {
        const count = await this.collection.countDocuments({});
        logger.debug('Collection document count', { 
          count,
          collectionName: this.collection.name
        });
      } catch (countError) {
        logger.debug('Unable to get collection count', { 
          error: countError instanceof Error ? countError.message : String(countError)
        });
      }

      const doc = await this.collection.findOne(filter);

      if (!doc) {
        logger.debug('Query returned no results', { 
          email,
          filter
        });
        return null;
      }

      logger.debug('Query returned document', { 
        userId: doc._id.toString(),
        hasPassword: !!doc.password,
        documentFields: Object.keys(doc)
      });

      return this.toUser(doc);
    } catch (error) {
      logger.error('Error during email lookup', {
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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
