import axios from "axios";
import { bookUrl } from "@/constants/url";
import { Book } from "@/intefaces/interfaces";
export async function searchBooks (filters: any, authToken: string){
    return await axios.get(`${bookUrl}/search`, {
                    params: {
                        limit: 10,
                        order: filters.sortDirection,
                        page: filters.pageIndex,
                        sortBy: filters.sortColumn,
                        ...(filters.searchBy && filters.searchValue && { [filters.searchBy]: filters.searchValue}),
                        ...(filters.selectedCategory && filters.selectedCategory !== "All" && { category:  filters.selectedCategory}),
                        ...(filters.availabilityFilterOption && filters.availabilityFilterOption !== "All" && { inStock: filters.availabilityFilterOption}),
                        ...(filters.priceRange && { minimumPrice: filters.priceRange[0], maximumPrice: filters.priceRange[1]})
                    },
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                });
}

export async function createBook (bookDetails: any, authToken: string){
    return await axios.post(`${bookUrl}`,
        bookDetails,
        {
            headers: {
            Authorization: `Bearer ${authToken}`
            }
        }
    );
}

export async function updateBookDetails (bookDetails: Partial<Book>, authToken: string){
    return await axios.put(`${bookUrl}`,
        bookDetails,
        {
            headers: {
            Authorization: `Bearer ${authToken}`
            }
        }
    );
}

export async function deleteBook (isbn: string, authToken: string){
    return await axios.delete(`${bookUrl}`,{
        params: {
            isbn: isbn
        },
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    })
}

export async function fetchBooksByISBN (isbns: [], authToken: string){
    return await axios.post(`${bookUrl}/isbn`,
        isbns,
        {
            headers: {
            Authorization: `Bearer ${authToken}`
            }
        }
    );
}