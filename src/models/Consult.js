module.exports = (sequelize, DataTypes) => {
  const Consult = sequelize.define(
    "Consult",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      object: DataTypes.STRING,
      field: DataTypes.STRING,
      von: DataTypes.STRING,
      vot: DataTypes.STRING,
      switch: DataTypes.STRING,
      client: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      tableName: "ssat_consult",
    }
  );

  Consult.associate = (models) => {
    Consult.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Consult;
};
