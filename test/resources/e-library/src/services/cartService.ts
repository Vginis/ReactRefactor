import { cartUrl } from "@/constants/url";
import axios from "axios";

export async function getBookFromCart(isbn: string, authToken: string){
    return await axios.get(`${cartUrl}/${isbn}`,{
        headers: {
                Authorization: `Bearer ${authToken}`
                }
    });
}

export async function getCartForCurrentUser(authToken: string){
    return await axios.get(`${cartUrl}`, {
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });
}

export async function addBookToCartService(payload: any, authToken: string){
    return await axios.post(`${cartUrl}/addToCart`,payload,{
        headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
                }
    });
} 