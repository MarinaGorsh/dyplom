import { React, useState, useEffect } from 'react';
import { useNavigate  } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styles from "../App.module.css";
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext';
import CourseCreateForm from '../components/CourseCreateForm';
import { jwtDecode } from 'jwt-decode';

function Home() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');

  const decoded = token ? jwtDecode(token) : null;
  const userEmail = decoded?.email;

  const handleNavigation = (id) => {
    navigate(`/course/${id}/homeworks`);
  };

  useEffect(() => {
    if (token) {
        axios.get('http://localhost:3000/courses', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(response => {
            if (Array.isArray(response.data)) {
                setCourses(response.data);
            } else {
                console.error('Error response:', response.data);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }
  }, [token]); 

  const handleShowMessage = () => {
    setShowMessage(!showMessage);
  };  

  const handleCourse = () => {
    axios.get('http://localhost:3000/courses', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setCourses(response.data))
    .catch(error => console.error('Error updating courses:', error));
  };

  const handleDeleteCourse = async (courseCode) => {
    try {
      await axios.delete(`http://localhost:3000/courses/${courseCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      handleCourse();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleJoinCourse = async () => {
    if (newCourseCode.trim() === '') {
      alert('Введіть код курсу');
      return;
    }
    try {
      await axios.post('http://localhost:3000/joinCourse', {
        courseCode: newCourseCode,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      handleCourse();
      setNewCourseCode('');
      console.log('Successfully joined the course');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Не вдалося приєднатись до курсу');
    }
  };
  
  const handleLeaveCourse = async (courseCode) => {
    try {
      await axios.post(`http://localhost:3000/leaveCourse`, {
        courseCode
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      handleCourse();
      return true;
    } catch (error) {
      console.error('Error leave:', error);
      alert('Не вдалося вийти з курсу');
      return false;
    }
  };
      
  return (
    <div className={styles.lft}>
      <div className={styles.inpty}>
        <button onClick={handleShowMessage} className={styles.btnopn}>Відкрити поля для введення</button>
          <CSSTransition in={showMessage} timeout={300} classNames={{ enter: styles["message-enter"], enterActive: styles["message-enter-active"], exit: styles["message-exit"], exitActive: styles["message-exit-active"], }} unmountOnExit >
            <div className={styles.messageСontent}>
              <div className={styles.inputy}>
                <button onClick={() => setIsModalVisible(true)} className={styles.btnopn}>Створити курс</button>
                <CourseCreateForm 
                  isVisible={isModalVisible} 
                  onClose={() => setIsModalVisible(false)} 
                  onCourseCreated={handleCourse} 
                />
                <div className={styles.add}>
                  <input type="text" placeholder="Код" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} />
                  <button className={styles.addbtn} onClick={handleJoinCourse}>Доєднатись</button>
                </div>
              </div>
            </div>
          </CSSTransition>
        </div>
      <TransitionGroup className={styles.blocks}>
        {courses.map((course) => {
          const isTeacher = course.teacher_id === userEmail;
          return(
            <CSSTransition key={course.id} timeout={300} classNames={{ enter: styles['block-enter'], enterActive: styles['block-enter-active'], exit: styles['block-exit'], exitActive: styles['block-exit-active'],}}>
              <li className={styles.block}>
                <div className={styles.first}>
                  <div onClick={() => handleNavigation(course.id)}>
                    <a><img src={course.image_path ? `http://localhost:3000/course-image/${encodeURIComponent(course.id)}/${encodeURIComponent(course.image_path.split('/').pop())}` : ''} alt="Course" className={styles.bk}/></a>
                    <p className={styles.text}>{course.name}</p>
                  </div>
                </div>
                <div className={styles.second}>
                  <p>{course.description}</p>
                  <br/><br/>
                  {isTeacher ? 
                  (<button onClick={() => handleDeleteCourse(course.id)}>Видалити</button>) : 
                  (<button onClick={() => handleLeaveCourse(course.id)}>Вийти</button>)}

                  
                  
                  <br/><br/>
                </div>
              </li>
            </CSSTransition>
          )})}
      </TransitionGroup>
    </div>
  );
}

export default Home;
