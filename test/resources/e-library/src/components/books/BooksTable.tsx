import { TableContainer,Table,TableRow, Paper,TableHead, TableCell,TableBody,Pagination,Select,MenuItem,Button, SelectChangeEvent,Slider } from "@mui/material"
import React, { useEffect, useState } from "react";
import { bookCategories } from "@/constants/categories";
import { Category,AvailabilityOption } from "@/intefaces/interfaces";
import { availability_options } from "@/constants/availabilityOptions";
import { BookCartModal } from "./BookCartModal";
import { searchBooks } from "@/services/bookService";
import DeleteIcon from '@mui/icons-material/Delete';
import UpdateIcon from '@mui/icons-material/Update';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { DeleteBookModal } from "./DeleteBookModal";
import { BookDetailsModal } from "./BookDetailsModal";


export function BooksTable(){
    const [authToken, setAuthToken] = useState("");
    const [books,setBooks] = useState([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [filters,setFilters] = useState({
        sortDirection: 'asc',
        sortColumn: 'book',
        pageIndex: 1,
        pageSize: 10,
        searchValue: '',
        searchBy: '',
        hasSelectedFilter: false,
        selectedCategory: '',
        availabilityFilterOption: '',
        priceRange: [0, 200]
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    const handleChangePriceRange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (Array.isArray(newValue)) {
            setFilters((prev) => ({ ...prev, priceRange: newValue, hasSelectedFilter: true}));
        }
      };

    const is_admin = () => {
        const decodedToken = jwtDecode<any>(authToken);
        setIsAdmin(decodedToken.is_admin);
    }
      
    const filterByOptions = [{key: "book", value: "name"},{key: "author", value: "author"}]

    const handleSearchValueChange = ((e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev) => ({ ...prev, searchValue: e.target.value}));
    });
    
    const handleSelectFilterChange = ((e: SelectChangeEvent<string>) => {
        setFilters((prev) => ({ ...prev, searchBy: e.target.value, hasSelectedFilter: true}));
    });

    const handleSort = (column: string) => {
        if (filters.sortColumn === column) {
            setFilters((prev) => ({ ...prev, sortDirection: (filters.sortDirection === 'asc') ? 'desc' : 'asc'}));
        } else {
            setFilters((prev) => ({ ...prev, sortColumn: column, sortDirection: 'asc'}));
        }
    };

    const handleCategorySelected = ((e: SelectChangeEvent<string>) => {
        setFilters((prev) => ({ ...prev, selectedCategory: e.target.value}));
    });

    const handleAvailabilityOptionSelected = ((e: SelectChangeEvent<string>) => {
        setFilters((prev) => ({ ...prev, availabilityFilterOption: e.target.value}));
    });

    const openDeleteBookModal = (book:any) => {
        if(isDeleteModalOpen) return;
        setSelectedBook(book);
        setIsDeleteModalOpen(true);
    }

    const closeDeleteBookModal = () => {
        setIsDeleteModalOpen(false);
        setTimeout(() => setSelectedBook(null), 100);
        fetchBooks();
    }

    const openDetailsBookModal = (book:any) => {
        if(isDetailsModalOpen) return;
        setSelectedBook(book);
        setIsDetailsModalOpen(true);
    }

    const closeDetailsBookModal = () => {
        setIsDetailsModalOpen(false);
        setTimeout(() => setSelectedBook(null), 100);
        fetchBooks();
    }
    
    useEffect(() => {
        fetchBooks();
    }, [filters.sortColumn, filters.sortDirection]);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken') ?? '';
        setAuthToken(storedToken);
    }, []);

    const fetchBooks = async () => {
        if(!authToken){
            return;
        }
        try{
            const response = await searchBooks(filters, authToken);
            setBooks(response.data.searchedBooks);
            setFilters((prev) => ({ ...prev, pageSize: response.data.totalPages}));
        } catch (error){
            console.error("Error fetching books:", error);
            toast.error("Error fetching books:");
        }
    }

    useEffect(() => {
        if(authToken){
            fetchBooks();
            is_admin();
        }
       
    }, [authToken]);

    const handlePageChange = async (event: React.ChangeEvent<unknown>, value: number) => {
        setFilters((prev) => ({ ...prev, pageIndex: value}));
        fetchBooks();
    }

    const handleSearchClick = async () => {
        fetchBooks();
    }

    const openBookCartModal = (book:any) => {
        if (isCartModalOpen) return;
        setSelectedBook(book);
        setIsCartModalOpen(true);
    };

    const closeBookCartModal = () => {
        setIsCartModalOpen(false);
        setTimeout(() => setSelectedBook(null), 100);
    };

    return(
        <>
        <div className="ml-[60px] mt-[50px] w-[1250px] border-2 border-solid rounded-xl p-2 shadow-xl">
            <div className="flex">
                    <div>
                        <p className="mt-2 ml-8 h-[20px] text-xl font-semibold">What are you looking for?</p>
                        <input type="text" placeholder="Search book by name or author ..." className="mt-5 ml-5 h-[40px] w-[350px] border border-gray-300 rounded-2xl p-2"
                        value={filters.searchValue} onChange={(e) => handleSearchValueChange(e)}/>   
                    </div>
                    <div className="mt-2 ml-[100px] flex items-start flex-col">
                        <p className="text-xl font-semibold">Filter</p>
                        <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        className="w-[130px] h-[40px] mt-3 border border-gray-50 rounded-2xl"
                        value={filters.searchBy}
                        onChange={(e) => handleSelectFilterChange(e)}
                    >
                        {filterByOptions.map((filterByOption) => { 
                            return <MenuItem key={filterByOption.key} value={filterByOption.value}>{filterByOption.key}</MenuItem>
                        })}
                        </Select>
                    </div>
                    <div className="mt-2 ml-[100px] flex items-start flex-col">
                        <p className="text-xl font-semibold">Category</p>
                        <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        defaultValue={"All"}
                        className="w-[130px] h-[40px] mt-3 border border-gray-50 rounded-2xl"
                        value={filters.selectedCategory}
                        onChange={(e) => handleCategorySelected(e)}
                    >
                        {bookCategories.map((category: Category) => { 
                            return <MenuItem key={category.book_key} value={category.book_key}>{category.book_description}</MenuItem>
                        })}
                    </Select>
                    </div>
                    <div className="mt-2 ml-[100px] flex items-start flex-col">
                        <p className="text-xl font-semibold">Availability</p>
                        <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        className="w-[130px] h-[40px] mt-3 border border-gray-50 rounded-2xl"
                        value={filters.availabilityFilterOption}
                        onChange={(e) => handleAvailabilityOptionSelected(e)}
                    >
                        {availability_options.map((option: AvailabilityOption) => { 
                            return <MenuItem key="availability_option" value={option.availability_value}>{option.availability_description}</MenuItem>
                        })}
                        </Select>
                    </div>
                    <Button variant="contained" className="flex-col mt-[17px] ml-[50px] h-[70px] w-[90px]" disabled={!filters.hasSelectedFilter} onClick={handleSearchClick}>Search</Button>
                </div>
                <div className="flex">
                    <div className="w-[750px] ml-[200px] mt-4 justify-center p-2">
                        <p className="text-xl text-center font-semibold mb-2">Price Range (€)</p>
                        <Slider
                            value={filters.priceRange}
                            onChange={handleChangePriceRange}
                            valueLabelDisplay="auto"
                            disableSwap
                        />
                        
                    </div>
                    <Button variant="contained" className="ml-[160px] mt-[27px] h-[70px] w-[90px]"
                        onClick={() => openDetailsBookModal(null)}>Create</Button>
                </div>
            </div>
        <div className="w-[1400px] mt-10 ml-[60px] border-2 border-solid rounded-xl p-2 shadow-xl p-2">
            <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                <TableRow>
                    <TableCell className="font-semibold w-[150px]">
                        Cover
                    </TableCell>
                    <TableCell align="left" className="cursor-pointer font-semibold w-[200px]" onClick={() => handleSort('name')}>
                        Book {filters.sortColumn === 'name' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('category')}>
                        Category {filters.sortColumn === 'category' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('authors')}>
                        Author(s) {filters.sortColumn === 'authors' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('price')}>
                        Price {filters.sortColumn === 'price' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell align="center" className="font-semibold">
                        Available
                    </TableCell>
                    {(isAdmin) ? 
                        <>
                            <TableCell align="center" className="font-semibold">
                                Delete
                            </TableCell>
                             <TableCell align="center" className="cursor-pointer font-semibold">
                                Update
                            </TableCell>
                        </>
                    :null}
                    <TableCell align="left" className="font-semibold"> 
                        Add to cart
                    </TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {books.map((book: any) => (
                    <TableRow
                        key={book.name}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        className="p-2">
                    <TableCell>
                        {book?.image?.data && (
                            <img
                                src={`data:${book.image.contentType};base64,${book.image.data}`}
                                alt="Book Cover"
                                className="w-[150px] h-[200px] object-cover rounded-lg pt-7 pl-3 pb-2"
                            />
                            )}
                    </TableCell>
                    <TableCell component="th" scope="row" className="text-xl">
                        {book.name}
                    </TableCell>
                    <TableCell align="left" className="text-xl">{book.category}</TableCell>
                    <TableCell align="left" className="text-xl">{book.author}</TableCell>
                    <TableCell align="left" className="text-xl">{book.price}&euro;</TableCell>
                    <TableCell align="center" className="text-xl">{book.quantityInStock>0 ? <CheckIcon/> : <NotInterestedIcon/>}</TableCell>
                    {(isAdmin) ?
                    <>
                        <TableCell align="center" className="text-xl"><Button onClick={() => openDeleteBookModal(book)}><DeleteIcon className="cursor-pointer"
                                        /></Button></TableCell>
                        <TableCell align="center" className="text-xl"><Button onClick={() => openDetailsBookModal(book)}><UpdateIcon className="cursor-pointer"
                                        /></Button></TableCell>
                    </>    : null}
                    <TableCell align="left" className="text-xl"><Button onClick={() => openBookCartModal(book)}><ShoppingCartIcon className="cursor-pointer"
                        /></Button></TableCell>
                    <TableCell>
                        <BookCartModal open={isCartModalOpen}
                        onClose={closeBookCartModal}
                        book={selectedBook}
                        authToken={authToken}/>
                    <DeleteBookModal open={isDeleteModalOpen}
                        onClose={closeDeleteBookModal}
                        book={selectedBook}/>
                    <BookDetailsModal open={isDetailsModalOpen}
                        onClose={closeDetailsBookModal}
                        book={selectedBook ? (({ _id, ...rest }: any) => rest)(selectedBook) : null}/>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer> 
            <div className="flex justify-center p-2">
                <Pagination count={filters.pageSize} onChange={handlePageChange} color="secondary" className="content-center"/>
            </div>
        </div>
        </>
    )
}