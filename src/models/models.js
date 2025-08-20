require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('HorshevskaDyplom409', '', '',{
    dialect: 'mssql',
    host: 'localhost',
    dialectOptions: {
      driver: 'msnodesqlv8',
      connectionString: '',
    },
});

const User = sequelize.define('users', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    name: { type: Sequelize.STRING, allowNull: false},
    surname: { type: Sequelize.STRING, allowNull: true },
    email: { type: DataTypes.STRING, unique: true, primaryKey: true, allowNull: false,},
    password: { type: Sequelize.STRING, allowNull: false },
  }, { timestamps: false });

const Course = sequelize.define('courses', {
    id: { type: DataTypes.STRING, primaryKey: true},
    name: { type: DataTypes.STRING, allowNull: false},
    description: DataTypes.TEXT,
    image_path: { type: DataTypes.STRING },
    rating: { type: DataTypes.FLOAT, validate: { min: 0, max: 200 } },
    teacher_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: 'email'
      }
    },
  }, { timestamps: false });

const Course_Student = sequelize.define('course_students', {
    course_id : { 
      type: DataTypes.STRING,
      references: {
        model: Course,
        key: 'id'
      },
    },
    user_id : {
      type: DataTypes.STRING,
      references: {
        model: User,
        key: 'email'
      },
    },
  }, { timestamps: false });

const Homework = sequelize.define('homework', {
    id: { type: DataTypes.STRING, primaryKey: true},
    title: {type: DataTypes.STRING, allowNull: false},
    description: DataTypes.TEXT,
    due_date: DataTypes.TEXT,
    course_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Course,
        key: 'id'
      }
    },
    attachments: DataTypes.TEXT,
}, { timestamps: false });

const PassedHomework = sequelize.define('passedHomeworks', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  homework_id: {
    type: DataTypes.STRING,
    references: {
      model: Homework,
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.STRING,
    references: {
      model: User,
      key: 'email'
    }
  },
  submission_date : DataTypes.STRING,
  attachments: DataTypes.STRING,
  grade: DataTypes.INTEGER,
  status: {type: Sequelize.STRING, allowNull: false},
  teacher_comment: DataTypes.TEXT,
}, { timestamps: false });

Course.belongsTo(User, { foreignKey: 'teacher_id', targetKey: 'email', as: 'teacher' });
User.hasMany(Course, { foreignKey: 'teacher_id', sourceKey: 'email' });

Course.hasMany(Homework, { foreignKey: 'course_id' });
Homework.belongsTo(Course, { foreignKey: 'course_id' });

PassedHomework.belongsTo(User, { foreignKey: 'student_id', targetKey: 'email', as: 'student' });
User.hasMany(PassedHomework, { foreignKey: 'student_id', sourceKey: 'email', as: 'submissions' });

Homework.hasMany(PassedHomework, { foreignKey: 'homework_id' });
PassedHomework.belongsTo(Homework, { foreignKey: 'homework_id' });

Course.belongsToMany(User, { through: Course_Student, foreignKey: 'course_id', otherKey: 'user_id',});
User.belongsToMany(Course, { through: Course_Student, foreignKey: 'user_id', otherKey: 'course_id',});

module.exports = {User, Course, Course_Student, Homework, PassedHomework, sequelize};