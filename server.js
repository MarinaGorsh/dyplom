const {uploadCourseImage, deleteCourseFolder, streamCourseImage, uploadHomeworkFile, streamHomeworkFile, deleteHomeworkFile, uploadPassedHomeworkFile, streamPassedHomeworkFile} = require('./storage')
const {getUserFromToken} = require('./src/getUserFromToken')
const {User, Course, Course_Student, Homework, PassedHomework, sequelize} = require("./src/models/models")
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
require('dotenv').config();

const memoryStorage = multer.memoryStorage();

const upload = multer({ storage: memoryStorage });

const bodyParser = require('body-parser');
const { message } = require('antd');
const app = express();
app.use(cors({
  origin: 'http://localhost:3001'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

const generateId = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};




app.post('/register', async (req, res) => {
  const { name, surname, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send('A user with this email already exists.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, surname, email, password: hashedPassword, });
    
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Error during registration');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Incorrect password');
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET_KEY, 
      { expiresIn: '1h' }
    );
    console.log('Generated Token:', token);

    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/joinCourse', async (req, res) => {
  const { courseCode } = req.body;
  try {
    const userId = getUserFromToken(req);
    
    const existingEntry = await Course_Student.findOne({
      where: { course_id: courseCode, user_id: userId },
    });
    if (existingEntry) {
      return res.status(400).json({ message: 'User already in' });
    }
    
    await Course_Student.create({
      course_id: courseCode,
      user_id: userId,
    });
    res.status(200).json({ message: 'User successfully joined the course' });
  } catch (error) {
    console.error('Error joining course:', error);
    res.status(500).json({ message: 'Error joining course' });
  }
});

app.post('/leaveCourse', async (req, res) => {
  const { courseCode } = req.body;
  try {
    const userId = getUserFromToken(req);

    const courseStudent = await Course_Student.findOne({
      where: {
        course_id: courseCode,
        user_id: userId,
      }
    });
    
    if (courseStudent) {
      await courseStudent.destroy();
      res.status(200).json({ message: 'User successfully left the course' });
    } else {
      res.status(400).json({ message: 'User is not enrolled in this course' });
    }
  } catch (error) {
    console.error('Error leaving course:', error);
    res.status(500).json({ message: 'Error leaving course' });
  }
});




app.get('/course-image/:courseCode/:filename', async (req, res) => {
  const { courseCode, filename } = req.params;
  try {
    await streamCourseImage(courseCode, filename, res);
  } catch (err) {
    console.error('Error reading image from GCS:', err.message);
    res.status(500).send('Error reading image');
  }
});


app.get('/homeworks/:courseCode/:filename', async (req, res) => {
  const { courseCode, filename } = req.params;
  try {
    await streamHomeworkFile(courseCode, filename, res);
  } catch (err) {
    console.error('Error streaming homework file:', err);
    res.status(500).send('Error reading file');
  }
});

app.get('/passedHomeworks/:courseCode/:homeworkId/:studentEmail/:filename', async (req, res) => {
  const { courseCode, homeworkId, studentEmail, filename } = req.params;
  try {
    await streamPassedHomeworkFile(courseCode, filename, homeworkId, studentEmail, res);
  } catch (err) {
    console.error('Error streaming homework file:', err);
    res.status(500).send('Error reading file');
  }
});


app.get('/courses', async (req, res) => {
  try {
    const teacherId = getUserFromToken(req);

    const teacherCourses  = await Course.findAll({ where: { teacher_id: teacherId  } });
    const studentCourses = await User.findOne({
      where: { email: teacherId },
      include: {
        model: Course,
        through: {
          model: Course_Student,
          attributes: []
        },
        attributes: ['id', 'name', 'description', 'image_path', 'rating', 'teacher_id'],
      }
    });
    
    const allCourses = [...teacherCourses, ...studentCourses.courses].map(course => ({
      ...course.dataValues,
      image: course.image_path || null
    }));

    res.json(allCourses);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/course/:id', async (req, res) => {
  const courseCode = req.params.id;
  const userEmail = getUserFromToken(req);

  try {
    const course = await Course.findOne({ where: { id: courseCode }});
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const isTeacher = course.teacher_id === userEmail;
    const isStudent = await Course_Student.findOne({
      where: {
        course_id: courseCode,
        user_id: userEmail
      }
    });

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/courses', upload.single('image'), async (req, res) => {
  const { name, description, rating } = req.body;
  try {
    const teacherId = getUserFromToken(req);
    if (!teacherId) {
      return res.status(403).json({ message: 'Failed to extract teacher email from token' });
    }
    const image = req.file;
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const courseCode = generateId()
    const imageName = `${Date.now()}_${image.originalname}`;
    const imageUrl = await uploadCourseImage(image.buffer, imageName, courseCode);
    await Course.create({id: courseCode, name, description, image_path: imageUrl, rating, teacher_id: teacherId});
    res.status(201).send('Course added successfully');
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/courses/:id', async (req, res) => {
   const courseCode = req.params.id;
   try {
    const teacherId = getUserFromToken(req);
    if (!teacherId) {
      return res.status(403).json({ message: 'Failed to extract teacher email from token' });
    }
    
    const course = await Course.findOne({ where: { id: courseCode } });
    if (course.teacher_id !== teacherId) {
      return res.status(403).json({ message: 'You are not the owner of this course' });
    }
    await deleteCourseFolder(course.id);
    const homeworks = await Homework.findAll({ where: { course_id: courseCode } });
    const homeworkIds = homeworks.map(hw => hw.id);
    
    await PassedHomework.destroy({ where: { homework_id: homeworkIds } });
    await Homework.destroy({ where: { course_id: courseCode } });
    await Course_Student.destroy({ where: { course_id: courseCode } });

    await course.destroy();
    return res.status(200).json({ message: 'The course has been successfully deleted' });

  } catch (error) {
    console.error('Error deliting course:', error);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/homeworks/:course_id', async (req, res) => {
  try {
    const course_id = req.params.course_id;

    const homeworks = await Homework.findAll({ where: { course_id } });

    res.json(homeworks);
  } catch (error) {
    console.error('Error fetching homeworks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/homework/:id', async (req, res) => {
  const homeworkId = req.params.id;
  const userEmail = getUserFromToken(req);

  try {
    const homework = await Homework.findOne({
      where: { id: homeworkId }, include: [{model: Course}]
    });

    const isTeacher = homework.course.teacher_id === userEmail;
    const isStudent = await Course_Student.findOne({
      where: {
        course_id: homework.course_id,
        user_id: userEmail
      }
    });

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({...homework.toJSON(),
      teacherEmail: homework.course?.teacher_id || null,
      files: homework.attachments ? JSON.parse(homework.attachments).map((url) => ({url, name: url.split('/').pop(), courseCode: url.split('/')[4]})) : []
    });

  } catch (error) {
    console.error('Error fetching homework:', error);
    res.status(500).send('Internal Server Error');
  }
});

function formatDateToSQL(dateString) {
  return `${dateString} 23:59:00`;
}

app.post('/homework', upload.array('attachments'), async (req, res) => {
  const { title, description, due_date, course_id } = req.body;
  try {
    const files = req.files;
    const attachments = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadHomeworkFile(file.buffer, file.originalname, course_id);
        attachments.push(url);
      }
    }
    const dueDateStr = formatDateToSQL(due_date); 

    await Homework.create({
      id: generateId(),
      title,
      description,
      due_date: dueDateStr,
      course_id,
      attachments: JSON.stringify(attachments) 
    });

    res.status(201).send('Homework added successfully');
  } catch (error) {
    console.error('Error creating homework:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/homeworks/:id', async (req, res) => {
 try {
    const homework = await Homework.findByPk(req.params.id);
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    const teacherId = getUserFromToken(req);
    const course = await Course.findByPk(homework.course_id);

    if (!course || course.teacher_id !== teacherId) {
      return res.status(403).json({ message: 'You are not the owner of this course' });
    }

    if (homework.attachments) {
      const attachments = JSON.parse(homework.attachments);
      for (const url of attachments) {
        await deleteHomeworkFile(url);
      }
    }
    await PassedHomework.destroy({
      where: { homework_id: homework.id }
    });

    await homework.destroy();
    res.status(200).json({ message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Error deleting homework:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});




app.get('/passedHomeworks/:id', async (req, res) => {
  const homeworkId = req.params.id;

  try {
    const homework = await Homework.findByPk(homeworkId);
    const courseId = homework.course_id;

    const students = await User.findAll({
      include: [{
        model: Course,
        where: { id: courseId },
        through: { attributes: [] }
      }],
    });
   const teacher = await Course.findOne({where: { id: courseId }});

    const passedHomeworks = await PassedHomework.findAll({
      where: { homework_id: homeworkId },
      include: [{ model: User, as: 'student', attributes: ['email'] }]
    });

    const passedMap = new Map();
    passedHomeworks.forEach(phw => {
      passedMap.set(phw.student_id, phw);
    });

    const results = students.map(student => {
      const phw = passedMap.get(student.email);

    return {
      id: phw?.id ?? null,
      name: student.name,
      surname: student.surname,
      studentEmail: student.email,
      status: phw ? (phw.grade != null ? 'checked' : 'submitted') : 'not_submitted',
      grade: phw?.grade ?? null,
      teacherEmail: teacher.teacher_id,
    };
  });

  res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Err' });
  }
});

app.get('/passedHomework/:id', async (req, res) => {
  const homeworkId = req.params.id;
  const studentEmail = getUserFromToken(req);

  try {
    const homework = await PassedHomework.findOne({
      where: { homework_id: homeworkId, student_id: studentEmail }
    });

    if (!homework) {
      return res.status(200).json({ submitted: false });
    }

     return res.status(200).json({
      submitted: true,
      files: JSON.parse(homework.attachments).map((url) => ({url, name: url.split('/').pop(), courseCode: url.split('/')[4], homeworkId: url.split('/')[6], studentEmail: url.split('/')[7]})),
      homeworkId: homeworkId,
      grade: homework.grade,
      teacher_comment: homework.teacher_comment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Err' });
  }
});

app.get('/passedHomework/:stid/:id', async (req, res) => {
  const homeworkId = req.params.id;
  const studentEmail = req.params.stid;
  const teacherEmail = getUserFromToken(req);

  try {
    const homework = await PassedHomework.findOne({
      where: { homework_id: homeworkId, student_id: studentEmail }
    });

    if (!homework) {
      return res.status(200).json({ submitted: false });
    }

     return res.status(200).json({
      submitted: true,
      files: JSON.parse(homework.attachments).map((url) => ({url, name: url.split('/').pop(), courseCode: url.split('/')[4], homeworkId: url.split('/')[6], studentEmail: url.split('/')[7]})),
      homeworkId: homeworkId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Err' });
  }
});

app.post('/passedHomework', upload.array('files'), async (req, res) => {
  const { homeworkId } = req.body;
  const studentEmail = getUserFromToken(req);

  try {
    const files = req.files;
    const attachments = [];

    const homework = await Homework.findByPk(homeworkId, {
      include: [{ model: Course }]
    });
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    const courseCode = homework.course_id;

    const isStudent = await Course_Student.findOne({ where: { course_id: homework.course_id, user_id: studentEmail} });
    if (!isStudent) {
      return res.status(403).json({ message: 'You are not in this course' });
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadPassedHomeworkFile(file.buffer, file.originalname, courseCode, homeworkId, studentEmail);
        attachments.push(url);
      }
    }

    await PassedHomework.create({
      homework_id: homeworkId,
      student_id: studentEmail,
      submission_date: new Date().toISOString(),
      attachments: JSON.stringify(attachments),
      grade: null,
      status: 'submitted',
      teacher_comment: ''
    });

    res.status(201).json({ message: 'Homework submitted successfully' });
    } catch (err) {
      console.error('Error submitting homework:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/passedHomework', async (req, res) => {
  const { grade, teacher_comment, student_id, homework_id } = req.body;
  try {
    const homework = await Homework.findOne({ where: { id: homework_id }});
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    const course = await Course.findOne({ where: { id: homework.course_id }});
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (grade > course.rating) {
      return res.status(400).json({ message: `Max grade — ${course.rating}` });
    }

    await PassedHomework.update({
      grade: grade,
      teacher_comment: teacher_comment,
    },{
      where: {
        student_id,
        homework_id
      }
    });

    res.status(201).json({ message: 'Homework updated' });
    } catch (err) {
      console.error('Error updating homework:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.delete('/passedHomework/:id', async (req, res) => {
  const homeworkId = req.params.id;
  const studentEmail = getUserFromToken(req);

  try {
    const homework = await PassedHomework.findOne({
      where: { homework_id: homeworkId, student_id: studentEmail }
    });

    if (!homework) return res.status(404).json({ error: "homework not found" });
    if (homework.attachments) {
      const attachments = JSON.parse(homework.attachments);
      for (const url of attachments) {
        await deleteHomeworkFile(url);
      }
    }
    await homework.destroy();
    res.json({ message: "Homework deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting homework" });
  }
});




app.get('/grades/course/:courseId', async (req, res) => {
  const courseId = req.params.courseId;
  const userEmail = getUserFromToken(req);
  try {
    const course = await Course.findOne({ where: { id: courseId }});
    if (!course){
      return res.status(404).json({message: 'Course not found'});
    }
    const isTeacher = course.teacher_id === userEmail;



    const homeworks = await Homework.findAll({
      where: { course_id: courseId },
      attributes: ['id', 'title']
    });
    const homeworkIds = homeworks.map(h => h.id);


    const grades = await PassedHomework.findAll({
      where: { homework_id: homeworkIds },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['email', 'name', 'surname']
        }
      ],
      attributes: ['homework_id', 'grade', 'teacher_comment']
    });



    const result = grades.map(ph => {
      const hwObj = homeworks.find(h => h.id === ph.homework_id);
      return {
        studentEmail: ph.student.email,
        studentName: ph.student.name,
        studentSurname: ph.student.surname,
        homeworkTitle: hwObj?.title || '—',
        grade: ph.grade,
        homeworkId: ph.homework_id
      };
    });
    if (!isTeacher) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});




app.listen(3000, async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    console.log('Server is running on port 3000');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});

