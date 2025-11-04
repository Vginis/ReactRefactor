import { useEffect, useState } from "react";
import { BooksTable } from "../books/BooksTable";
import { getCartForCurrentUser } from "@/services/cartService";
import { toast } from "react-toastify";
import { CartBookModal } from "./CartBookModal";
import { CartTotalPriceModal } from "./CartTotalPriceModal";
import { CartPaymentModal } from "./CartPaymentModal";
import { CartAddressFormModal } from "./CartAddressFormModal";
import { Address } from "@/intefaces/interfaces";
import { CartProgressBar } from "./CartProgressBar";

export const CartModal = ({token}: {token:string}) => {
    const [navigateToBooks, setNavigateToBooks] = useState(false);
    const [userCart, setUserCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);
    const [alteredBooks, setAlteredBooks] = useState<Set<string>>(new Set());
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [address, setAddress] = useState<Address>();

    const markBookAltered = (isbn: string) => {
        setAlteredBooks(prev => new Set(prev).add(isbn));
    }

    const markBookClean = (isbn: string) => {
        setAlteredBooks(prev => {
            const updated = new Set(prev);
            updated.delete(isbn);
            return updated;
        })
    }

    const procceedToPaymentButtonEnabled = alteredBooks.size === 0;

    useEffect(() => {
        if(token !== ''){
            fetchUserCart();
        }
    }, []);

    const fetchUserCart = async () => {
        setLoading(true);
        try{
            const response = await getCartForCurrentUser(token);
            setUserCart(response.data);
            setTotalPrice(response.data.total);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching cart:", error);
            toast.error("Error fetching user cart.");
        }
    }

    if(navigateToBooks){
        return <BooksTable/>;
    }

    if(loading){
        return <div className="p-4 text-gray-500 bg-black">Loading your cart...</div>;
    }

    if(Object.keys(userCart).length === 0 || userCart?.books.length === 0){
        return <div>
            <div className="mt-[30px] ml-[40px]">
                <div className="flex italic text-gray-500">
                    <p onClick={() => setNavigateToBooks(true)} className="hover:text-blue-700 hover:underline cursor-pointer">Home</p>
                    <p>/Your Cart</p>
                </div>
                <div className="flex mt-[60px] bg-gray-100 p-2 w-[1200px]">
                    <div>
                        <div className="ml-[15px] text-4xl font-extrabold">Your Cart is empty</div>
                        </div>
                </div>
            </div>
        </div>
    }

    return (
  <div className="overflow-hidden w-[1200px] mx-auto">
    <CartProgressBar activeIndex={activeIndex}/>
    <div
      className="flex transition-transform duration-500"
      style={{ transform: `translateX(-${activeIndex * 1200}px)` }}
    >
      {/* TAB 1: Cart */}
      <div className="flex-shrink-0 w-[1200px]">
        <div className="mt-[30px] ml-[40px]">
          <div className="flex italic text-gray-500">
            <p
              onClick={() => setNavigateToBooks(true)}
              className="hover:text-blue-700 hover:underline cursor-pointer"
            >
              Home
            </p>
            <p>/Your Cart</p>
          </div>
          <div className="flex mt-[60px] bg-gray-100 p-2 w-[1200px]">
            <div>
              <div className="ml-[15px] text-4xl font-extrabold">Your Cart</div>
              <div className="mb-[30px]">
                {userCart?.books?.length > 0 &&
                  userCart.books.map((book: any) => {
                    return (
                      <CartBookModal
                        key={book.isbn}
                        book={book}
                        setTotalPrice={setTotalPrice}
                        markBookAltered={markBookAltered}
                        markBookClean={markBookClean}
                        setUserCart={setUserCart}
                      />
                    );
                  })}
              </div>
            </div>
            <CartTotalPriceModal
              onProceed={() => setActiveIndex(1)}
              totalPrice={totalPrice}
              procceedToPaymentButtonEnabled={procceedToPaymentButtonEnabled}
            />
          </div>
        </div>
      </div>  
      {/* TAB 2 */}
      <div className="flex-shrink-0 w-[1200px]">
        <CartAddressFormModal
          onBack={() => setActiveIndex(0)}
          onNext={() => setActiveIndex(2)}
          setAddress={setAddress}
        />
      </div>
          {/* TAB 3 */}
          <div className="flex-shrink-0 w-[1200px]">
            <CartPaymentModal onBack={() => setActiveIndex(1)} address={address} 
              cart={userCart.books.map((book:any) => ({
                isbn: book.isbn,
                quantity: book.quantity
              }))}/>
          </div>
        </div>
    </div>
    );


}