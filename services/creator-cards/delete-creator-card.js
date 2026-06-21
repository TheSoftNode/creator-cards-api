const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCard } = require('@app/models');
const { CreatorCardMessages } = require('@app/messages');

// VSL validation spec for delete creator card
const deleteCardSpec = `root {
  creator_reference string
}`;

const parsedSpec = validator.parse(deleteCardSpec);

async function deleteCreatorCard(slug, serviceData) {
  // Step 1: Validate input
  const data = validator.validate(serviceData, parsedSpec);

  // Validate creator_reference length
  if (data.creator_reference.length !== 20) {
    throwAppError('creator_reference must be exactly 20 characters', ERROR_CODE.BADREQUEST);
  }

  // Step 2: Find the card by slug (exclude already deleted cards)
  const card = await CreatorCard.findOne({ slug, deleted: null });

  // NF01: Card doesn't exist
  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF01');
  }

  // Step 3: Mark card as deleted (soft delete)
  const now = Date.now();
  card.deleted = now;
  card.updated = now;
  await card.save();

  // Step 4: Transform response (_id -> id, include access_code for delete response)
  const response = card.toObject();
  response.id = response._id;
  delete response._id;
  delete response.__v;

  return {
    status: 'success',
    message: CreatorCardMessages.CARD_DELETED,
    data: response,
  };
}

module.exports = deleteCreatorCard;
