const express = require('express');
const router = express.Router();
const { RoleService } = require('../services/RoleService');
const { authorize } = require('../middleware/authorize');
const { authenticate } = require('../middleware/auth');
const { featureGuard } = require('../middleware/featureGuard');
const { BadRequest } = require('../middleware/errorHandler');

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List roles for the current company
 *     description: |
 *       Returns all roles visible to the user in the current company context:
 *       system roles (SUPER_ADMIN, ADMIN, USER) plus any custom roles created for the company.
 *       Requires `roles:read` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of roles with their permissions
 *         content:
 *           application/json:
 *             example:
 *               - roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                 name: "SUPER_ADMIN"
 *                 description: "Full system access across all companies"
 *                 isSystem: true
 *                 companyId: null
 *                 createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *                 updatedBy: "550e8400-e29b-41d4-a716-446655440000"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *                 updatedAt: "2026-07-21T10:00:00.000Z"
 *                 company: null
 *                 creator:
 *                   firstName: John
 *                   lastName: Doe
 *                   username: johndoe
 *                 updater:
 *                   firstName: John
 *                   lastName: Doe
 *                   username: johndoe
 *                 permissions:
 *                   - permissionId: "perm-001"
 *                     resource: "companies"
 *                     action: "read"
 *                     description: "View company details"
 *                   - permissionId: "perm-002"
 *                     resource: "companies"
 *                     action: "write"
 *                     description: "Create and edit companies"
 *       403:
 *         description: Missing roles:read permission
 */
router.get('/', authenticate, authorize('roles', 'read'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const result = await RoleService.listByCompany(companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a custom role
 *     description: |
 *       Creates a new role scoped to the current company. System roles (SUPER_ADMIN, ADMIN, USER) cannot be created this way.
 *       Pass an array of `permissionIds` to assign permissions at creation time.
 *       Requires `roles:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Invoice Manager"
 *             description: "Can manage invoices and document types"
 *             permissionIds:
 *               - "perm-001"
 *               - "perm-007"
 *               - "perm-008"
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name (unique within the company)
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission IDs to assign
 *     responses:
 *       201:
 *         description: Role created with permissions
 *         content:
 *           application/json:
 *             example:
 *               roleId: "bb0e8400-e29b-41d4-a716-446655440006"
 *               name: "Invoice Manager"
 *               description: "Can manage invoices and document types"
 *               isSystem: false
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *               updatedBy: "550e8400-e29b-41d4-a716-446655440000"
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               updatedAt: "2026-07-21T10:30:00.000Z"
 *               company:
 *                 companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                 name: "Acme Corp"
 *               creator:
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe
 *               updater:
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe
 *               permissions:
 *                 - permissionId: "perm-001"
 *                   resource: "companies"
 *                   action: "read"
 *                   description: "View company details"
 *       400:
 *         description: Role name already exists in this company
 *       403:
 *         description: Missing roles:write permission
 */
router.post('/', authenticate, authorize('roles', 'create'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { name, description, permissionIds } = req.body;
    const result = await RoleService.create(companyId, req.userId, { name, description, permissionIds });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /roles/permissions:
 *   get:
 *     tags: [Roles]
 *     summary: List all available permissions
 *     description: Returns the full catalogue of permissions (resource + action pairs) that can be assigned to roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All permissions
 *         content:
 *           application/json:
 *             example:
 *               - permissionId: "perm-001"
 *                 resource: "companies"
 *                 action: "read"
 *                 description: "View company details"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *               - permissionId: "perm-002"
 *                 resource: "companies"
 *                 action: "write"
 *                 description: "Create and edit companies"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *               - permissionId: "perm-003"
 *                 resource: "users"
 *                 action: "read"
 *                 description: "View users in company"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *               - permissionId: "perm-004"
 *                 resource: "users"
 *                 action: "write"
 *                 description: "Add, update, remove users"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *               - permissionId: "perm-005"
 *                 resource: "roles"
 *                 action: "read"
 *                 description: "View roles and permissions"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *               - permissionId: "perm-006"
 *                 resource: "roles"
 *                 action: "write"
 *                 description: "Create, update, delete custom roles"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *               - permissionId: "perm-007"
 *                 resource: "documents"
 *                 action: "read"
 *                 description: "View document types"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *               - permissionId: "perm-008"
 *                 resource: "documents"
 *                 action: "write"
 *                 description: "Create and manage document types"
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *       403:
 *         description: Missing roles:read permission
 */
router.get('/permissions', authenticate, authorize('roles', 'read'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const result = await RoleService.listPermissions();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     tags: [Roles]
 *     summary: Get a role by ID
 *     description: Returns the role with all its assigned permissions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role details with permissions
 *         content:
 *           application/json:
 *             example:
 *               roleId: "bb0e8400-e29b-41d4-a716-446655440006"
 *               name: "Invoice Manager"
 *               description: "Can manage invoices and document types"
 *               isSystem: false
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *               updatedBy: "550e8400-e29b-41d4-a716-446655440000"
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               updatedAt: "2026-07-21T10:30:00.000Z"
 *               company:
 *                 companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                 name: "Acme Corp"
 *               creator:
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe
 *               updater:
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe
 *               permissions:
 *                 - permissionId: "perm-007"
 *                   resource: "documents"
 *                   action: "read"
 *                   description: "View document types"
 *       404:
 *         description: Role not found
 */
router.get('/:roleId', authenticate, authorize('roles', 'read'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const result = await RoleService.getById(req.params.roleId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /roles/{roleId}:
 *   put:
 *     tags: [Roles]
 *     summary: Update a custom role
 *     description: |
 *       Updates the role name, description, and/or permissions. System roles (SUPER_ADMIN, ADMIN, USER) cannot be modified.
 *       When `permissionIds` is provided, it replaces all existing permissions for the role.
 *       Requires `roles:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Invoice Manager Pro"
 *             description: "Updated description with more permissions"
 *             permissionIds:
 *               - "perm-001"
 *               - "perm-002"
 *               - "perm-007"
 *               - "perm-008"
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Replaces all permissions when provided
 *     responses:
 *       200:
 *         description: Updated role
 *       400:
 *         description: Cannot modify system roles / role name already exists
 *       403:
 *         description: Missing roles:write permission
 */
router.put('/:roleId', authenticate, authorize('roles', 'update'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const { name, description, permissionIds } = req.body;
    const result = await RoleService.update(req.params.roleId, req.userId, { name, description, permissionIds });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /roles/{roleId}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a custom role
 *     description: |
 *       Deletes a custom role. System roles cannot be deleted.
 *       Roles that are currently assigned to users cannot be deleted — reassign those users first.
 *       Requires `roles:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 *         content:
 *           application/json:
 *             example:
 *               deleted: true
 *       400:
 *         description: Cannot delete system roles / role is assigned to users
 *       403:
 *         description: Missing roles:write permission
 */
router.delete('/:roleId', authenticate, authorize('roles', 'delete'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const result = await RoleService.delete(req.params.roleId, req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /roles/{roleId}/permissions:
 *   put:
 *     tags: [Roles]
 *     summary: Replace all permissions for a role
 *     description: |
 *       Replaces the entire set of permissions for a custom role. System roles cannot be modified.
 *       Pass an empty array to remove all permissions.
 *       Requires `roles:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             permissionIds:
 *               - "perm-001"
 *               - "perm-003"
 *               - "perm-005"
 *               - "perm-007"
 *           schema:
 *             type: object
 *             required: [permissionIds]
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission IDs (replaces all existing)
 *     responses:
 *       200:
 *         description: Role with updated permissions
 *       400:
 *         description: Cannot modify system roles
 *       403:
 *         description: Missing roles:write permission
 */
router.put('/:roleId/permissions', authenticate, authorize('roles', 'update'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const { permissionIds } = req.body;
    const result = await RoleService.assignPermissions(req.params.roleId, req.userId, permissionIds);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
