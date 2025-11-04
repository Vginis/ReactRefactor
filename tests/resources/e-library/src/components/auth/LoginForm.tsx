
import React from "react";
import { TextField, Button, Typography, Box } from '@mui/material';
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";
import axios from 'axios';
import { submitLogin } from "@/services/authService";
import { toast } from "react-toastify";

const LoginForm: React.FC = () => {
    const router = useRouter();
    
    const loginSchema = Yup.object({
      username: Yup.string()
            .min(3, "Username must be at least 3 characters")
            .max(12, "Username must be at most 12 characters")
            .required("Username is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        )
        .required("Password is required"),
    })
    const handleLogin = async ({ username, password }: { username: string; password: string }) => {
      try{
            const response = await submitLogin(username, password);
            if(response.status === 200){
                console.log('Login Successgul: ',response.data);
                const token = response.data.accessToken;
                const isAdmin = response.data.is_admin
                if(isAdmin) localStorage.setItem("isAdmin", "true");
                localStorage.setItem("authToken",token);
                router.push('/home');
            } else {
                toast.error('Login failed. Try again.')
            }
        } catch(err: any){
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 401) {
              toast.error("Invalid username or password.");
            } else {
              toast.error("Server error. Please try again later.");
            }
          } else {
            console.error("Unexpected error:", err);
            toast.error("Unexpected error occurred.");
          }       
        }
    };

    return(
    <div className="flex items-center justify-center h-screen bg-gray-100"
    style={{
        backgroundImage: "url('/book.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right",
        backgroundSize: "contain",
        backgroundPositionX: "150vh"
      }}>
    <Box
        className="bg-white shadow-lg rounded-lg p-8 max-w-sm mx-auto"
        sx={{
            width: "90%",
            maxWidth: 400,
            textAlign: "center",
            mt: 25,
            ml: 20
          }}>
        <Typography variant="h5" component="h1" className="mb-6" sx={{fontWeight:"bold",color:"#333"}}>
            Ready to start ?
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
            Login and explore the available literature
        </Typography>
        <Formik initialValues={{
          username: "",
          password: ""
        }}
        validationSchema={loginSchema}
        onSubmit={handleLogin} className="space-y-4 mt-6">
          {({ handleChange, values, errors, touched }) => (
          <Form>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={values.username}
              onChange={handleChange}
              error={touched.username && Boolean(errors.username)}
              helperText={touched.username && errors.username}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              error={touched.password && Boolean(errors.password)}
              helperText={touched.password && errors.password}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{
                textTransform: 'none',
                py: 1.5,
                background: '#4dabf5',
                '&:hover': { background: '#2196f3' },}}>Login</Button>
                </Form>
          )}
        </Formik>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Don't have an account? <Typography
                        component="span"
                        color="primary"
                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => router.push('/register')}
                    >
                        Register here
            </Typography>
        </Typography>
    </Box>
    </div>);
}

export default LoginForm;