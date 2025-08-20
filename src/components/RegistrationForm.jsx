import React, {useState} from 'react';
import {Button, Form } from 'antd';
import { Formik } from 'formik';
import FormikElement from './FormikElement';
import styles from "../App.module.css";
import axios from 'axios';

const RegistrationForm = ({ onRegister, loading }) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (values) => {
    try {
      await axios.post('http://localhost:3000/register', {
        name: values.name,
        surname: values.surname,
        email: values.email,
        password: values.password,
      });

    onRegister(values.email, values.password);
    setMessage("Registration successful! Please log in.");
    setError("");
  } catch (error) {
    console.error("Error registering user:", error);
    setError("Registration failed. User with email may already exist.");
    setMessage("");
  }
};

  return (
    <div>
      <Formik
        initialValues={{ name: '', surname: '', email: '', password: '' }}
        validate={values => {
          const errors = {};
          if (!values.name || values.name.length < 3) {
            errors.name = 'Ім’я має бути не менше 3 символів';
          }
          if (!values.surname || values.surname.length > 40) {
            errors.surname = 'Прізвище не більше 40 символів';
          }
          if (!values.email) {
            errors.email = 'Required';
          } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
          ) {
            errors.email = 'Невірний формат електронної пошти';
          }
          if (!values.password) {
            errors.password = 'Required';
          } else if (!/(?=.*[A-Z])(?=.*[^a-zA-Z])/.test(values.password)) {
            errors.password = 'Пароль має містити хоча б одну велику літеру та один символ відмінний від букви';
          }
          return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
          handleRegister(values);
          setSubmitting(false);
        }}
        >
        {({
          handleSubmit,
          isSubmitting,
        }) => (
          <Form onFinish={handleSubmit}>
            <FormikElement label="Ім'я" name="name"/>

            <FormikElement label="Прізвище" name="surname"/>

            <FormikElement label="E-mail" name="email" type="email"/>

            <FormikElement label="Password" name="password" type="password"/>

            <Form.Item>
              <Button className={styles.login} type="primary" htmlType="submit" disabled={isSubmitting} >Зареєструватись</Button>
            </Form.Item>
          </Form>
        )}
      </Formik>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default RegistrationForm;
