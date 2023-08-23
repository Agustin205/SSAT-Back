module.exports = (sequelize, DataTypes) => {
    const history = sequelize.define(
      "history",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: DataTypes.INTEGER,
        object: DataTypes.STRING,
        field: DataTypes.STRING,
        von: DataTypes.STRING,
        vot: DataTypes.STRING,
        switch: DataTypes.STRING,
        lote: DataTypes.INTEGER,
        csv: DataTypes.STRING,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE
      },
      {
        tableName: "ssat_consult_history"
      }
    );
  
    history.associate = (models) => {
        history.belongsTo(models.User, { foreignKey: "user_id" });
        history.belongsTo(models.Lote, { foreignKey: "lote" });
    };
  
    return history;
  };