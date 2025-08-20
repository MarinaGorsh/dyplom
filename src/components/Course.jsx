import {React, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Button } from 'antd';
import { useAuth } from '../components/context/AuthContext';
import styles from "../App.module.css"
import axios from 'axios';
import HomeworkCreateForm from '../components/HomeworkCreateForm';
import { jwtDecode } from 'jwt-decode';

function Course() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { id: courseCode } = useParams();
  const [course, setCourse] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const decoded = token ? jwtDecode(token) : null;
  const userEmail = decoded?.email;
  const isTeacher = course && userEmail === course.teacher_id;

  const handleNavigation = (homeworkId) => {
    navigate(`/course/${courseCode}/homework/${homeworkId}`);
  };
  const handleNavigationJournal = () => {
    navigate(`/${courseCode}/journal`);
  };

  useEffect(() => {
    if (token) {
      axios.get(`http://localhost:3000/homeworks/${courseCode}`, {
          headers: {
              Authorization: `Bearer ${token}`,
          },
      })
      .then(response => {
        const data = response.data.map(hw => {
          if (!hw.due_date) return { ...hw, deadlineMessage: null };

          const now = new Date();
          const dueDate = new Date(hw.due_date);
          const timeDiff = dueDate - now;

          if (timeDiff <= 0) {
            return { ...hw, deadlineMessage: 'Завдання закрите' };
          } else if (timeDiff <= 24 * 60 * 60 * 1000) {
            return { ...hw, deadlineMessage: 'Сьогодні о 23:59 дедлайн' };
          } else if (timeDiff <= 2 * 24 * 60 * 60 * 1000) {
            return { ...hw, deadlineMessage: 'Через 1 день дедлайн' };
          }
          return { ...hw, deadlineMessage: null };
        })
        .sort((a, b) => {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
          return dateB - dateA;
        });
        setHomeworks(data);
      })
      .catch(error => {
          console.error('Error fetching data:', error);
      });
      axios.get(`http://localhost:3000/course/${courseCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        setCourse(response.data); 
      })
      .catch(error => {
        if (error.response?.status === 403) {
          alert('У вас немає доступу до цього курсу');
          navigate('/');
        } else {
          console.error('Error loading course:', error);
        }      
      });
    }
  }, [token, courseCode]);

  const handleHomeworkCreated = () => {
    axios.get(`http://localhost:3000/homeworks/${courseCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setHomeworks(response.data))
    .catch(error => console.error('Error updating courses:', error));
  };

  const handleDeleteHomework = async (homeworkId) => {
    try {
      await axios.delete(`http://localhost:3000/homeworks/${homeworkId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      handleHomeworkCreated();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };
  
  return (
    <div className={styles.courscontainer}>
      {course ? ( <>
        <div className={styles.headercontainer}>
          <div>
            <p className={styles.headertext}>{course.name}</p>
            <p className={styles.headertext2}>{course.description}</p>
            <p className={styles.headertext3}>{course.id}</p>
          </div>
        </div>
        {isTeacher ? (<Button onClick={() => setIsModalVisible(true)} className={styles.addhwbtn}>Створити завдання</Button>) : ('')}
        {isTeacher ? (<Button onClick={() => handleNavigationJournal()} className={styles.addhwbtn}>Журнал оцінок</Button>) : ('')}
        
        <HomeworkCreateForm
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          courseCode={courseCode}
          onHomeworkCreated={handleHomeworkCreated}
        />

        <TransitionGroup>
          {homeworks.map((hw) => (
            <CSSTransition key={hw.id} timeout={300} classNames="fade">
              <li className={styles.hws} onClick={() => handleNavigation(hw.id)} style={{ cursor: 'pointer' }}>
                <h3>{hw.title}</h3>
                {hw.deadlineMessage && (
                  <p style={{ color: 'red' }}>{hw.deadlineMessage}</p>
                )}
                <div className={styles.homeworkRight}>
                  {isTeacher ? (<button onClick={(e) => {e.stopPropagation(); handleDeleteHomework(hw.id)}}>Видалити</button>) : ('')}
                </div>
              </li>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </>
      ) : (
        <div>
          <p>Курс не знайдено</p>
        </div>
      )}
    </div>
  ); 
}
  
export default Course;
