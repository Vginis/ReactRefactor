import React from "react";
import RegisterForm from "@/components/auth/RegisterForm"; 
import NavBar from "@/components/common/NavBar";

export default function LoginPage() {
    const navbarOptions = ["About"];
    return(
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <NavBar navbarOptions={navbarOptions}/>
            <RegisterForm/>
        </div>
    )
}