import { SideBarOption } from "@/intefaces/interfaces";
export const sideBarOptions: SideBarOption[] = [
    {
        key: 'books',
        description: "Books",
        administratorOnly: true
    },
    {
        key: 'administration',
        description: "Administration",
        administratorOnly: true
    },
    {
        key: 'previous_orders',
        description: "Previous Orders",
        administratorOnly: false 
    },
    {
        key: 'current_cart',
        description: "My Cart",
        administratorOnly: false
    },
];