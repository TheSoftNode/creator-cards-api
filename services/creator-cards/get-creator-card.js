const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCard } = require('@app/models');
const { CreatorCardMessages } = require('@app/messages');

async function getCreatorCard(slug, accessCode) {
  const card = await CreatorCard.findOne({ slug, deleted: null });

  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF02');
  }

  if (card.access_type === 'private' && !accessCode) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.FORBIDDEN, 'AC03');
  }

  if (card.access_type === 'private' && accessCode !== card.access_code) {
    throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.FORBIDDEN, 'AC04');
  }

  const response = card.toObject();
  response.id = response._id;
  delete response._id;
  delete response.__v;
  delete response.access_code;

  return {
    status: 'success',
    message: CreatorCardMessages.CARD_RETRIEVED,
    data: response,
  };
}

module.exports = getCreatorCard;
