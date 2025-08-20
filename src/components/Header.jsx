import React, { useState, useEffect } from 'react';
import { Modal, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from '../App.module.css';
import osnova from '../osnova.gif'
import LoginForm from './LoginForm';
import RegistrationForm  from './RegistrationForm';
import { useAuth } from './context/AuthContext';

function Header(props) {
  const navigate = useNavigate();
  const { isLoggedIn, login, logout } = useAuth();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isRegistrationVisible, setRegistrationVisible] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setModalVisible(true);
    } else {
      setModalVisible(false);
    }
  }, [isLoggedIn]);

  const handleNavigation = () => {
    navigate(`/`);
  };
  
  const handleLogout = () => {
    logout(); 
    setModalVisible(true); 
  };

  const handleLogin = () => {
    setModalVisible(false); 
  };

  return (
    <header className={styles.header}>
      <a className={styles.gif} href="#"><img src={osnova} alt="gif" className={styles.imggif}/></a>
      <p className={styles.logo} onClick={handleNavigation}>Osnova</p>
      {isLoggedIn ? (<Button className={styles.btn} onClick={handleLogout}>Logout</Button>) : (<Button className={styles.btn} onClick={handleLogin}>Login</Button>)}

      <Modal title="Login" visible={isModalVisible} footer={null} onCancel={() => {}} closable={false} className={styles.form}>
        <LoginForm onRegister={() => setRegistrationVisible(true)}/>
      </Modal>
      <Modal title="Реєстрація" visible={isRegistrationVisible} footer={null} onCancel={() => setRegistrationVisible(false)} className={styles.form}>
        <RegistrationForm/>
      </Modal>
    </header>
  );
}

export default Header;
