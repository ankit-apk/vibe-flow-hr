
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

// This is just a redirect to the dashboard
const Index = () => {
  useEffect(() => {
    document.title = "HRMS - Human Resource Management System";
  }, []);
  
  return <Navigate to="/" replace />;
};

export default Index;
