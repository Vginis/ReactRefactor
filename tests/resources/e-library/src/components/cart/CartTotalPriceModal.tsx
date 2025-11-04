import { Button } from "@mui/material";

export const CartTotalPriceModal = ({onProceed, totalPrice, procceedToPaymentButtonEnabled}: {onProceed: () => void, totalPrice: number, procceedToPaymentButtonEnabled: boolean}) => {
    return(
        <div className="w-[280px] ml-[100px] mt-[90px] h-[250px] bg-gray-200">
            <div className="mt-[40px] text-2xl font-bold ml-[30px]">
                Total Cost: {totalPrice}€
            </div>
            <Button disabled={!procceedToPaymentButtonEnabled} variant="contained" 
                    onClick={onProceed}
                    className="w-[150px] mt-[80px] ml-[50px] h-[40px] text-black rounded-xl"
                    sx={{
                        textTransform: "none",
                        background: "#8497ecff",
                        "&:hover": { background: "#2196f3" },
                    }}>
                Procceed to Payment
            </Button>
        </div>
    );
} 