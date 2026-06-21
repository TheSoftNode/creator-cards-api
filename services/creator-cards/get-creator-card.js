const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCard } = require('@app/models');
const { CreatorCardMessages } = require('@app/messages');

/**
 * Retrieves a creator card by slug with access control rules
 * Access rules applied in order:
 * 1. Card doesn't exist -> NF01 (404)
 * 2. Card is draft -> NF02 (404)
 * 3. Card is private without access_code -> AC03 (403)
 * 4. Card is private with wrong access_code -> AC04 (403)
 * 5. Otherwise -> return card (200)
 */
async function getCreatorCard(slug, accessCode) {
  // Step 1: Find the card by slug (exclude deleted cards)
  const card = await CreatorCard.findOne({ slug, deleted: null });

  // Rule 1: NF01 - Card doesn't exist
  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF01');
  }

  // Rule 2: NF02 - Card exists but is draft (not publicly retrievable)
  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF02');
  }

  // Rule 3: AC03 - Card is private and no access_code provided
  if (card.access_type === 'private' && !accessCode) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.FORBIDDEN, 'AC03');
  }

  // Rule 4: AC04 - Card is private and wrong access_code provided
  if (card.access_type === 'private' && accessCode !== card.access_code) {
    throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.FORBIDDEN, 'AC04');
  }

  // Step 2: Transform response (_id -> id, omit access_code)
  const response = card.toObject();
  response.id = response._id;
  delete response._id;
  delete response.__v;
  delete response.access_code; // NEVER return access_code on retrieval

  return {
    status: 'success',
    message: CreatorCardMessages.CARD_RETRIEVED,
    data: response,
  };
}

module.exports = getCreatorCard;
