const { randomBytes } = require('@app-core/randomness');
const { CreatorCard } = require('@app/models');

async function generateSlug(title) {
  let slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

  // append suffix if too short or slug already exists
  const needsSuffix = slug.length < 5 || (await CreatorCard.findOne({ slug, deleted: null }));

  if (needsSuffix) {
    const suffix = randomBytes(3);
    slug = `${slug}-${suffix}`;
  }

  return slug;
}

module.exports = generateSlug;
