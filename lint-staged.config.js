"use strict"; // eslint-disable-line lines-around-directive, strict

module.exports = {
    "*.{js,jsx,babel}": ["eslint --fix", "git add"],
    "*.{md,markdown,mdown,mkdn,mkd,mdwn,mkdown,ron}": [
        "remark -f -q",
        "git add"
    ]
};
