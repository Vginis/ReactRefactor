import NavBar from "@/components/common/NavBar";
import { useAuthRedirect } from "@/hooks/userAuthRedirect";
import SideBar from "@/components/common/SideBar";
import { BooksTable } from "@/components/books/BooksTable";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { UsersModal } from "@/components/administration/UsersModal";
import { CartModal } from "@/components/cart/CartModal";
import { OrdersTable } from "@/components/orders/OrdersTable";
export default function HomePage(){
    useAuthRedirect();
    const [token, setToken] = useState('');
    const [activeView, setActiveView] = useState<'books' | 'administration' | 'previous_orders' | 'current_cart'>('books');

    useEffect(() => {
      const storedToken = localStorage.getItem('authToken') ?? '';
      setToken(storedToken);
    }, []);

    const renderContent = () => {
        switch (activeView) {
            case 'books':
                return <BooksTable/>;
            case 'previous_orders':
                return <OrdersTable/>
            case 'administration':
                return <UsersModal/>;
            case 'current_cart':
                return <CartModal token={token}/>;
            default:
                return <BooksTable/>;
        }
    };

    return ( <><ToastContainer position="bottom-center" autoClose={3000} />
        <NavBar/>
        <div className="flex">
            <SideBar onSelectView={setActiveView}/>
            <div className="flex-col">
                {renderContent()}
            </div>
        </div>
    </>);
}