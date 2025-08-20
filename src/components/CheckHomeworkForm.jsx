import React, {useEffect, useState} from 'react';
import { Button, Form, Spin, Modal, Upload, Input } from 'antd';
import axios from 'axios';
import styles from "../App.module.css"
import { useAuth } from './context/AuthContext';

const CheckHomeworkForm = ({ isVisible, onClose, studentEmail, homeworkId  }) => {
  const { token } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);  

  useEffect(() => {
    if (!isVisible) return;

    form.resetFields(); 
    setLoading(true);

    axios.get(`http://localhost:3000/passedHomework/${studentEmail}/${homeworkId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data.submitted) {
        setFiles(res.data.files);
      } else {
        setFiles([]);
      }
    }).catch(err => {
      console.error('Помилка завантаження файлів:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [isVisible, studentEmail, homeworkId]);

  const handleFinish = async (values) => {
    try {
      await axios.put(`http://localhost:3000/passedHomework`, {
        grade: values.grade,
        teacher_comment: values.teacher_comment,
        student_id: studentEmail,
        homework_id: homeworkId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Оцінка успішно збережена");
      onClose();
    } catch (err) {
      console.error('Помилка при оцінюванні:', err);
      alert("Не вдалося зберегти оцінку");
    }
  };

  return (
    <Modal title="Завдання" open={isVisible} onCancel={onClose} footer={null}>
      <Spin spinning={loading}>
        <ul>
          {files.map((file, index) => (
            <li key={index}>
              <a href={file.url ? `http://localhost:3000/passedHomeworks/${encodeURIComponent(file.courseCode)}/${encodeURIComponent(file.homeworkId)}/${encodeURIComponent(file.studentEmail)}/${encodeURIComponent(file.name)}` : ''} 
                target="_blank" 
                className={styles.urls}
                rel="noopener noreferrer"
              >
                {file.name}
              </a>
            </li>
          ))}
        </ul>
        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item name="grade" label="Оцінка" rules={[{ required: true, message: 'Вкажіть оцінку' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="teacher_comment" label="Коментар">
            <Input.TextArea />
          </Form.Item>
          <Button type="primary" htmlType="submit">Завантажити</Button>
        </Form>
      </Spin>
    </Modal>
  );
};

export default CheckHomeworkForm;
