const { Sequelize } = require("sequelize");
const config = require("./config");

let sequelize;

try {
  sequelize = new Sequelize(
    config.development.database,
    config.development.username,
    config.development.password,
    {
      host: config.development.host,
      dialect: config.development.dialect,
    }
  );
} catch (error) {
  console.error("Error creating Sequelize instance:", error);
}

module.exports = sequelize;

