const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { ulid } = require('@app-core/randomness');
const { CreatorCard } = require('@app/models');
const { CreatorCardMessages } = require('@app/messages');
const generateSlug = require('./generate-slug');

// VSL validation spec for create creator card
const createCardSpec = `root {
  title string
  description? string
  slug? string
  creator_reference string
  links? []
  service_rates? {
    currency string
    rates []
  }
  status string
  access_type? string
  access_code? string
}`;

const parsedSpec = validator.parse(createCardSpec);

async function createCreatorCard(serviceData) {
  // Step 1: Validate with VSL
  const data = validator.validate(serviceData, parsedSpec);

  // Step 2: Additional field-level validations
  // Title: 3-100 characters
  if (data.title.length < 3 || data.title.length > 100) {
    throwAppError('Title must be between 3 and 100 characters', ERROR_CODE.BADREQUEST);
  }

  // Description: max 500 characters
  if (data.description && data.description.length > 500) {
    throwAppError('Description cannot exceed 500 characters', ERROR_CODE.BADREQUEST);
  }

  // Creator reference: exactly 20 characters
  if (data.creator_reference.length !== 20) {
    throwAppError('creator_reference must be exactly 20 characters', ERROR_CODE.BADREQUEST);
  }

  // Status: must be 'draft' or 'published'
  if (!['draft', 'published'].includes(data.status)) {
    throwAppError('status must be either "draft" or "published"', ERROR_CODE.BADREQUEST);
  }

  // Access type: default to 'public' if not provided
  const accessType = data.access_type || 'public';
  if (!['public', 'private'].includes(accessType)) {
    throwAppError('access_type must be either "public" or "private"', ERROR_CODE.BADREQUEST);
  }

  // Step 3: Business rule validations for access_code
  // AC01: access_code is required when access_type is private
  if (accessType === 'private' && !data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED_FOR_PRIVATE, ERROR_CODE.BADREQUEST, 'AC01');
  }

  // AC05: access_code must not be set on public cards
  if (accessType === 'public' && data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED_ON_PUBLIC, ERROR_CODE.BADREQUEST, 'AC05');
  }

  // Validate access_code format if provided
  if (data.access_code) {
    if (data.access_code.length !== 6 || !/^[a-zA-Z0-9]{6}$/.test(data.access_code)) {
      throwAppError('access_code must be exactly 6 alphanumeric characters', ERROR_CODE.BADREQUEST);
    }
  }

  // Step 4: Validate slug if provided, or generate one
  let slug;
  if (data.slug) {
    // Validate provided slug
    if (data.slug.length < 5 || data.slug.length > 50) {
      throwAppError('slug must be between 5 and 50 characters', ERROR_CODE.BADREQUEST);
    }
    if (!/^[a-z0-9_-]+$/.test(data.slug)) {
      throwAppError('slug can only contain letters, numbers, hyphens and underscores', ERROR_CODE.BADREQUEST);
    }

    // SL02: Check if slug is already taken
    const existingCard = await CreatorCard.findOne({ slug: data.slug, deleted: null });
    if (existingCard) {
      throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.BADREQUEST, 'SL02');
    }
    slug = data.slug;
  } else {
    // Auto-generate slug from title
    slug = await generateSlug(data.title);
  }

  // Step 5: Validate links if provided
  if (data.links) {
    if (!Array.isArray(data.links)) {
      throwAppError('links must be an array', ERROR_CODE.BADREQUEST);
    }
    data.links.forEach((link, index) => {
      if (!link.title || link.title.length < 1 || link.title.length > 100) {
        throwAppError(`links[${index}].title must be between 1 and 100 characters`, ERROR_CODE.BADREQUEST);
      }
      if (!link.url || link.url.length > 200) {
        throwAppError(`links[${index}].url must not exceed 200 characters`, ERROR_CODE.BADREQUEST);
      }
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        throwAppError(`links[${index}].url must start with http:// or https://`, ERROR_CODE.BADREQUEST);
      }
    });
  }

  // Step 6: Validate service_rates if provided
  if (data.service_rates) {
    const validCurrencies = ['NGN', 'USD', 'GBP', 'GHS'];
    if (!validCurrencies.includes(data.service_rates.currency)) {
      throwAppError('currency must be one of: NGN, USD, GBP, GHS', ERROR_CODE.BADREQUEST);
    }

    if (!data.service_rates.rates || !Array.isArray(data.service_rates.rates) || data.service_rates.rates.length === 0) {
      throwAppError('service_rates.rates must be a non-empty array', ERROR_CODE.BADREQUEST);
    }

    data.service_rates.rates.forEach((rate, index) => {
      if (!rate.name || rate.name.length < 3 || rate.name.length > 100) {
        throwAppError(`service_rates.rates[${index}].name must be between 3 and 100 characters`, ERROR_CODE.BADREQUEST);
      }
      if (!rate.description || rate.description.length > 250) {
        throwAppError(`service_rates.rates[${index}].description must not exceed 250 characters`, ERROR_CODE.BADREQUEST);
      }
      if (!Number.isInteger(rate.amount) || rate.amount < 1) {
        throwAppError(`service_rates.rates[${index}].amount must be a positive integer (minimum 1)`, ERROR_CODE.BADREQUEST);
      }
    });
  }

  // Step 7: Create the card
  const now = Date.now();
  const cardData = {
    _id: ulid(),
    title: data.title,
    description: data.description || undefined,
    slug,
    creator_reference: data.creator_reference,
    links: data.links || [],
    service_rates: data.service_rates || undefined,
    status: data.status,
    access_type: accessType,
    access_code: data.access_code || null,
    created: now,
    updated: now,
    deleted: null,
  };

  let createdCard;
  try {
    createdCard = await CreatorCard.create(cardData);
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.BADREQUEST, 'SL02');
    }
    throw error;
  }

  // Step 8: Transform response (_id -> id)
  const response = createdCard.toObject();
  response.id = response._id;
  delete response._id;
  delete response.__v;

  return {
    status: 'success',
    message: CreatorCardMessages.CARD_CREATED,
    data: response,
  };
}

module.exports = createCreatorCard;
