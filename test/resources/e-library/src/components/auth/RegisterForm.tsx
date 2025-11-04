import React from "react";
import { Box, TextField, Button, Typography, Checkbox, FormControlLabel } from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";
import { submitRegister } from "@/services/authService";

const SignupPage: React.FC = () => {
  const router = useRouter();

  const registerSchema = Yup.object({
    firstName: Yup.string()
      .min(3, "First name must be at least 3 characters")
      .max(12, "First name must be at most 12 characters")
      .required("First name is required"),
    lastName: Yup.string()
      .min(3, "Last name must be at least 3 characters")
      .max(12, "Last name must be at most 12 characters")
      .required("Last name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
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
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), undefined], "Passwords must match")
      .required("Confirm Password is required"),
    termsAndConditions: Yup.boolean()
      .oneOf([true], "You must accept the Terms & Conditions")
      .required("You must accept the Terms & Conditions"),
  });

  const handleSubmit = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    termsAndConditions: boolean;
  }) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      username: values.username,
      password: values.password
    }
    try {
      const response = await submitRegister(payload);
      if (response.status === 200) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error during registration", error);
    }
  };

  return (
    <Formik
      initialValues={{
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        termsAndConditions: false
      }}
      validationSchema={registerSchema}
      onSubmit={handleSubmit}
    >
      {({ handleChange, values, errors, touched }) => (
        <div
          className="flex items-center justify-center h-screen bg-gray-100"
          style={{
            backgroundImage: "url('/book.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right",
            backgroundSize: "contain",
            width: "350vh",
            height: "40vh",
            marginRight: "120vh",
            backgroundPositionX: "120vh",
          }}
        >
          <Box
            className="bg-white shadow-lg rounded-lg p-8 max-w-sm mx-auto"
            sx={{
              width: "90%",
              maxWidth: 400,
              textAlign: "center",
              mt: 20,
              ml: 20,
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom className="font-bold">
              Ready to start Reading?
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Signup to our website and start leafing through your favorite literature today!
            </Typography>
            <Form className="space-y-4 mt-6">
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={values.firstName}
                onChange={handleChange}
                error={touched.firstName && Boolean(errors.firstName)}
                helperText={touched.firstName && errors.firstName}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={values.lastName}
                onChange={handleChange}
                error={touched.lastName && Boolean(errors.lastName)}
                helperText={touched.lastName && errors.lastName}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={values.email}
                onChange={handleChange}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
                variant="outlined"
                sx={{ mb: 2 }}
              />
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
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                helperText={touched.confirmPassword && errors.confirmPassword}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={<Checkbox checked={values.termsAndConditions} onChange={handleChange} name="termsAndConditions"/>}
                label={
                  <Typography variant="body2">
                    I agree to the{" "}
                    <a href="https://google.com" className="text-blue-500 underline">
                      Terms & Conditions
                    </a>
                  </Typography>
                }
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{
                  textTransform: "none",
                  py: 1.5,
                  background: "#4dabf5",
                  "&:hover": { background: "#2196f3" },
                }}
                disabled={!values.termsAndConditions}
              >
                Sign Up
              </Button>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                  Already have an account? <Typography
                                      component="span"
                                      color="primary"
                                      sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                      onClick={() => router.push('/login')}
                                  >
                                      Login here
                          </Typography>
                      </Typography>
            </Form>
          </Box>
        </div>
      )}
    </Formik>
  );
};

export default SignupPage;
