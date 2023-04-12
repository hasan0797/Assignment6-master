/*********************************************************************************
 *  WEB700 – Assignment 06
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Mahbubul Hasan Student ID: 161258215 Date: 4/11/2023
 * Cyclic: https://outstanding-cyan-octopus.cyclic.app/students
 *
 ********************************************************************************/
var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var path = require("path");
var cd = require("./modules/collegeData.js");
var expressHBS = require("express-handlebars");

// engine
app.engine(
  "hbs",
  expressHBS.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute
            ? ' class="nav-item active" '
            : ' class="nav-item" ') +
          '><a class="nav-link" href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
    },
  })
);

// specify the 'view engine' -> hbs
app.set("view engine", "hbs");

// navigation bar
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  next();
});

// Add the middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET /students
app.get("/students", async (req, res) => {
  try {
    if (req.query.course) {
      const course = parseInt(req.query.course);
      if (isNaN(course) || course < 1) {
        throw new Error("Invalid course number");
      }
      const students = await cd.getStudentsByCourse(course);
      res.render("students", { students });
    } else {
      const students = await cd.getAllStudents();
      res.render("students", { students });
    }
  } catch (err) {
    res.render("students", { message: "no results" });
  }
});

// GET /tas
app.get("/tas", async (req, res) => {
  try {
    // get and show all managers using our getTAs() function
    const managers = await cd.getTAs();
    res.json(managers);
  } catch (error) {
    // show 'no result' message, in case of no data collected
    res.json({ message: "no result" });
  }
});

// GET /courses
app.get("/courses", async (req, res) => {
  try {
    const courses = await cd.getCourses();
    res.render("courses", { courses });
  } catch (err) {
    res.render("courses", { message: "no results" });
  }
});

// GET /course/var
app.get("/course/:Cid", async (req, res) => {
  try {
    const num = parseInt(req.params.Cid);
    const course = await cd.getCourseById(num);
    res.render("course", { course: course });
  } catch (err) {
    res.render("course", { message: "no results" });
  }
});

// GET /student/num
app.get("/student/:studentNum", (req, res) => {
  // initialize an empty object to store the values
  let viewData = {};

  cd.getStudentByNum(req.params.studentNum)
    .then((cd) => {
      if (cd) {
        viewData.student = cd; //store student data in the "viewData" object as "student"
      } else {
        viewData.student = null; // set student to null if none were returned
      }
    })
    .catch(() => {
      viewData.student = null; // set student to null if there was an error
    })
    .then(cd.getCourses)
    .then((cd) => {
      viewData.courses = cd; // store course data in the "viewData" object as "courses"

      // loop through viewData.courses and once we have found the courseId that matches
      // the student's "course" value, add a "selected" property to the matching
      // viewData.courses object

      for (let i = 0; i < viewData.courses.length; i++) {
        if (viewData.courses[i].courseId == viewData.student.course) {
          viewData.courses[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.courses = []; // set courses to empty if there was an error
    })
    .then(() => {
      if (viewData.student == null) {
        // if no student - return an error
        res.status(404).send("Student Not Found");
      } else {
        res.render("student", { viewData: viewData }); // render the "student" view
      }
    });
});

app.get("/students/delete/:studentNum", (req, res) => {
  const studentNum = req.params.studentNum;
  cd.deleteStudentByNum(studentNum)
    .then(() => {
      res.redirect("/students");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Student not found");
    });
});


// setup a 'route' to listen on the default url path
// GET / 'home'
app.get("/", (req, res) => {
  res.render("home");
});

// GET /about
app.get("/about", (req, res) => {
  res.render("about");
});

// GET /htmlDemo
app.get("/htmlDemo", (req, res) => {
  res.render("htmlDemo");
});

app.get("/students/add", (req, res) => {
  cd.getCourses()
    .then((data) => {
      res.render("addStudent", { courses: data });
    })
    .catch((err) => {
      console.log(err);
      res.render("addStudent", { courses: [] });
    });
});

// Post route for adding a student
app.post("/students/add", function (req, res) {
  // Get student data from req.body
  const studentData = req.body;
  // Call addStudent function with studentData
  cd.addStudent(studentData)
    .then(function () {
      // Redirect to /students on successful resolution
      res.redirect("/students");
    })
    .catch(function (error) {
      // Handle error
      console.log(error);
      res.send(error);
    });
});

//Post route for updating a student
app.post("/student/update", async (req, res) => {
  const updStudent = req.body;
  await cd
    .updateStudent(updStudent)
    .then(() => res.redirect("/students"))
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed");
    });
});

app.get("/student/delete/:studentNum", async (req, res) => {
  const studentNum = req.params.studentNum;

  try {
    await cd.deleteStudentByNum(studentNum);
    res.redirect("/students");
  } catch (error) {
    res.status(500).send("Unable to Remove Student / Student not found");
  }
});

app.get("/courses/add", (req, res) => {
  res.render("addCourse");
});

app.post("/courses/add", (req, res) => {
  const courseData = req.body;
  cd.addCourse(courseData)
    .then(() => {
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed");
    });
});

app.post("/course/update", async (req, res) => {
  const courseData = req.body;
  await cd.updateCourse(courseData)
    .then(() => {
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed");
    });
});

app.get("/course/:id", (req, res) => {
  const id = req.params.id;
  cd.getCourseById(id)
    .then((course) => {
      if (!course) {
        res.status(404).send("Course Not Found");
      } else {
        res.render("course", { course: course });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed");
    });
});

app.get("/course/delete/:id", (req, res) => {
  const id = req.params.id;
  cd.deleteCourseById(id)
    .then(() => {
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Unable to Remove Course / Course not found");
    });
});

// 'No matching route' if user input wrong URL path we send him a  status 404 'Page Not Found' message
app.use(function (req, res, next) {
  res.status(404).send("Page Not Found");
});

// setup http server to listen on HTTP_PORT
cd.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on port: " + HTTP_PORT);
    });
  })
  .catch((error) => {
    console.error(`Error initializing data: ${error}`);
  });
