import React from 'react';
import { useField } from 'formik';
import { Form, Input} from 'antd';

const FormikElement = ({ label, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <Form.Item label={label} htmlFor={props.id || props.name}>
      <Input {...field} {...props} />
      {meta.touched && meta.error && <div style={{ color: 'red' }}>{meta.error}</div>}
    </Form.Item>
  );
};

export default FormikElement;
