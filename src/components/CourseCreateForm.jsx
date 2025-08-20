import React, {useState} from 'react';
import { Input, Button, Form, Spin, Modal, InputNumber, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

const CourseCreateForm = ({ isVisible, onClose, onCourseCreated }) => {
  const { token } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newMaxGrade, setMaxGrade] = useState(null);
  const [newImage, setImage] = useState(null);

  
  const handleFileChange = ({ file }) => {
    setImage(file);
  }; 

  const handleCreateNewCourse = async () => {
    setError("");
    setLoading(true);

    if (newCourseName.trim() === '' || newCourseDescription.trim() === '') {
      alert('Заповніть всі поля');
      return;
    }
    const formData = new FormData();
    formData.append('name', newCourseName);
    formData.append('description', newCourseDescription);
    formData.append('image', newImage); 
    formData.append('rating', newMaxGrade);
    try {
      const response = await axios.post('http://localhost:3000/courses', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
  
      onCourseCreated(response.data);
      setNewCourseName('');
      setNewCourseDescription('');
      setMaxGrade(null);
      setImage(null);
      onClose();

    } catch (error) {
      console.error('Error adding new course:', error);
      alert('Помилка при створенні курсу');
    } finally {
      setLoading(false);
    }
  }; 
  
  return (
    <Modal title="Створити новий курс" open={isVisible} onCancel={onClose} footer={null}>
      <Spin spinning={loading}>
        <Form layout="vertical" onFinish={handleCreateNewCourse}>
          <Form.Item label="Назва курсу" required>
            <Input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} />
          </Form.Item>
          
          <Form.Item label="Опис курсу" required>
            <Input.TextArea value={newCourseDescription} onChange={(e) => setNewCourseDescription(e.target.value)} />
          </Form.Item>

          <Form.Item label="Максимальна оцінка" required>
            <InputNumber min={0} max={100} value={newMaxGrade} onChange={setMaxGrade} />
          </Form.Item>

          <Form.Item label="Зображення курсу">
            <Upload beforeUpload={() => false} onChange={handleFileChange} showUploadList={true}>
              <Button icon={<UploadOutlined />}>Завантажити</Button>
            </Upload>
          </Form.Item>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <Button type="primary" htmlType="submit">Створити</Button>
        </Form>
      </Spin>
    </Modal>
  );
};

export default CourseCreateForm;
