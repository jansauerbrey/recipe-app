import { TagsRepository } from '../../data/repositories/tags.repository.ts';
import { Tag, TagResponse } from '../../types/mod.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';

export interface ITagsService {
  createTag(tag: Omit<Tag, '_id' | 'createdAt' | 'updatedAt'>): Promise<TagResponse>;
  getTagById(id: string): Promise<TagResponse>;
  listTags(): Promise<TagResponse[]>;
  updateTag(id: string, updates: Partial<Tag>): Promise<TagResponse>;
  deleteTag(id: string): Promise<void>;
}

export class TagsService implements ITagsService {
  constructor(private tagsRepository: TagsRepository) {}

  async createTag(
    tag: Omit<Tag, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TagResponse> {
    if (!tag.name) {
      throw new ValidationError('Tag name is required');
    }

    const createdTag = await this.tagsRepository.create(tag);
    return {
      ...createdTag,
      _id: createdTag._id.toString()
    };
  }

  async getTagById(id: string): Promise<TagResponse> {
    const tag = await this.tagsRepository.findById(id);
    return {
      ...tag,
      _id: tag._id.toString()
    };
  }

  async listTags(): Promise<TagResponse[]> {
    const tags = await this.tagsRepository.findAll();
    return tags.map((tag) => {
      return {
        ...tag,
        _id: tag._id.toString()
      };
    });
  }

  async updateTag(id: string, updates: Partial<Tag>): Promise<TagResponse> {
    console.log('Updating tag with:', updates);
    if (updates.name === undefined || updates.name === null || !updates.name.trim()) {
      console.log('Throwing ValidationError for empty name');
      throw new ValidationError('Tag name cannot be empty');
    }

    try {
      const updatedTag = await this.tagsRepository.update(id, updates);
      return {
        ...updatedTag,
        _id: updatedTag._id.toString()
      };
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  async deleteTag(id: string): Promise<void> {
    await this.tagsRepository.delete(id);
  }
}
