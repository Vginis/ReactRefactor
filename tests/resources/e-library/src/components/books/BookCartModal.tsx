import { Book } from "@/intefaces/interfaces";
import React, { useEffect, useState } from "react";
import { Dialog,DialogTitle,DialogActions,Button,Slide, DialogContent,DialogContentText,TextField } from "@mui/material";
import { TransitionProps } from '@mui/material/transitions';
import { getBookFromCart, addBookToCartService } from "@/services/cartService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { toast } from "react-toastify";

interface BookToCartProps {
    open: boolean,
    onClose: () => void,
    book: Book | null,
    authToken: string;
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

export const BookCartModal: React.FC<BookToCartProps> = ({ open, onClose, book, authToken }) => {
    const [quantity,setQuantity] = useState<number>(0);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    useEffect(() => {
        if(book?.price){
            setCurrentPrice(quantity*book.price);
        }  
    }, [quantity]);

    useEffect(() => {
        //Fetches book quantity status from cart.
        if (open && book?.isbn) {
        const fetchBookFromCart = async () => {
            try {
                const response = await getBookFromCart(book.isbn, authToken);

                if(response?.data?.quantity && response?.data?.price){
                    setQuantity(response.data.quantity);
                    setCurrentPrice(response.data.price);    
                }
            } catch (error) {
                console.error("Error fetching book from cart:", error);
                toast.error("Error fetching book from cart.");
            }
        };

        fetchBookFromCart();
    }
        
    },[open, book?.isbn]);

    const addBookToCart = async (isbn: string) => {
        setIsLoading(true);
        try {
            await addBookToCartService(
            [{ isbn, quantity }],
            authToken
            );
            toast.success("Book added to cart!");
        } catch (error) {
            console.error("Failed to add book to cart", error);
            toast.error("Book was not added to the cart.");
        } finally {
            setIsLoading(false);
            handleCloseModal();
        }
    }

    const handleCloseModal = () => {
        onClose();
        setQuantity(0);
        setCurrentPrice(0);
    }

    if(!book) return null;

    return(
      <>
      { (!isLoading) ? <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth PaperProps={{className: 'w-[1200px] flex flex-col justify-between'}}>
                <DialogTitle>{book.name}</DialogTitle>
                <DialogContent className="flex">
                    {book.image?.data && (
                        <img
                            src={`data:${book.image.contentType};base64,${book.image.data}`}
                            alt="Book Cover"
                            className="w-[1%0px] h-[200px] object-cover rounded-lg"
                        />
                    )}
                    <div className="flex flex-col">
                        <DialogContentText className="ml-4 italic">
                            {book.description}
                        </DialogContentText>
                        <TextField
                            label="Quantity"
                            type="number"
                            inputProps={{ min: 1, max: book.quantityInStock }}
                            value={quantity}
                            onChange={(e: any) => setQuantity(Math.max(1, Number(e.target.value)))}
                            className="w-24 p-2 mt-3 ml-[145px]"
                            />
                            <div className="mt-2 ml-[145px] text-lg font-semibold text-gray-700">
                                Total: €{currentPrice.toFixed(2)}
                                </div>
                        <Button variant="contained" className="flex h-[50px] mt-3 ml-[100px] w-[200px]"  disabled={quantity === 0}
                        onClick={() => addBookToCart(book.isbn)}>Add to Cart</Button>
                    </div>
            </DialogContent>
                <DialogActions className="ml-5">
                    <Button onClick={handleCloseModal}>Close</Button>
                </DialogActions>
            </Dialog> : <LoadingSpinner/> }
        </>
    )
}