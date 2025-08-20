import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Course from './components/Course'
import { AuthProvider } from './components/context/AuthContext';
import Homework from './components/Homework';
import PassedHomework from './components/PassedHomeworks';
import Journal from './components/Journal';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header/>
        <Routes>
          <Route path="/:courseCode/journal" element={<Journal />} />
          <Route path="/" element={<Home />} />
          <Route path="/course/:id/homeworks" element={<Course />} />
          <Route path="/course/:courseCode/homework/:id" element={<Homework />} />
          <Route path=":courseCode/:homeworkId/homeworks" element={<PassedHomework />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;