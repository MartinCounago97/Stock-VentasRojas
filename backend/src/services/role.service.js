const { User } = require("../models/user.model");
const { Role } = require("../models/role.model");
const { ResourceRole } = require("../models/resource-role.model");
const { Resource } = require("../models/resource.model");
const { connectToMongo } = require("../config/mongoConfig");
const NotFoundError = require("../exceptions/NotFoundError");
const DuplicateError = require("../exceptions/DuplicateError");
const BaseError = require("../exceptions/BaseError");
const mongoose = require("mongoose");

class RoleService {
  constructor() {
    connectToMongo();
    this.User = User;
    this.Role = Role;
    this.ResourceRole = ResourceRole;
    this.Resource = Resource;
  }

  async getRole(name) {
    if (name) {
      const role = await this.Role.findOne({ name: name });
      if (!role) {
        throw new NotFoundError(`Role not found with the name: ${name}`);
      }

      const users = await this.User.find({ roleId: role._id }).select(
        "-password"
      );

      const permissions = await this.ResourceRole.find({
        roleId: role._id,
      }).populate("resourceId", "name");

      const permissionsWithResourceNames = permissions.map((permission) => ({
        ...permission.toObject(),
        resourceName: permission.resourceId.name,
      }));

      return {
        ...role.toObject(),
        users: users.map((user) => user.toObject()),
        permissions: permissionsWithResourceNames,
      };
    } else {
      const roles = await this.Role.find({});

      const rolesWithDetails = await Promise.all(
        roles.map(async (role) => {
          const users = await this.User.find({ roleId: role._id }).select(
            "-password"
          );
          const permissions = await this.ResourceRole.find({
            roleId: role._id,
          }).populate("resourceId", "name");

          return {
            ...role.toObject(),
            users: users.map((user) => user.toObject()),
            permissions,
          };
        })
      );

      return rolesWithDetails;
    }
  }

  async createRole(name, permissions) {
    const existingRole = await this.Role.findOne({ name: name });
    if (existingRole) {
      throw new DuplicateError(`rol ${name}`);
    }

    const validResources = await this.Resource.find({
      _id: {
        $in: permissions.map(
          (resourceId) => new mongoose.Types.ObjectId(resourceId)
        ),
      },
    });

    if (validResources.length !== permissions.length) {
      throw new NotFoundError("resources.");
    }

    let newRole;
    let createdAssignments = [];
    try {
      newRole = new this.Role({ name: name });
      await newRole.save();

      createdAssignments = await Promise.all(
        validResources.map(async (resource) => {
          const resourceRole = new this.ResourceRole({
            resourceId: resource._id,
            roleId: newRole._id,
          });
          await resourceRole.save();
          return resourceRole;
        })
      );

      return newRole;
    } catch (error) {
      if (newRole) {
        await this.Role.findByIdAndDelete(newRole._id);
      }
      if (createdAssignments.length > 0) {
        await this.ResourceRole.deleteMany({
          _id: { $in: createdAssignments.map((ra) => ra._id) },
        });
      }
      throw error;
    }
  }

  async updateRole(id, name) {
    const existingRole = await this.Role.findById(id);
    if (!existingRole) {
      throw new NotFoundError("role");
    }

    const originalRole = { ...existingRole.toObject() };

    try {
      existingRole.name = name;
      await existingRole.save();
      return existingRole;
    } catch (error) {
      await this.Role.findByIdAndUpdate(id, originalRole);
      throw error;
    }
  }

  async assignResourceToRole(resourceId, roleId) {
    if (
      !mongoose.Types.ObjectId.isValid(resourceId) ||
      !mongoose.Types.ObjectId.isValid(roleId)
    ) {
      throw new BaseError("El ID proporcionado no es un ObjectId válido.");
    }
    const existingResource = await this.Resource.findById(resourceId);
    const existingRole = await this.Role.findById(roleId);

    if (!existingResource) {
      throw new NotFoundError("resourceId.");
    }
    if (!existingRole) {
      throw new NotFoundError("roleId.");
    }

    const existingAssignment = await this.ResourceRole.findOne({
      resourceId,
      roleId,
    });
    if (existingAssignment) {
      throw new DuplicateError("resource-rol.");
    }

    let assignment;
    try {
      assignment = new this.ResourceRole({ resourceId, roleId });
      await assignment.save();
      return assignment;
    } catch (error) {
      if (assignment) {
        await this.ResourceRole.findByIdAndDelete(assignment._id);
      }
      throw error;
    }
  }

 async deleteResourceRoleAssignment(id) {
    const assignment = await this.ResourceRole.findById(id);
    if (!assignment) {
      throw new NotFoundError("Asignación no encontrada.");
    }

    let originalAssignment = { ...assignment.toObject() };
    try {
      await assignment.deleteOne();
      return assignment;
    } catch (error) {
      await this.ResourceRole.create(originalAssignment);
      throw error;
    }
  }

  async getResourceByName(name) {
    const resource = await this.Resource.findOne({ name });
    if (!resource) {
      throw new NotFoundError(`Recurso no encontrado con el nombre: ${name}`);
    }
    return resource;
  }

  async checkAccess(roleId, resourceName) {
    const resource = await this.getResourceByName(resourceName);
    if (!resource) {
      throw new NotFoundError(
        `Recurso no encontrado con el nombre: ${resourceName}`
      );
    }

    const permission = await this.ResourceRole.findOne({
      resourceId: resource._id,
      roleId,
    });

    return !!permission;
  }
}

module.exports = RoleService;
