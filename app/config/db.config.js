const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 20000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
    retry: {
      max: 3,
    },
    logging: (msg) => console.log(`[Sequelize]: ${msg}`),
  },
  
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

module.exports = sequelize;
