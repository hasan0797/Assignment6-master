const Sequelize = require("sequelize");
var sequelize = new Sequelize(
  "pekvdmob",
  "pekvdmob",
  "nIZKEK48tnjnGoxkx-MkCnZInp9P-uOO",
  {
    host: "ziggy.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Student = sequelize.define("student", {
  studentNum: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  addressStreet: Sequelize.STRING,
  addressCity: Sequelize.STRING,
  addressProvince: Sequelize.STRING,
  TA: Sequelize.BOOLEAN,
  status: Sequelize.STRING,
});

db.Course = sequelize.define("course", {
  courseId: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  courseCode: Sequelize.STRING,
  courseDescription: Sequelize.STRING,
});

db.Course.hasMany(db.Student, { foreignKey: "course" });
module.exports = { db, sequelize };

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject("unable to sync the database");
      });
  });
};

module.exports.getAllStudents = function () {
  return new Promise((resolve, reject) => {
    db.Student.findAll()
      .then((students) => {
        if (students.length == 0) {
          reject("no results returned");
          return;
        }
        resolve(students);
      })
      .catch((err) => {
        reject("unable to get students");
      });
  });
};

module.exports.getStudentsByCourse = function (course) {
  return new Promise(function (resolve, reject) {
    db.Student.findAll({
      where: {
        course: course,
      },
    })
      .then(function (filteredStudents) {
        if (filteredStudents.length == 0) {
          reject("No results returned");
          return;
        }

        resolve(filteredStudents);
      })
      .catch(function (err) {
        reject("Error retrieving students: " + err);
      });
  });
};

module.exports.getStudentByNum = function (num) {
  return new Promise(function (resolve, reject) {
    db.Student.findOne({
      where: {
        studentNum: num,
      },
    })
      .then(function (foundStudent) {
        if (!foundStudent) {
          reject("No results returned");
          return;
        }
        resolve(foundStudent);
      })
      .catch(function (err) {
        reject(err);
      });
  });
};

module.exports.getCourses = function () {
  return new Promise((resolve, reject) => {
    db.Course.findAll()
      .then((courses) => {
        if (courses.length == 0) {
          reject("No results returned");
          return;
        }
        resolve(courses);
      })
      .catch((error) => {
        reject("Error retrieving courses: " + error.message);
      });
  });
};

module.exports.getCourseById = function (id) {
  return new Promise((resolve, reject) => {
    db.Course.findAll({ where: { courseId: id } })
      .then((courses) => {
        if (courses.length > 0) {
          resolve(courses[0]);
        } else {
          reject("no results");
        }
      })
      .catch((err) => {
        reject(err.message);
      });
  });
};

module.exports.addStudent = function (studentData) {
  return new Promise(function (resolve, reject) {
    db.Student.findAll()
      .then((students) => {
        studentData.studentNum = students.length + 1;
        studentData.TA = studentData.TA !== undefined;
        for (let prop in studentData) {
          if (studentData.hasOwnProperty(prop) && studentData[prop] === "") {
            studentData[prop] = null;
          }
        }
        db.Student.create(studentData)
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject("unable to create student");
          });
      })
      .catch((err) => {
        reject("unable to retrieve students");
      });
  });
};

module.exports.updateStudent = async function (studentData) {
  try {
    for (const prop in studentData) {
      if (studentData[prop] === "") {
        studentData[prop] = null;
      }
    }
    studentData.isTA = studentData.isTA !== undefined;
    const result = await db.Student.update(studentData, {
      where: { studentNum: studentData.studentNum },
    });
    if (result[0] === 0) {
      throw new Error(
        `Could not find student with studentNum ${studentData.studentNum}`
      );
    }
  } catch (error) {
    throw new Error(`Unable to update student: ${error.message}`);
  }
};

module.exports.addCourse = function (courseData) {
  return new Promise(function (resolve, reject) {
    for (let prop in courseData) {
      if (courseData.hasOwnProperty(prop) && courseData[prop] === "") {
        courseData[prop] = null;
      }
    }
    db.Course.findAll()
      .then((courses) => {
        courseData.courseID = courses.length + 1;
        db.Course.create(courseData).then(() => {
          resolve();
        });
      })
      .catch((err) => {
        reject("Unable to create course");
      });
  });
};

module.exports.updateCourse = function (courseData) {
  return new Promise(function (resolve, reject) {
    db.Course.findOne({ where: { courseId: courseData.courseId } })
      .then((course) => {
        if (!course) {
          reject(
            new Error(
              `Could not find course with courseId ${courseData.courseId}`
            )
          );
          return;
        }
        for (let prop in courseData) {
          if (courseData.hasOwnProperty(prop) && courseData[prop] === "") {
            courseData[prop] = null;
          }
        }
        db.Course.update(courseData, {
          where: { courseId: courseData.courseId },
        })
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject("unable to update course");
          });
      })
      .catch((err) => {
        reject("unable to find course");
      });
  });
};

module.exports.deleteCourseById = function (id) {
  return new Promise(function (resolve, reject) {
    db.Course.destroy({ where: { courseId: id } })
      .then((numDeleted) => {
        if (numDeleted === 1) {
          resolve();
        } else {
          reject(new Error(`Failed to delete course with id ${id}`));
        }
      })
      .catch((err) => {
        reject(new Error(`Failed to delete course with id ${id}: ${err}`));
      });
  });
};

module.exports.deleteStudentByNum = function (studentNum) {
  return new Promise(function (resolve, reject) {
    db.Student.destroy({ where: { studentNum: studentNum } })
      .then((numDeleted) => {
        if (numDeleted === 1) {
          resolve();
        } else {
          reject(
            new Error(
              `Failed to delete student with student number ${studentNum}`
            )
          );
        }
      })
      .catch((err) => {
        reject(
          new Error(
            `Failed to delete student with student number ${studentNum}: ${err}`
          )
        );
      });
  });
};
