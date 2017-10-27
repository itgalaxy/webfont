"use strict";

module.exports = {
  "*.{js,jsx}": ["prettier --list-different", "eslint", "git add"],
  "*.{md,markdown,mdown,mkdn,mkd,mdwn,mkdown,ron}": ["remark -f -q", "git add"]
};
