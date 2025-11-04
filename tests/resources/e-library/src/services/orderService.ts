import { orderUrl } from "@/constants/url";
import axios from "axios";

export async function createOrder(payload: any, authToken: string) {
    return await axios.post(`${orderUrl}`,payload,{
            headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                    }
        });
}

export async function searchUserOrders(filters: any, authToken: string) {
        return await axios.get(`${orderUrl}/search`,{
            params: {
            limit: 10,
            order: filters.sortDirection,
            page: filters.pageIndex,
            sortBy: filters.sortColumn,
            ...(filters.searchBy && filters.searchValue && { [filters.searchBy]: filters.searchValue}),
            ...(filters.is_admin && { is_admin: filters.is_admin})
            },
            headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                    }
        })
}