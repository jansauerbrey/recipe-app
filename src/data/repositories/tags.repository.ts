import { Collection } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { Tag } from '../../types/mod.ts';
import { Database } from '../database.ts';

export interface ITagsRepository {
  create(tag: Omit<Tag, '_id'>): Promise<Tag>;
  findById(id: string): Promise<Tag>;
  findAll(): Promise<Tag[]>;
  update(id: string, updates: Partial<Tag>): Promise<Tag>;
  delete(id: string): Promise<void>;
}

export class MongoTagsRepository implements ITagsRepository {
  constructor(private db: Database) {}

  async create(tag: Omit<Tag, '_id'>): Promise<Tag> {
    const result = await this.db.tags.insertOne(tag as any);
    return { ...tag, _id: result.toString() };
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.db.tags.findOne({ _id: id });
    if (!tag) {
      throw new Error('Tag not found');
    }
    return tag;
  }

  async findAll(): Promise<Tag[]> {
    return await this.db.tags.find().toArray();
  }

  async update(id: string, updates: Partial<Tag>): Promise<Tag> {
    const result = await this.db.tags.updateOne(
      { _id: id },
      { $set: updates }
    );
    if (result.modifiedCount === 0) {
      throw new Error('Tag not found');
    }
    const updatedTag = await this.db.tags.findOne({ _id: id });
    if (!updatedTag) {
      throw new Error('Tag not found');
    }
    return updatedTag;
  }

  async delete(id: string): Promise<void> {
    await this.db.tags.deleteOne({ _id: id });
  }
}

export type TagsRepository = ITagsRepository;
