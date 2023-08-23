module.exports = (sequelize, DataTypes) => {
    const Lote = sequelize.define(
      "Lote",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: DataTypes.STRING,
        fk_client: DataTypes.INTEGER
      },
      {
        tableName: "ssat_lote",
          timestamps: false
      }
    );
    Lote.associate = (models) => {
      Lote.belongsTo(models.client, { foreignKey: "fk_client" });
    };
    return Lote;
  };