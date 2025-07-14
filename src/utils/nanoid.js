const { nanoid } = require('nanoid');

function generateShortId() {
  return nanoid(8);
}

module.exports = { generateShortId }; 