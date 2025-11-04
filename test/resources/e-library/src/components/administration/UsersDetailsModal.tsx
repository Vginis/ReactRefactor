import { User } from "@/intefaces/interfaces";
import { createUser, updateUserDetails } from "@/services/userService";
import { Box, Button, Dialog, DialogActions, DialogTitle, InputLabel, Select, TextField, MenuItem } from "@mui/material";
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface UsersDetailsModalProps {
    user: User | null,
    open: boolean,
    onClose: () => void,
    create: boolean
}

export function UsersDetailsModal({user, open, onClose, create}: Readonly<UsersDetailsModalProps>) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userDetails, setUserDetails] = useState<Partial<User>>({});
    const [action, setAction] = useState<"update"|"create">("update");
    
    useEffect(() => {
        if(open) setUserDetails(user ?? {});
        (create) ? setAction("create") : setAction("update");
    }, [user,open]);

    const isAdminOptions = [true,false] as boolean[];

    const userUpdateDetailsFields = [
        { name:"firstName", label:"First Name",disabled: false},
        { name:"lastName", label:"Last Name",disabled: false},
        { name:"username", label:"Username",disabled: !create},
        { name:"email", label:"Email",disabled: false},   
    ];

    const formModeConfig = {
        create: { title: "Create a new User", buttonLabel:"Create", successMessage: "User created!", errorMessage:"User was not created.",
            submit: async (values: User, authToken: string) => {
                return await createUser(values, authToken);
            }
        },
        update: { title: "View and Edit User's attributes", buttonLabel:"Update", successMessage: "User updated!", errorMessage:"User details were not updated.",
            submit: async (values: User, authToken: string) => {
                return await updateUserDetails(values, authToken);
            }
        }
    }

    const updateUserDetailsSchema = Yup.object({
        username: Yup.string()
            .min(3, "Username must be at least 3 characters")
            .max(12, "Username must be at most 12 characters")
            .required("Username is required"),
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
            .matches(
                /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                "Invalid email format"
            )
            .required("Email is required"),
    });

    const performAction = async (values: any) => {
        setIsLoading(true);
        try{
            const authToken = localStorage.getItem('authToken') as string;
            await formModeConfig[action].submit(values, authToken);
            toast.success(formModeConfig[action].successMessage);
        } catch (error: any) {
            console.error(error?.response?.data ?? formModeConfig[action].errorMessage + error);
            toast.error(error?.response?.data ?? formModeConfig[action].errorMessage);
        } finally {
            setIsLoading(false);
            onClose();
        }
    }

    if(!user) return null;
    return(
        <div>
        {    (!isLoading) ? 
            <Dialog open={open} onClose={onClose} fullWidth PaperProps={{className: 'h-[500px] w-[1400px] flex flex-col justify-between'}}>
                <DialogTitle className="ml-4 italic">
                        {formModeConfig[action].title}
                 </DialogTitle>
                <Formik<User>
                    initialValues={{
                        firstName: userDetails.firstName ?? '',
                        lastName: userDetails.lastName ?? '',
                        username: userDetails.username ?? '',
                        email: userDetails.email ?? '',
                        is_admin: userDetails.is_admin ?? false,
                    }}
                    validationSchema={updateUserDetailsSchema}
                    onSubmit={(values) => {
                        performAction(values);
                    }}
                    enableReinitialize
                    validateOnMount
                >
                {({ handleChange, handleBlur, values, errors, touched, handleSubmit, isValid }) => {
                    return (
                    <Form onSubmit={handleSubmit}>
                    <div className="flex flex-col">
                        {userUpdateDetailsFields.map((field:any) => {
                        const key = field.name as keyof User;
                        return (
                            <Box key={field.label} sx={{ width: 500, maxWidth: '100%' }}>
                                <TextField
                                    name={key}
                                    label={field.label}
                                    value={values[key]}
                                    onChange={handleChange}
                                    error={touched[key] && Boolean(errors[key])}
                                    helperText={touched[key] && errors[key]}
                                    onBlur={handleBlur}
                                    disabled={field.disabled}
                                    fullWidth
                                    className="p-2 mt-4 ml-[35px]"
                                />
                            </Box>)
                        })}

                        {/* Is Admin Select */}
                        <Box sx={{ width: 500, maxWidth: '100%' }}>
                        <InputLabel id="admin-label" className="mt-4 ml-[45px]">
                            Is Administrator
                        </InputLabel>
                        <Select
                            labelId="admin-label"
                            name="is_admin"
                            value={values.is_admin}
                            onChange={handleChange}
                            className="h-[50px] ml-[35px] border border-gray-300 rounded-2xl p-2"
                            onBlur={handleBlur}
                        >
                            {isAdminOptions.map((option) => (
                            <MenuItem key={option.toString()} value={option as any}>
                                {option ? 'Yes' : 'No'}
                            </MenuItem>
                            ))}
                        </Select>
                        </Box>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                        <DialogActions className="ml-5">
                        <Button type="submit" disabled={!isValid}>
                            {formModeConfig[action].buttonLabel}
                        </Button>
                        </DialogActions>
                        <DialogActions className="ml-5">
                        <Button onClick={onClose}>Close</Button>
                        </DialogActions>
                    </div>
                    </Form>)}
                    }
                </Formik>
            </Dialog> : <LoadingSpinner/>}
        </div>
    )
}