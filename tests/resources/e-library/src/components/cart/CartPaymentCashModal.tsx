import { Button } from "@mui/material";
import { toast } from "react-toastify";

export const CartPaymentCashModal = ({onBack,onPayment}: {onBack: (index: number) => void, onPayment: () => void}) => {
  const handlePayment = () => {
    onPayment();
    toast.success("Payment is accepted!");
    setTimeout(() => {
        window.location.reload();
    }, 5000)
  }
  return (
    <div className="p-4">
      <p className="text-lg ml-4 mt-2 text-gray-800">
        You have selected to pay with cash on delivery. Please have the exact amount ready when your order arrives.
      </p>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        className="ml-[50px] w-[150px] h-[40px] mt-4 text-black rounded-xl"
        sx={{
            textTransform: "none",
            background: "#8497ecff",
            "&:hover": { background: "#f32121ff" },
        }}
        onClick={() => onBack(1)}
      >
        Back to Address Form
      </Button>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        className="ml-[590px] w-[150px] h-[40px] mt-4 text-black rounded-xl"
        sx={{
          textTransform: "none",
          background: "#8497ecff",
          "&:hover": { background: "#2cf321ff" },
        }}
        onClick={handlePayment}
      >
        Pay
      </Button>
    </div>
  );
}