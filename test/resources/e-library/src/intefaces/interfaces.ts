export interface AvailabilityOption {
    availability_value: string;
    availability_description: string; 
}

export interface Category {
    book_key: string,
    book_description: string 
}

export interface Book {
    name: string;
    description: string;
    author: string;
    price: number;
    quantityInStock: number;
    category: string;
    isbn: string;
    image?: {
        fileName: string;
        contentType: string;
        data: string;
      };
}


type SidebarView = "books" | "administration" | "previous_orders" | "current_cart";

export interface SideBarOption{
  key: SidebarView;
  description: string;
  administratorOnly: boolean;
}

export interface User {
  username: string,
  firstName: string, 
  lastName: string,
  email: string,
  is_admin: boolean
}

export interface Address {
  address: string,
  postalCode: string,
  number: string,
  floor: string,
  doorbellName: string
}