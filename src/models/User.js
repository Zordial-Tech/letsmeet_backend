module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
      id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
      },
      first_name: {
          type: DataTypes.STRING,
          allowNull: false
      },
      middle_name: {
          type: DataTypes.STRING,
          allowNull: true
      },
      last_name: {
          type: DataTypes.STRING,
          allowNull: false
      },
      username: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
      },
      email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
              isEmail: true
          }
      },
      password_hash: {
          type: DataTypes.STRING,
          allowNull: false
      },
      photo: {
          type: DataTypes.STRING,
          allowNull: true
      },
      role_id: {
          type: DataTypes.INTEGER,
          allowNull: false
      },
      attendees_role: {
          type: DataTypes.STRING,
          allowNull: false
      },
      linkedin_url: {  // ✅ New field added
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
              isUrl: true
          }
      },
      status: {
          type: DataTypes.ENUM("active", "inactive"),
          defaultValue: "active"
      },
      block_status: {
          type: DataTypes.ENUM("blocked", "unblocked"),
          defaultValue: "unblocked"
      },
      created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
      },
      updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
      }
  }, {
      tableName: "Users",
      timestamps: false
  });

  return User;
};
