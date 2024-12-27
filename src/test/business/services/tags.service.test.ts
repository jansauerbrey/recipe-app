import { assertEquals, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { TagsService } from '../../../business/services/tags.service.ts';
import { MongoTagsRepository } from '../../../data/repositories/tags.repository.ts';
import { cleanupTest, setupTest } from '../../test_utils.ts';
import { AppError, ValidationError, ResourceNotFoundError } from '../../../types/errors.ts';
import { Tag } from '../../../types/mod.ts';

Deno.test({
  name: 'TagsService Tests',
  async fn() {
    const testContext = await setupTest();
    const tagsRepository = new MongoTagsRepository(testContext.database);
    const tagsService = new TagsService(tagsRepository);

    try {
      // Clean up any existing tags
      await testContext.database.tags.deleteMany({});

      const createTestTagData = (suffix = ''): Omit<Tag, '_id' | 'createdAt' | 'updatedAt'> => ({
        name: `Test Tag ${suffix}`
      });

      // Test: should create a new tag
      {
        const tagData = createTestTagData('1');
        const tag = await tagsService.createTag(tagData);

        assertEquals(tag.name, tagData.name);
        assertEquals(typeof tag._id, 'string');
        assertEquals(tag.createdAt instanceof Date, true);
        assertEquals(tag.updatedAt instanceof Date, true);
      }

      // Test: should not create tag without name
      {
        const tagData = createTestTagData('2');
        delete (tagData as any).name;

        await assertRejects(
          async () => {
            await tagsService.createTag(tagData);
          },
          ValidationError,
          'Tag name is required',
        );
      }

      // Test: should get tag by id
      {
        const tagData = createTestTagData('3');
        const createdTag = await tagsService.createTag(tagData);
        const tag = await tagsService.getTagById(createdTag._id);

        assertEquals(tag.name, tagData.name);
        assertEquals(tag._id, createdTag._id);
      }

      // Test: should throw error for invalid ID format
      {
        await assertRejects(
          async () => {
            await tagsService.getTagById('invalid-id');
          },
          ResourceNotFoundError,
          'Tag not found',
        );
      }

      // Test: should throw error for non-existent tag
      {
        await assertRejects(
          async () => {
            await tagsService.getTagById('507f1f77bcf86cd799439011');
          },
          ResourceNotFoundError,
          'Tag not found',
        );
      }

      // Test: should list all tags
      {
        await testContext.database.tags.deleteMany({});
        const tag1 = await tagsService.createTag(createTestTagData('4'));
        const tag2 = await tagsService.createTag(createTestTagData('5'));

        const tags = await tagsService.listTags();

        assertEquals(tags.length, 2);
        assertEquals(tags[0]._id, tag1._id);
        assertEquals(tags[1]._id, tag2._id);
      }

      // Test: should update tag
      {
        const tagData = createTestTagData('6');
        const tag = await tagsService.createTag(tagData);
        const updatedTag = await tagsService.updateTag(tag._id, {
          name: 'Updated Tag Name',
        });

        assertEquals(updatedTag.name, 'Updated Tag Name');
        assertEquals(updatedTag._id, tag._id);
      }

      // Test: should not update tag with empty name
      {
        const tagData = createTestTagData('7');
        const tag = await tagsService.createTag(tagData);

        const updates = { name: '' };
        console.log('Test updates:', updates);
        try {
          await tagsService.updateTag(tag._id, updates);
          throw new Error('Expected ValidationError but got no error');
        } catch (error) {
          if (!(error instanceof Error)) {
            throw new Error(`Expected Error but got ${typeof error}`);
          }
          if (!(error instanceof AppError)) {
            throw new Error(`Expected AppError but got ${error.constructor.name}`);
          }
          assertEquals(error.code, 'VALIDATION_ERROR');
          assertEquals(error.statusCode, 400);
          assertEquals(error.message, 'Tag name cannot be empty');
        }
      }

      // Test: should delete tag
      {
        const tagData = createTestTagData('8');
        const tag = await tagsService.createTag(tagData);
        await tagsService.deleteTag(tag._id);

        await assertRejects(
          async () => {
            await tagsService.getTagById(tag._id);
          },
          ResourceNotFoundError,
          'Tag not found',
        );
      }

      // Test: should throw error when deleting non-existent tag
      {
        await assertRejects(
          async () => {
            await tagsService.deleteTag('507f1f77bcf86cd799439011');
          },
          ResourceNotFoundError,
          'Tag not found',
        );
      }
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
