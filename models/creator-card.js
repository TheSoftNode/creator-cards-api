const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator_cards';

/**
 * @typedef {Object} CreatorCard
 * @property {String} _id - ULID identifier
 * @property {String} title - Card title (3-100 characters)
 * @property {String} description - Optional description (max 500 characters)
 * @property {String} slug - Unique slug (5-50 characters)
 * @property {String} creator_reference - Exactly 20 characters
 * @property {Array} links - Array of link objects
 * @property {Object} service_rates - Service rates with currency and rates array
 * @property {String} status - 'draft' or 'published'
 * @property {String} access_type - 'public' or 'private'
 * @property {String} access_code - Exactly 6 alphanumeric characters (required if private)
 * @property {Number} created - Unix epoch milliseconds
 * @property {Number} updated - Unix epoch milliseconds
 * @property {Number} deleted - Unix epoch milliseconds or null
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  title: { type: SchemaTypes.String, required: true },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, required: true, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String, required: true, index: true },
  links: { type: SchemaTypes.Mixed, default: [] },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String, required: true, enum: ['draft', 'published'] },
  access_type: { type: SchemaTypes.String, required: true, enum: ['public', 'private'], default: 'public' },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
  deleted: { type: SchemaTypes.Number, default: null },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

/** @type {CreatorCard} */
module.exports = DatabaseModel.model(modelName, modelSchema);
