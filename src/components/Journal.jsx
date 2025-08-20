import React, { useEffect, useState } from "react";
import { Table, Typography } from "antd";
import { useAuth } from '../components/context/AuthContext';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import styles from "../App.module.css"

const { Title } = Typography;

const Journal = () => {
  const navigate = useNavigate();
  const { courseCode: courseCode } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    axios.get(`http://localhost:3000/grades/course/${courseCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      setData(res.data);
      setLoading(false);
    })
    .catch((err) => {
      if (err.response?.status === 403) {
        alert('У вас немає доступу до журанлу');
        navigate('/');
      } else {
        console.error('Error loading course:', err);
        setLoading(false);
      }
    });
  }, [courseCode, token]);

  if (loading) return <p>Завантаження...</p>;
  if (data.length === 0) return <p style={{ padding: 15 }}>Немає оцінок у журналі</p>;

  const homeworks = Array.from(new Set(data.map((d) => d.homeworkTitle)));

  const columns = [
    {
      title: "Студент",
      dataIndex: "studentName",
      key: "studentName",
      fixed: "left",
      width: 180,
    },
    ...homeworks.map((title) => ({
      title,
      dataIndex: title,
      key: title,
      align: "center",
      render: (value) => (value !== undefined ? value : "-"),
    })),
  ];

  const studentsMap = {};
  data.forEach((item) => {
    const key = item.studentEmail;
    if (!studentsMap[key]) {
      studentsMap[key] = {
        key,
        studentName: `${item.studentName} ${item.studentSurname}`,
      };
    }
    studentsMap[key][item.homeworkTitle] = item.grade;
  });

  const dataSource = Object.values(studentsMap);

  return (
    <div className={styles.journal}>
      <Title level={3}>Журнал курсу: {courseName}</Title>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: "max-content" }}
        bordered
      />
    </div>
  );
};

export default Journal;
