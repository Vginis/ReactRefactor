import { Button, Menu, MenuItem } from "@mui/material"
import { useState } from "react";
import ListIcon from '@mui/icons-material/List';
import { OrderAddressModal } from "./OrderAddressModal";
import { OrderCartDetailsModal } from "./OrderCartDetailsModal";

interface OrderActionsDropdownProps {
    order: any,
    fetchOrders: () => void
}
export const OrderActionsDropdown = ({order, fetchOrders}: OrderActionsDropdownProps) => {
    const [isAddressModalOpen, setAddressIsModalOpen] = useState(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    
    const openAddressOrderModal = () => {
        if(isAddressModalOpen) return;
        setAddressIsModalOpen(true);
    }

    const openCartDetailsModal = () => {
        if(isCartModalOpen) return;
        setIsCartModalOpen(true);
    }

    const closeAddressModal = () => {
        setAddressIsModalOpen(false);
        fetchOrders();
    }

    const closeCartModal = () => {
        setIsCartModalOpen(false);
        fetchOrders();
    }

    return(
        <div>
            <Button onClick={handleClick}>
                <ListIcon className="text-blue-600"/>
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
                }}
                transformOrigin={{
                vertical: "top",
                horizontal: "center",
                }}
            >
                <MenuItem onClick={() => openAddressOrderModal()}>View Address Details</MenuItem>
                <MenuItem onClick={() => openCartDetailsModal()}>View Ordered Books</MenuItem>
                <OrderAddressModal open={isAddressModalOpen}
                    onClose={closeAddressModal}
                    address={order.shippingAddress}/>
                <OrderCartDetailsModal open={isCartModalOpen}
                    onClose={closeCartModal}
                    order={order}/>
            </Menu>
        </div>
    )
}