import { Collection, ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Tag } from '../../types/mod.ts';
import { Database } from '../database.ts';
import { ResourceNotFoundError } from '../../types/errors.ts';

export interface ITagsRepository {
  create(tag: Omit<Tag, '_id' | 'createdAt' | 'updatedAt'>): Promise<Tag>;
  findById(id: string): Promise<Tag>;
  findAll(): Promise<Tag[]>;
  update(id: string, updates: Partial<Tag>): Promise<Tag>;
  delete(id: string): Promise<void>;
}

export class MongoTagsRepository implements ITagsRepository {
  constructor(private db: Database) {}

  async create(tag: Omit<Tag, '_id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    const now = new Date();
    const tagWithTimestamps = {
      ...tag,
      createdAt: now,
      updatedAt: now,
    };
    const _id = new ObjectId();
    const result = await this.db.tags.insertOne({ ...tagWithTimestamps, _id });
    return { ...tagWithTimestamps, _id };
  }

  private toObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch {
      throw new ResourceNotFoundError('Tag');
    }
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.db.tags.findOne({ _id: this.toObjectId(id) });
    if (!tag) {
      throw new ResourceNotFoundError('Tag');
    }
    return tag;
  }

  async findAll(): Promise<Tag[]> {
    return await this.db.tags.find().toArray();
  }

  async update(id: string, updates: Partial<Tag>): Promise<Tag> {
    const result = await this.db.tags.updateOne(
      { _id: this.toObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    if (result.modifiedCount === 0) {
      throw new ResourceNotFoundError('Tag');
    }
    const updatedTag = await this.db.tags.findOne({ _id: this.toObjectId(id) });
    if (!updatedTag) {
      throw new ResourceNotFoundError('Tag');
    }
    return updatedTag;
  }

  async delete(id: string): Promise<void> {
    const result = await this.db.tags.deleteOne({ _id: this.toObjectId(id) });
    console.log('THIS IS THE RESULT: ', result);
    if (result === 0) {
      throw new ResourceNotFoundError('Tag');
    }
  }
}

export type TagsRepository = ITagsRepository;
