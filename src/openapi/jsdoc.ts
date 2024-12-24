/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         name:
 *           type: string
 *           description: User's full name
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role in the system
 *       required:
 *         - email
 *         - name
 *         - role
 * 
 *     Recipe:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the recipe
 *         title:
 *           type: string
 *           description: Recipe title
 *         description:
 *           type: string
 *           description: Recipe description
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ingredient'
 *           description: List of ingredients needed
 *         instructions:
 *           type: array
 *           items:
 *             type: string
 *           description: Step by step cooking instructions
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the recipe
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Recipe tags for categorization
 *       required:
 *         - title
 *         - ingredients
 *         - instructions
 * 
 * paths:
 *   /api/user/login:
 *     post:
 *       summary: Authenticate user
 *       description: Login with username and password to get JWT token
 *       tags: [Authentication]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: User's email address
 *                 password:
 *                   type: string
 *                   format: password
 *                   description: User's password
 *               required:
 *                 - username
 *                 - password
 *       responses:
 *         200:
 *           description: Login successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     description: JWT token for authentication
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: List of user permissions
 *                   is_admin:
 *                     type: boolean
 *                     description: Whether user has admin privileges
 *                   _id:
 *                     type: string
 *                     description: User's unique identifier
 * 
 *   /api/recipes:
 *     get:
 *       summary: List recipes
 *       description: Get all recipes for the authenticated user
 *       tags: [Recipes]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: List of recipes
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Recipe'
 * 
 *     post:
 *       summary: Create recipe
 *       description: Create a new recipe
 *       tags: [Recipes]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       responses:
 *         201:
 *           description: Recipe created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Recipe'
 */

// Export types generated from OpenAPI spec
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  permissions: string[];
  is_admin: boolean;
  _id: string;
}

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
  tags?: string[];
}
