const bcrypt = require("bcryptjs");

const salt = 10;

exports.getHash = (password) => bcrypt.hash(password, salt);
