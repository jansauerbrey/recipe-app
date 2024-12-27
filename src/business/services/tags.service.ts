import { TagsRepository } from '../../data/repositories/tags.repository.ts';
import { Tag, TagResponse } from '../../types/mod.ts';
import { ResourceNotFoundError, ValidationError } from '../../types/errors.ts';

export interface ITagsService {
  createTag(tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<TagResponse>;
  getTagById(id: string): Promise<TagResponse>;
  listTags(): Promise<TagResponse[]>;
  updateTag(id: string, updates: Partial<Tag>): Promise<TagResponse>;
  deleteTag(id: string): Promise<void>;
}

export class TagsService implements ITagsService {
  constructor(private tagsRepository: TagsRepository) {}

  async createTag(
    tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TagResponse> {
    if (!tag.name) {
      throw new ValidationError('Tag name is required');
    }

    const createdTag = await this.tagsRepository.create(tag);
    const { id, ...rest } = createdTag;
    return {
      ...rest,
      _id: id,
    };
  }

  async getTagById(id: string): Promise<TagResponse> {
    const tag = await this.tagsRepository.findById(id);
    const { id: tagId, ...rest } = tag;
    return {
      ...rest,
      _id: tagId,
    };
  }

  async listTags(): Promise<TagResponse[]> {
    const tags = await this.tagsRepository.findAll();
    return tags.map((tag) => {
      const { id, ...rest } = tag;
      return {
        ...rest,
        _id: id,
      };
    });
  }

  async updateTag(id: string, updates: Partial<Tag>): Promise<TagResponse> {
    if (updates.name && !updates.name.trim()) {
      throw new ValidationError('Tag name cannot be empty');
    }

    const updatedTag = await this.tagsRepository.update(id, updates);
    const { id: tagId, ...rest } = updatedTag;
    return {
      ...rest,
      _id: tagId,
    };
  }

  async deleteTag(id: string): Promise<void> {
    await this.tagsRepository.delete(id);
  }
}
