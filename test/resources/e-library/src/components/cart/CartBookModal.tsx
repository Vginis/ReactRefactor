import { addBookToCartService, getCartForCurrentUser } from '@/services/cartService';
import CheckIcon from '@mui/icons-material/Check';
import { Button } from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CartBookModalProps {
    book: any,
    setTotalPrice: (totalPrice: number) => void,
    markBookAltered: (isbn: string) => void,
    markBookClean: (isbn: string) => void,
    setUserCart: (userCart: any) => void
}

export const CartBookModal = ({book, setTotalPrice, markBookAltered, markBookClean, setUserCart}: CartBookModalProps) => {
    const [quantity, setQuantity] = useState<number>(book.quantity);
    const [price, setPrice] = useState<number>(book.price);
    const [isQuantityNotChanged, setIsQuantityNotChanged] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (newQuantity: number) => {
        setQuantity(newQuantity);
        const newItemPrice = newQuantity*book.singlePrice;
        setPrice(newItemPrice);
        setIsQuantityNotChanged(true);
        markBookAltered(book.isbn);
    };

    const addBookToCart = async () => {
        const payload = {
            isbn: book.isbn,
            quantity: quantity
        };
        const storedToken = localStorage.getItem('authToken') ?? '';
        try{
            await addBookToCartService([payload], storedToken);
            toast.success("Cart updated!");
        } catch (error){
            console.error("Failed to update cart", error);
            toast.error("Cart was not updated.");
        } finally {
            const userCartResponse = await getCartForCurrentUser(storedToken);
            const userCart = userCartResponse.data;
            
            let sum = 0;
            userCart.books.forEach((book: any) => sum+=book.price);
            setTotalPrice(sum);
            setIsLoading(false);
            setUserCart(userCart);
        }
        setIsQuantityNotChanged(false);
        markBookClean(book.isbn);
    }

    return(
        <>
        { (!isLoading) ? 
            <div className="mt-[30px] ml-[50px] w-[700px] h-[250px] bg-gray-200 rounded-2xl flex">
            {book.image?.data && (
                <img
                    src={`data:${book.image.contentType};base64,${book.image.data}`}
                    alt="Book Cover"
                    className="w-[250px] h-[200px] ml-[30px] mt-[20px] object-cover rounded-lg"
                />
            )}
            <div className="m-20 mt-[0px] rounded-2xl mr-[0px] w-[350px] h-[250px] bg-gray-300">
                <p className="pt-[30px] text-left pl-[20px] text-2xl font-extrabold">Game Of Thrones</p>
                <p className="mt-2 pl-[20px] font-thin text-gray-500">ISBN:{book.isbn}</p>
                <div className='mt-7 ml-4 flex'>
                    <CheckIcon color='success'/>
                    <p className='ml-3 font-thin text-gray-500'>Click & Collect</p>
                </div>
                <div className='mt-4 ml-4 flex'>
                    <div className='flex'>
                        <CheckIcon color='success'/>
                        <p className='ml-3 font-thin text-gray-500'>Home Delivery</p>
                        <Button onClick={addBookToCart} disabled={!isQuantityNotChanged} className='ml-[65px] pt-[3px]'>Update Cart</Button>
                    </div>
                </div>
                <div className='mt-4 ml-4 text-xl font-bold flex'>
                    Qty: {quantity}
                    <div className="ml-[20px] mb-4 mr-3 flex items-center border border-teal-300 rounded-full overflow-hidden w-[120px]">
                        <button
                            disabled={quantity===0}
                            onClick={() => 
                                handleChange(quantity - 1)
                            }
                            className="w-[40px] text-blue-500 hover:bg-gray-100 mb-[6px]"
                        >
                            –
                        </button>
                        <div className="w-[40px] text-center font-medium">{quantity}</div>
                        <button
                            disabled={quantity===10}
                            onClick={() => handleChange(quantity + 1)}
                            className="w-[40px] text-blue-500 hover:bg-gray-100 mb-[6px]"
                        >
                            +
                        </button>
                        </div>
                        <p className='ml-[40px]'>{price}€</p>
                </div>
            </div>
        </div> : <LoadingSpinner/> }
        </>
    )
}