const { Resource } = require("../models/resource.model");
const { connectToMongo } = require("../config/mongoConfig");
const NotFoundError = require("../exceptions/NotFoundError");
const DuplicateError = require("../exceptions/DuplicateError");

class ResourceService {
  constructor() {
    connectToMongo();
    this.resource = Resource;
  }

  async createResource(name) {
    const existingResource = await this.resource.findOne({ name: name });
    if (existingResource) {
      throw new DuplicateError(`recurso ${name}`);
    }

    let resource;
    try {
      resource = new Resource({ name });
      await resource.save();
      return resource;
    } catch (error) {
      if (resource) {
        await this.resource.findByIdAndDelete(resource._id);
      }
      throw error;
    }
  }
  
  async getResources(name, id) {
    let filters = {};
    if (name) {
      filters.name = name;
    }
    if (id) {
      filters._id = id;
    }
    const resources = await Resource.find(filters);
    return resources;
  }
}

module.exports = ResourceService;
