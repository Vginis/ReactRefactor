import { userUrl } from "@/constants/url";
import { User } from "@/intefaces/interfaces";
import axios from "axios";

export async function searchUsers (filters: any, authToken: string){
    return await axios.get(`${userUrl}/search`, {
        params: {
            limit: 10,
            order: filters.sortDirection,
            page: filters.pageIndex,
            sortBy: filters.sortColumn,
            ...(filters.searchBy && filters.searchValue && { [filters.searchBy]: filters.searchValue}),
            ...(filters.is_admin && { is_admin: filters.is_admin})
            },
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });
}

export async function updateUserDetails (userDetails: User, authToken: string){
    return await axios.put(`${userUrl}/personal-details`,
        userDetails,
        {
            headers: {
            Authorization: `Bearer ${authToken}`
            }
        }
    );
}

export async function createUser (userDetails: User, authToken: string){
    return await axios.post(`${userUrl}`,
        userDetails,
        {
            headers: {
            Authorization: `Bearer ${authToken}`
            }
        }
    );
}

export async function deleteUser(username: string, authToken: string){
    return await axios.delete(`${userUrl}`,{
        params: {
            username: username
        },
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });
}