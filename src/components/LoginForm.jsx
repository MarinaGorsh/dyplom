import React, {useState} from 'react';
import styles from "../App.module.css";

import { Input, Button, Form, Spin } from 'antd';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

const LoginForm = ({ onRegister }) => {
  const { login } = useAuth(); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async (values) => {
    setError("");
    setLoading(true);

    try {  

      const response = await axios.post("http://localhost:3000/login", { 
        email: values.email, 
        password: values.password 
      });
  
      if (response.data && response.data.token) {
        login(response.data.token);
      } else {
        setError("Не вдалося отримати токен з сервера");
      }
    } catch (err) { 
      console.error(err);
      setError(err.response?.status === 401
        ? "Невірний пароль"
        : "Користувача не знайдено");
    } finally {
      setLoading(false);
    }
  };
  
    
  
  return (
    <Spin spinning={loading}>
      <div>
        <Form onFinish={handleLogin} >
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Введіть коректний email' }]} >
            <Input placeholder="Email"/>
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введіть пароль' }]}>
            <Input.Password placeholder="Пароль" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className={styles.login}>Увійти</Button>
            <Button type="link" onClick={onRegister} className={styles.register}>Реєстрація</Button>
          </Form.Item>
        </Form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </Spin>
  );
};

export default LoginForm;
