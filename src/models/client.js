module.exports = (sequelize, DataTypes) => {
    const client = sequelize.define(
      "client",
      {
        id_client: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: DataTypes.STRING,
      },
      {
        tableName: "ssat_clients",
          timestamps: false
      }
    );
  
    return client;
  };