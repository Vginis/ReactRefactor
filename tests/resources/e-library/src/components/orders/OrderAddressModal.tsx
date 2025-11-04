import { Address } from "@/intefaces/interfaces";
import { Button, Dialog, DialogActions, DialogTitle, TextField } from "@mui/material";

interface OrderAddressModalProps{
    address: Address,
    open: boolean,
    onClose: () => void,
}
export const OrderAddressModal = ({open ,address, onClose}: OrderAddressModalProps) => {
    const addressFields = [
        { label: "Address", value: address.address },
        { label: "Number", value: address.number },
        { label: "Postal Code", value: address.postalCode },
        { label: "Floor", value: address.floor },
        { label: "Doorbell Name", value: address.doorbellName },
    ];

    if(!address) return null;
    return(
        <div>
            <Dialog open={open} onClose={onClose} fullWidth PaperProps={{className: 'h-[500px] w-[1400px] flex flex-col justify-between'}}>
                <DialogTitle className="ml-4 italic">
                    Delivery Address Information
                </DialogTitle>
                {addressFields.map((field: any) => {
                    return <TextField
                        key={field.label}
                        disabled
                        label={field.value}
                        className="p-2 ml-[35px] w-[450px]"
                    />
                })}
                
                 <div className="flex justify-end">
                    <DialogActions className="ml-5">
                        <Button onClick={onClose}>Close</Button>
                    </DialogActions>
                </div>
            </Dialog>
        </div>
    )
}