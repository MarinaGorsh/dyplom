import React, {useState} from 'react';
import { Button, Form, Spin, Modal, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

const UploadHomeworkForm = ({ isVisible, onClose, homeworkId, onHomeworkUpload  }) => {
  const { token } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleUpload = async () => {
    if (fileList.length === 0) return;    
    setLoading(true);

    const formData = new FormData();
    fileList.forEach((fileObj) => {
      formData.append('files', fileObj.originFileObj);
    });
    formData.append('homeworkId', homeworkId);

    try {
      await axios.post('http://localhost:3000/passedHomework', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
  
      form.resetFields();
      onClose();
      onHomeworkUpload();
    } catch (error) {
      console.error('Error uploading hw:', error);
      alert('Помилка при завантаженні завдання');
    } finally {
      setLoading(false);
    }
  }; 
  
  return (
    <Modal title="Завантажити виконане завдання" open={isVisible} onCancel={onClose} footer={null}>
      <Spin spinning={loading}>
        <Form layout="vertical" onFinish={handleUpload}>
          <Form.Item name="files" label="Файли">
            <Upload multiple beforeUpload={() => false} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)}>
              <Button icon={<UploadOutlined />}>Додати файли</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit">Завантажити</Button>
        </Form>
      </Spin>
    </Modal>
  );
};

export default UploadHomeworkForm;
