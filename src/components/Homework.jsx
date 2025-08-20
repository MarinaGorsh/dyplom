import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Modal } from 'antd';
import { useAuth } from '../components/context/AuthContext';
import UploadHomeworkForm from '../components/UploadHomeworkForm'
import styles from "../App.module.css"
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function Homework() {
  const navigate = useNavigate();
  const { id: homeworkId } = useParams();
  const {courseCode: courseCode} = useParams();
  const { token } = useAuth();
  const [homework, setHomework] = useState(null);
  const [passedHomework, setPassedHomework] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const decoded = token ? jwtDecode(token) : null;
  const userEmail = decoded?.email;
  const isTeacher = homework && userEmail === homework.teacherEmail;

  const isAfterDeadline = homework?.due_date ? new Date() > new Date(homework.due_date) : false;

  useEffect(() => {
    if (token) {
      axios.get(`http://localhost:3000/homework/${homeworkId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        const hw = response.data;
        if (typeof hw.files === 'string') {
          try {
            hw.files = JSON.parse(hw.files);
          } catch (err) {
            console.error('Помилка:', err);
            hw.files = [];
          }
        }
        setHomework(hw);
      })
      .catch(error => {
        if (error.response?.status === 403) {
          alert('У вас немає доступу до цього курсу');
          navigate('/');
        } else {
          console.error('Error loading course:', error);
        }  
      });
      handleHomework();      
    }
  }, [homeworkId, token]);

  const handleHomework = () => {
    axios.get(`http://localhost:3000/passedHomework/${homeworkId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      const data = response.data;
      if (data.submitted && Array.isArray(data.files)) {
        setPassedHomework(data);
      } else {
        setPassedHomework(null);
      }
    })
    .catch(error => console.error('Error updating hw:', error));
  };


  const handleDeleteHomework = async (homeworkId) => {
    try {
      await axios.delete(`http://localhost:3000/passedHomework/${homeworkId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      handleHomework();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };
  
  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';

    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '';    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    return `${hours}:${minutes} ${day}.${month}`;
  }


  return (
    <div className={styles.homeworkPageContainer}>
      {homework ? (
        <div>
          <div className={styles.headerContainer}>
            <p className={styles.headerText}>{homework.title}</p>
            <p className={styles.due_date}> {formatDateTime(homework.due_date)}</p>

          </div>
          <div className={styles.container}>
            <p>{homework.description}</p>
            {homework.files && homework.files.length > 0 && (
              <div className={styles.filesSection}>
                <ul>
                  {homework.files.map((file, index) => (
                    <li key={index}>
                      <a href={file.url ? `http://localhost:3000/homeworks/${encodeURIComponent(file.courseCode)}/${encodeURIComponent(file.name)}` : ''} target="_blank" rel="noopener noreferrer nofollow">{file.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {isTeacher ? (
              <Button onClick={() => navigate(`/${courseCode}/${homeworkId}/homeworks`)} className={styles.addhwbtn}>Переглянути роботи студентів</Button>
          ) : ( <>
            {passedHomework ? ( <>
            <div>
              <div className={styles.btns}>
                <Button className={styles.addhwbtn} onClick={() => setViewModalVisible(true)}> Переглянути роботу</Button>
              <Modal
                open={viewModalVisible}
                title="Завантажені файли"
                onCancel={() => setViewModalVisible(false)}
                footer={null}
              >
                <ul>
                  {passedHomework.files.map((file, index) => (
                    <li key={index}>
                      <a href={file.url ? `http://localhost:3000/passedHomeworks/${encodeURIComponent(file.courseCode)}/${encodeURIComponent(file.homeworkId)}/${encodeURIComponent(file.studentEmail)}/${encodeURIComponent(file.name)}` : ''} target="_blank" rel="noopener noreferrer" className={styles.urls}>
                        {file.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </Modal>
              <Button className={styles.addhwbtn} onClick={() => handleDeleteHomework(passedHomework.homeworkId)}> Видалити роботу </Button>
                <div className={`${styles.gradeSection} ${passedHomework.grade ? styles.graded : styles.notGraded}`}>
                  {passedHomework.grade ?? '-'}
                </div>
              </div>
              {passedHomework.teacher_comment && (
                <div className={styles.commentSection}>
                  <strong>Коментар:</strong> {passedHomework.teacher_comment}
                </div>
              )}
            </div>
            </>
            ) : ( <>
              {!passedHomework && !isAfterDeadline && (
                <Button onClick={() => setIsModalVisible(true)} className={styles.addhwbtn}>
                  Завантажити виконане ДЗ
                </Button>
              )}
              {isAfterDeadline && !passedHomework && (
                <p style={{ color: 'gray' }}>Дедлайн пройдено. Завдання більше не можна здати.</p>
              )}
            </> )}
          <UploadHomeworkForm isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} homeworkId={homeworkId} onHomeworkUpload={handleHomework}/>
            </>
          )}
        </div>
      ) : (
        <div>
          <p>Домашнє завдання не знайдено</p>
        </div>
      )}
    </div>
  );
}

export default Homework;