import { Book } from "@/intefaces/interfaces";
import { deleteBook } from "@/services/bookService";
import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface DeleteBookModalProps {
    book: Book | null,
    open: boolean,
    onClose: () => void
}

export function DeleteBookModal({ book, open, onClose }: Readonly<DeleteBookModalProps>){
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const deleteCurrentBook = async (book: any) => {
        setIsLoading(true);
        try{
            const authToken = localStorage.getItem('authToken') as string;
            await deleteBook(book.isbn, authToken);
            toast.success("User was succesfully deleted.")
        } catch (error: any) {
            console.error(error?.response?.data ?? "Book was not deleted");
            toast.error(error?.response?.data ?? "Book was not deleted");
        } finally {
            setIsLoading(false);
            onClose();
        }
    }

    if(!book) return null;
    return (
    <div>
        { (!isLoading) ? 
            <Dialog open={open} onClose={onClose} fullWidth sx={{className: 'h-[150px] w-[1200px] flex flex-col justify-between rounded-xl p-6 bg-white shadow-lg'}}>
                <DialogTitle className="ml-4">
                    Be careful
                </DialogTitle>
                <div className="text-gray-700 mb-6 p-4">
                    {`You are about to delete book '${book.name}' from the library's system. This action
                        is irreversible. Do you wish to procceed?`}
                </div>
                <div className="flex justify-end">
                    <DialogActions className="ml-5">
                        <Button onClick={onClose}>Close</Button>
                    </DialogActions>
                    <DialogActions className="ml-5">
                        <Button variant="contained" onClick={() => deleteCurrentBook(book)}>Procceed</Button>
                    </DialogActions>
                </div>
            </Dialog> : <LoadingSpinner/>}
    </div>
)
}