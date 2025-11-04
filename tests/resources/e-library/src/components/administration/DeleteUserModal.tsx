import { User } from "@/intefaces/interfaces";
import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { useState } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { toast } from "react-toastify";
import { deleteUser } from "@/services/userService";

interface DeleteUserModalProps {
    user: User | null,
    open: boolean,
    onClose: () => void
}

export function DeleteUserModal({ user, open, onClose }: Readonly<DeleteUserModalProps>){
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const deleteCurrentUser = async (user: any) => {
        setIsLoading(true);
        try{
            const authToken = localStorage.getItem('authToken') as string;
            await deleteUser(user.username, authToken);
            toast.success("User was succesfully deleted.")
        } catch (error: any) {
            console.error(error?.response?.data ?? "User was not deleted");
            toast.error(error?.response?.data ?? "User was not deleted");
        } finally {
            setIsLoading(false);
            onClose();
        }
    }

    if(!user) return null;
    return (
        <div>
            { (!isLoading) ? 
                <Dialog open={open} onClose={onClose} fullWidth sx={{className: 'h-[150px] w-[1200px] flex flex-col justify-between rounded-xl p-6 bg-white shadow-lg'}}>
                    <DialogTitle className="ml-4">
                       Be careful
                    </DialogTitle>
                    <div className="text-gray-700 mb-6 p-4">
                        {`You are about to delete user '${user.username}' from the library's system. This action
                            is irreversible. Do you wish to procceed?`}
                    </div>
                    <div className="flex justify-end">
                        <DialogActions className="ml-5">
                            <Button onClick={onClose}>Close</Button>
                        </DialogActions>
                        <DialogActions className="ml-5">
                            <Button variant="contained" onClick={() => deleteCurrentUser(user)}>Procceed</Button>
                        </DialogActions>
                    </div>
                </Dialog> : <LoadingSpinner/>}
        </div>
    )
}