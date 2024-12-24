import { Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Status } from "https://deno.land/std@0.208.0/http/http_status.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { Dependencies } from "../../types/mod.ts";
import { UserController } from "../controllers/user.controller.ts";
import { RecipeController } from "../controllers/recipe.controller.ts";
import { authMiddleware, adminOnly } from "../middleware/auth.middleware.ts";

const uploadDir = "./upload";

// Type for route handler functions
type RouteHandler = (ctx: Context, next?: () => Promise<void>) => Promise<void>;

// Helper to bind controller methods and preserve 'this' context
function bindMethod(instance: any, method: Function): RouteHandler {
  return method.bind(instance);
}

export async function initializeRoutes(router: Router, deps: Dependencies): Promise<Router> {
  const userController = new UserController(deps.userService);
  const recipeController = new RecipeController(deps.recipeService);

  // Auth routes
  router.post("/api/user/login", bindMethod(userController, userController.validateCredentials));
  router.get("/api/user/check", authMiddleware, bindMethod(userController, userController.checkUser));

  // Public user routes
  router.post("/api/users", bindMethod(userController, userController.create));

  // Protected user routes
  router.get("/api/users/:id", authMiddleware, bindMethod(userController, userController.getById));
  router.put("/api/users/:id", authMiddleware, bindMethod(userController, userController.update));
  router.delete("/api/users/:id", authMiddleware, adminOnly, bindMethod(userController, userController.delete));

  // Protected recipe routes
  router.get("/api/recipes", authMiddleware, bindMethod(recipeController, recipeController.listUserRecipes));
  router.post("/api/recipes", authMiddleware, bindMethod(recipeController, recipeController.create));
  router.get("/api/recipes/:id", authMiddleware, bindMethod(recipeController, recipeController.getById));
  router.put("/api/recipes/:id", authMiddleware, bindMethod(recipeController, recipeController.update));
  router.delete("/api/recipes/:id", authMiddleware, bindMethod(recipeController, recipeController.delete));

  // Mount upload routes (protected by auth)
  router.get("/upload/:file", authMiddleware, async (ctx) => {
    const fileName = ctx.params.file;
    if (!fileName) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: "File name is required" };
      return;
    }

    const filePath = join(uploadDir, fileName);
    
    try {
      // Read file and serve it
      const fileBytes = await Deno.readFile(filePath);
      
      // Set appropriate headers for image serving
      ctx.response.headers.set("Content-Type", "image/jpeg");
      ctx.response.headers.set("Cache-Control", "public, max-age=31536000");
      ctx.response.headers.delete("Content-Security-Policy");
      
      ctx.response.body = fileBytes;
    } catch (error) {
      console.error("File error:", error);
      ctx.response.status = Status.NotFound;
      ctx.response.body = { error: "File not found" };
    }
  });

  router.post("/upload", authMiddleware, async (ctx) => {
    try {
      const body = ctx.request.body({ type: "form-data" });
      const formData = await body.value;
      const fileData = await formData.read();
      const uploadedFile = fileData.files?.[0];

      if (!uploadedFile || !uploadedFile.content) {
        ctx.response.status = Status.BadRequest;
        ctx.response.body = { error: "No file uploaded" };
        return;
      }

      try {
        // Generate unique filename and save the file
        const fileName = crypto.randomUUID().toString() + ".jpg";
        const filePath = join(uploadDir, fileName);

        // Save the uploaded file directly
        await Deno.writeFile(filePath, uploadedFile.content);

        ctx.response.status = Status.OK;
        ctx.response.body = { fileName };
      } catch (error) {
        console.error("Image processing error:", error);
        ctx.response.status = Status.BadRequest;
        ctx.response.body = { error: "Invalid image format" };
      }
    } catch (error) {
      console.error("Upload error:", error);
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = { error: "Error processing upload" };
    }
  });

  return router;
}
