module.exports = {
  "*.{ts,js,json}": ["biome check --write --no-errors-on-unmatched", "git add"],
};
