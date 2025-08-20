import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Modal } from 'antd';
import { useAuth } from '../components/context/AuthContext';
import styles from "../App.module.css"
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { CSSTransition } from 'react-transition-group';
import CheckHomeworkForm from './CheckHomeworkForm';

function PassedHomework() {
  const navigate = useNavigate();
  const { homeworkId: homeworkId } = useParams();
  const { token } = useAuth();
  const [studentHomeworks, setStudentHomeworks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState(null);

  const decoded = token ? jwtDecode(token) : null;
  const userEmail = decoded?.email;
 
  const fetchPassedHomeworks = () => {
    if (token && homeworkId) {
      axios.get(`http://localhost:3000/passedHomeworks/${homeworkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => {
        const data = response.data;
        if (data[0].teacherEmail !== userEmail) {
          alert('У вас немає доступу до цієї сторінки');
          navigate('/');  
        } else {
          const formatted = data.map(item => ({
            name: item.name,
            surname: item.surname,
            status: item.status,
            grade: item.grade,
            email: item.studentEmail,
          }));
          setStudentHomeworks(formatted);
        }
      }).catch(err => {
        console.error('Помилка при завантаженні списку робіт студентів:', err);
      });
    }
  };

  useEffect(() => {
    if (token && homeworkId) {
      fetchPassedHomeworks();
    }
  }, [token, homeworkId]);

  return (
    <div className={styles.hwList}>
      <h3>Список робіт:</h3>
      <div className={styles.hwTable}>
        {studentHomeworks.map((phw, index) => (
          <CSSTransition key={index} timeout={300} classNames="fade">
            <div className={styles.row}>
              <span className={styles.cell}>{phw.name} {phw.surname}</span>

              <Button className={styles.btncheck}
                type={phw.status === 'not_submitted' ? 'default' : 'primary'}
                disabled={phw.status === 'not_submitted'}
                onClick={() => {
                  if (phw.status !== 'not_submitted') {
                    setSelectedStudentEmail(phw.email);
                    setModalVisible(true);
                  }
                }}
              >
                {phw.status === 'not_submitted' ? 'не здано' : 'Переглянути'}
              </Button>
              <div
                className={`${styles.gradeBox} ${phw.status === 'checked' ? styles.checked : styles.notChecked}`}
              >
                {phw.status === 'checked' ? phw.grade : '-'}
              </div>

            </div>
          </CSSTransition>
        ))}
        <CheckHomeworkForm
        isVisible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          fetchPassedHomeworks(); 
        }}
        studentEmail={selectedStudentEmail}
        homeworkId={homeworkId}
        />
      </div>
    </div>
  );

}

export default PassedHomework;