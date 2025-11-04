import { Book, Category } from "@/intefaces/interfaces";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { Box, Button, Dialog, DialogActions, DialogTitle, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Form, Formik } from "formik";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { createBook, updateBookDetails } from "@/services/bookService";
import { bookCategories } from "@/constants/categories";
import { ImageUploader } from "../common/ImageUploader";

interface BookDetailsModalProps {
    book: Book | null,
    open: boolean,
    onClose: () => void,
}

export function BookDetailsModal({book, open, onClose}: Readonly<BookDetailsModalProps>) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [bookDetails, setBookDetails] = useState<Partial<Book>>({});
    const [action, setAction] = useState<"update"|"create">("update");

    useEffect(() => {
        if(open) setBookDetails(book ?? {});
        (book === null) ? setAction("create") : setAction("update");
    }, [book,open]);
    
    const bookUpdateDetailsFields = [
        { name:"isbn", label:"ISBN",disabled: action!=='create'},
        { name:"name", label:"Name",disabled: false},
        { name:"author", label:"Author",disabled: false},
        { name:"description", label:"Description",disabled: false},
        { name:"price", label:"Price(€)",disabled: false},
        { name:"quantityInStock", label:"Quantity in Stock",disabled: false}
    ];

     const formModeConfig = {
        create: { title: "Create a new Book", buttonLabel:"Create", successMessage: "Book created!", errorMessage:"Book was not created.",
            submit: async (values: Book, authToken: string) => {
                return await createBook(values, authToken);
            }
        },
        update: { title: "View and Edit Book's attributes", buttonLabel:"Update", successMessage: "Book updated!", errorMessage:"Book details were not updated.",
            submit: async (values: Book, authToken: string) => {
                let bookPayload = values;
                bookPayload.image = bookDetails.image;
                return await updateBookDetails(bookPayload, authToken);
            }
        }
    }

    const updateBookDetailsSchema = Yup.object({
        isbn: Yup.string()
            .min(3, "isbn must be at least 3 characters")
            .max(12, "isbn must be at most 12 characters")
            .required("isbn is required"),
        name: Yup.string()
                .min(3, "Book name name must be at least 3 characters")
                .max(25, "Book name must be at most 25 characters")
                .required("Book name is required"),
        author: Yup.string()
            .min(3, "Author name name must be at least 3 characters")
            .max(20, "Author name must be at most 20 characters")
            .required("Author name is required"),
        description: Yup.string()
            .min(3, "Description name must be at least 3 characters")
            .max(200, "Description must be at most 200 characters")
            .required("Description is required"),
        price: Yup.number().min(0)
            .required("Price is required"),
        quantityInStock: Yup.number().min(0)
            .required("Quanity in stock is required"),
        category: Yup.string().required("Category is required")
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
    
    return(
        <div>
        {    (!isLoading) ? 
            <Dialog open={open} onClose={onClose} fullWidth PaperProps={{className: 'h-[500px] w-[1400px] flex flex-col justify-between'}}>
                <DialogTitle className="ml-4 italic">
                        {formModeConfig[action].title}
                    </DialogTitle>
                <Formik<any>
                    initialValues={{
                        isbn: bookDetails.isbn ?? '',
                        name: bookDetails.name ?? '',
                        author: bookDetails.author ?? '',
                        description: bookDetails.description ?? '',
                        quantityInStock: bookDetails.quantityInStock ?? 0,
                        price: bookDetails.price ?? 0,
                        category: bookCategories.find(c => c.book_key===bookDetails.category)?.book_key ?? null,
                        image: bookDetails.image ?? null
                    }}
                    validationSchema={updateBookDetailsSchema}
                    onSubmit={async (values) => {
                        let converted = { ...values };
                        if (values.image instanceof File) {
                            const file = values.image;
                            const buffer = await file.arrayBuffer();
                            const byteArray = Array.from(new Uint8Array(buffer));

                            converted.image = {
                                fileName: file.name,
                                contentType: file.type,
                                data: {
                                    data: byteArray,
                                },
                            };
                        }

                        performAction(converted);
                    }}
                    enableReinitialize
                    validateOnMount
                >
                {({ handleChange, handleBlur, values, errors, touched, handleSubmit, isValid, setFieldValue }) => {
                    return (
                    <Form onSubmit={handleSubmit}>
                    <div className="flex flex-col">
                        {bookUpdateDetailsFields.map((field:any) => {
                        const key = field.name as keyof Book;
                        return (
                            <Box key={field.label} sx={{ width: 500, maxWidth: '100%' }}>
                                <TextField
                                    name={key}
                                    label={field.label}
                                    value={values[key]}
                                    onChange={handleChange}
                                    error={touched[key] && Boolean(errors[key])}
                                    helperText={touched[key] && typeof errors[key] === 'string' ? errors[key] : undefined}
                                    type={['Price(€)', 'Quantity in Stock'].includes(field.label) ? 'number' : 'text'}
                                    onBlur={handleBlur}
                                    disabled={field.disabled}
                                    fullWidth
                                    className="p-2 mt-4 ml-[35px]"
                                />
                            </Box>)
                        })}

                        {/* Category Select */}
                        <Box sx={{ width: 800, maxWidth: '100%' }}>
                            <InputLabel id="category-label" className="mt-4 ml-[45px]">
                                Category
                            </InputLabel>
                            <Select
                                labelId="category-label"
                                name="category"
                                value={values.category}
                                onChange={handleChange}
                                className="h-[50px] ml-[35px] w-[500px] border border-gray-300 rounded-2xl p-2"
                                onBlur={handleBlur}
                            >
                                {bookCategories.map((option: Category) => (
                                <MenuItem key={option.book_key} value={option.book_key}>
                                {option.book_description}
                                </MenuItem>
                                ))}
                            </Select>
                        </Box>
                        <ImageUploader 
                            image={values.image} 
                            setImage={(img) => setFieldValue("image", img)} 
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                        <DialogActions className="ml-5">
                        <Button type="submit" disabled={!isValid || bookDetails.image?.data.length===0}>
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