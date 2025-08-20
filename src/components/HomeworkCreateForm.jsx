import React, { useState } from 'react';
import { Modal, Form, Input, DatePicker, Upload, Button, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import moment from 'moment/moment';

const HomeworkCreateForm = ({ isVisible, onClose, courseCode, onHomeworkCreated }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = React.useState([]);

  const handleCreate = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('description', values.description);
    if (values.due_date) {
      formData.append('due_date', values.due_date.format('YYYY-MM-DD'));
    } else {
      formData.append('due_date', '');
    }
    formData.append('course_id', courseCode);
    if (values.files?.fileList?.length > 0) {
      values.files.fileList.forEach((fileObj) => {
        formData.append('attachments', fileObj.originFileObj);
      });
    }

    try {
      await axios.post('http://localhost:3000/homework', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        courseCode: courseCode,
      });
      form.resetFields();
      onClose();
      onHomeworkCreated();
    } catch (error) {
      console.error('Error creating homework:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Нове завдання" open={isVisible} onCancel={onClose} footer={null}>
      <Spin spinning={loading}>
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Form.Item name="title" label="Назва завдання" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Опис" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="due_date" label="Дата здачі" >
            <DatePicker format="YYYY-MM-DD" disabledDate={(current) => current && current <= moment().endOf('day')} />
          </Form.Item>
          <Form.Item name="files" label="Файли">
            <Upload multiple beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Додати файли</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Створити</Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default HomeworkCreateForm;
