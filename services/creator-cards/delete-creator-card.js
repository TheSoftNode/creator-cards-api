const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCard } = require('@app/models');
const { CreatorCardMessages } = require('@app/messages');

const deleteCardSpec = `root {
  creator_reference string
}`;

const parsedSpec = validator.parse(deleteCardSpec);

async function deleteCreatorCard(slug, serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  if (data.creator_reference.length !== 20) {
    throwAppError('creator_reference must be exactly 20 characters', ERROR_CODE.BADREQUEST);
  }

  const card = await CreatorCard.findOne({ slug, deleted: null });

  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF01');
  }

  const now = Date.now();
  card.deleted = now;
  card.updated = now;
  await card.save();

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
