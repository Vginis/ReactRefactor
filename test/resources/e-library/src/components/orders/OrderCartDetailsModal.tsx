import { fetchBooksByISBN } from "@/services/bookService";
import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
interface OrderCartDetailsModalProps{
    order: any,
    open: boolean,
    onClose: () => void,
}
export const OrderCartDetailsModal = ({order, open, onClose}: OrderCartDetailsModalProps) => {
    const [books, setBooks] = useState<any>([]);
    
    useEffect(() => {
        fetchOrderDetails();
    }, []);
    
    const fetchOrderDetails = async () => {
        const storedToken = localStorage.getItem('authToken') ?? undefined;
        if(!storedToken){
            return;
        }

        try{
            const response = await fetchBooksByISBN(order.cart.map((c:any) => c.isbn), storedToken);
            setBooks(response.data);
        } catch (error){
            console.error("Error fetching books:", error);
            toast.error("Error fetching books:");
        }
    }

    const getQuantityFromCart = (isbn: string) => {
        return order.cart.find((b: any) => b.isbn === isbn).quantity;
    }

    if(!order) return null;
    return(
        <div className="flex">
            <Dialog open={open} onClose={onClose} PaperProps={{className: 'h-[500px] flex w-[1200px] justify-between'}}>
                <DialogTitle className="ml-4 italic">
                    Order Details
                </DialogTitle>

                <div className="mb-[30px] flex">
                {books?.length > 0 &&
                  books.map((book: any) => {
                    return (
                        <div key={book.id} className="flex bg-gray-300 w-[350px] ml-[30px] rounded-2xl">
                            {book.image.data && (
                                <>
                                    <img
                                        src={`data:${book.image.contentType};base64,${book.image.data}`}
                                        alt="Book Cover"
                                        className="w-[150px] h-[120px] ml-[30px] pb-4 mt-[20px] object-cover rounded-lg"
                                        />
                                
                                    <div className="flex-col">
                                        <p className="ml-[20px] mt-[25px] font-bold">{book.name}</p>
                                        <p className="ml-[20px] mt-[15px] font-thin">ISBN: {book.isbn}</p>
                                        <p className="ml-[20px] mt-[15px] mb-[10px] font-thin">Quantity: {getQuantityFromCart(book.isbn)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                  })}
                  <div className="w-[280px] ml-[80px] mr-[30px] h-[80px] rounded-2xl bg-gray-200">
                    <div className="text-2xl font-bold ml-[30px]">
                        Total Cost: {order.totalPrice}€
                    </div>
                  </div>
              </div>
                <div className="flex justify-end">
                    <DialogActions className="ml-5">
                        <Button onClick={onClose}>Close</Button>
                    </DialogActions>
                </div>
            </Dialog>
        </div>
    )
}