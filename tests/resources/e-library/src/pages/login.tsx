import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import NavBar from "@/components/common/NavBar";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
export default function LoginPage() {
    return(
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <ToastContainer position="bottom-center" autoClose={3000} />
            <NavBar/>
            <LoginForm/>
        </div>
    )
}