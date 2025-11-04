import { Button } from "@mui/material";
import { useState } from "react";
import { CartPaymentVisaModal } from "./CartPaymentVisaModal";
import { CartPaymentCashModal } from "./CartPaymentCashModal";
import { toast } from "react-toastify";
import { createOrder } from "@/services/orderService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Address } from "cluster";

export const CartPaymentModal = ({onBack, address, cart}: {onBack: (index: number) => void, address: any, cart: any}) => {
    const [activePaymentTab, setActivePaymentTab] = useState<'visa'|'cash'>('visa');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handlePaymentTabChange = (paymentTab: any) => {
        setActivePaymentTab(paymentTab);
    }

    const handlePayment = async () => {
        const token = localStorage.getItem("authToken") ?? "";
        const payload = {
            shippingAddress: address,
            cart: cart
        };
        try{
            await createOrder(payload,token);
        } catch (error: any){
            toast.error(error?.response?.data ?? "Order was not made");
        } finally {
            setIsLoading(false);
        }
    }

    return (
    <div>
        { (!isLoading) ? 
        <div className="flex-col ml-[40px] h-[630px] mt-[115px] bg-gray-300 p-2 w-[1200px]">
                <h2 className="text-2xl font-bold mb-2 text-sky-500">Payment with {activePaymentTab.toUpperCase()}</h2>
                <div className="mt-4 ml-[30px] bg-gray-500 h-[90px] mr-[130px] rounded-2xl">
                    <Button className={`w-1/2 h-[90px] rounded-2xl ${
                            activePaymentTab === 'visa' ? 'bg-gray-600' : 'bg-gray-500'
                            }`} onClick={() => handlePaymentTabChange('visa')}>
                        <img src="/visa.svg" width={50} height={50} />
                    </Button>
                    <Button className={`w-1/2 h-[90px] rounded-2xl ${
                            activePaymentTab === 'cash' ? 'bg-gray-600' : 'bg-gray-500'
                            }`} onClick={() => handlePaymentTabChange('cash')}>
                        <img src="/cash-on-delivery.svg" width={80} height={150} />
                    </Button>
                </div>
                {(activePaymentTab === "visa") ? 
                    <CartPaymentVisaModal onBack={onBack} onPayment={() => handlePayment()}/> : 
                    <CartPaymentCashModal onBack={onBack} onPayment={() => handlePayment()}/>
                    }
        </div> : <LoadingSpinner/>}
    </div>);
}