import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { TagsService } from '../../business/services/tags.service.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

export function createTagsRouter(tagsService: TagsService): Router {
  const router = new Router();

  // Get all tags
  router.get('/api/tags', authMiddleware, async (ctx) => {
    try {
      const tags = await tagsService.listTags();
      ctx.response.body = tags;
    } catch (error) {
      ctx.response.status = 500;
      ctx.response.body = { error: 'Failed to fetch tags' };
    }
  });

  // Create a new tag
  router.post('/api/tags', authMiddleware, async (ctx) => {
    try {
      const body = await ctx.request.body().value;
      const tag = await tagsService.createTag(body);
      ctx.response.status = 201;
      ctx.response.body = tag;
    } catch (error) {
      ctx.response.status = 400;
      ctx.response.body = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get a specific tag
  router.get('/api/tags/:id', authMiddleware, async (ctx) => {
    try {
      const tag = await tagsService.getTagById(ctx.params.id);
      ctx.response.body = tag;
    } catch (error) {
      ctx.response.status = 404;
      ctx.response.body = { error: 'Tag not found' };
    }
  });

  // Update a tag
  router.put('/api/tags/:id', authMiddleware, async (ctx) => {
    try {
      const body = await ctx.request.body().value;
      const tag = await tagsService.updateTag(ctx.params.id, body);
      ctx.response.body = tag;
    } catch (error) {
      ctx.response.status = 400;
      ctx.response.body = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Delete a tag
  router.delete('/api/tags/:id', authMiddleware, async (ctx) => {
    try {
      await tagsService.deleteTag(ctx.params.id);
      ctx.response.status = 204;
    } catch (error) {
      ctx.response.status = 404;
      ctx.response.body = { error: 'Tag not found' };
    }
  });

  return router;
}
