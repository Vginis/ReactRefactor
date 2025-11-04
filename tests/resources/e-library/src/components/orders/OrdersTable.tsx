import { searchUserOrders } from "@/services/orderService";
import { Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { OrderActionsDropdown } from "./OrderActionsDropdown";

export const OrdersTable = () => {
    const [orders,setOrders] = useState([]);
    const [filters,setFilters] = useState({
        sortDirection: 'asc',
        sortColumn: 'id',
        pageIndex: 1,
        pageSize: 10,
        searchValue: '',
        searchBy: '',
        is_admin: "",
        hasSelectedFilter: false,
    });

    const handleSort = (column: string) => {
        if (filters.sortColumn === column) {
            setFilters((prev) => ({ ...prev, sortDirection: (filters.sortDirection === 'asc') ? 'desc' : 'asc'}));
        } else {
            setFilters((prev) => ({ ...prev, sortColumn: column, sortDirection: 'asc'}));
        }
    };

    const handlePageChange = async (event: React.ChangeEvent<unknown>, value: number) => {
        setFilters((prev) => ({ ...prev, pageIndex: value}));
        fetchOrders();
    }

    useEffect(() => {
        fetchOrders();
    }, [filters.sortColumn, filters.sortDirection]);
    
    const fetchOrders = async () => {
        const storedToken = localStorage.getItem('authToken') ?? undefined;
        if(!storedToken){
            return;
        }
        try{
            const response = await searchUserOrders(filters, storedToken);
            setOrders(response.data.searchedOrders);
            setFilters((prev) => ({ ...prev, pageSize: response.data.totalPages}));
        } catch (error){
            console.error("Error fetching orders:", error);
            toast.error("Error fetching orders:");
        }
    }

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="ml-[60px] mt-[50px] w-[1250px] border-2 border-solid rounded-xl p-2 shadow-xl">
            <h2 className="mt-4 ml-2 text-xl font-bold">Check your previous orders and their status</h2>
            <TableContainer sx={{ marginTop: 5}} component={Paper}>
                <Table sx={{ minWidth: 650}} aria-label="simple table">
                    <TableHead>
                    <TableRow>
                        <TableCell align="left" className="cursor-pointer font-semibold w-[200px]" onClick={() => handleSort('_id')}>
                            Id {filters.sortColumn === 'id' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('createdAt')}>
                            Order Date {filters.sortColumn === 'createdAt' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('deliveredAt')}>
                            Delivery Date {filters.sortColumn === 'deliveredAt' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('totalPrice')}>
                            Total Price(€){filters.sortColumn === 'totalPrice' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="font-semibold">
                            Status
                        </TableCell>
                        <TableCell align="center" className="font-semibold">Actions</TableCell>
                    </TableRow>
                    </TableHead>
                     <TableBody className="text-base">
                        {orders.map((order: any) => (
                            <TableRow
                                key={order._id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {order._id}
                                </TableCell>
                                <TableCell align="left">{formatDate(order.createdAt)}</TableCell>
                                <TableCell align="left">{formatDate(order.deliveredAt)}</TableCell>
                                <TableCell align="left">{order.totalPrice}€</TableCell>
                                <TableCell align="left">{order.status}</TableCell>
                                <TableCell align="center">
                                    <OrderActionsDropdown order={order} fetchOrders={fetchOrders}/>
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
    )
}