const { randomBytes } = require('@app-core/randomness');
const { CreatorCard } = require('@app/models');

/**
 * Generate a slug from a title following the requirements:
 * 1. Lowercase the title
 * 2. Replace whitespace with hyphens
 * 3. Remove any characters that are not letters, numbers, hyphens, or underscores
 * 4. If result is < 5 characters OR already taken, append hyphen + random 6-char alphanumeric
 */
async function generateSlug(title) {
  let slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

  // Check if slug needs suffix (< 5 chars or already exists)
  const needsSuffix = slug.length < 5 || (await CreatorCard.findOne({ slug, deleted: null }));

  if (needsSuffix) {
    const suffix = randomBytes(3); // 3 bytes = 6 hex chars
    slug = `${slug}-${suffix}`;
  }

  return slug;
}

module.exports = generateSlug;
