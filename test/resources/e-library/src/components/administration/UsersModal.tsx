import { searchUsers } from "@/services/userService";
import { Button, MenuItem, Pagination, Paper, Select, SelectChangeEvent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { UsersDetailsModal } from "./UsersDetailsModal";
import CheckIcon from '@mui/icons-material/Check';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import DeleteIcon from '@mui/icons-material/Delete';
import UpdateIcon from '@mui/icons-material/Update';
import { DeleteUserModal } from "./DeleteUserModal";

export const UsersModal = () => {
    const [users,setUsers] = useState([]);
    const [filters,setFilters] = useState({
        sortDirection: 'asc',
        sortColumn: 'firstName',
        pageIndex: 1,
        pageSize: 10,
        searchValue: '',
        searchBy: '',
        is_admin: "",
        hasSelectedFilter: false,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const filterByOptions = [{key: "name", value: "firstName"},{key: "surname", value: "lastName"},
        {key: "email", value: "email"}, {key: "username",value: "username"}];

    const handleSearchValueChange = ((e: React.ChangeEvent<HTMLInputElement>) => {
            setFilters((prev) => ({ ...prev, searchValue: e.target.value}));
        });
        
    const handleSelectFilterChange = ((e: SelectChangeEvent<string>) => {
        setFilters((prev) => ({ ...prev, searchBy: e.target.value, hasSelectedFilter: true}));
    });

    const handleSelectIsAdminChange = (e: SelectChangeEvent<string>) => {
        setFilters(prev => ({
            ...prev,
            is_admin: e.target.value,
            hasSelectedFilter: true,
        }));
    };


    const handleSort = (column: string) => {
        if (filters.sortColumn === column) {
            setFilters((prev) => ({ ...prev, sortDirection: (filters.sortDirection === 'asc') ? 'desc' : 'asc'}));
        } else {
            setFilters((prev) => ({ ...prev, sortColumn: column, sortDirection: 'asc'}));
        }
    };

    const handleSearchClick = async () => {
        fetchUsers();
    }

    const handlePageChange = async (event: React.ChangeEvent<unknown>, value: number) => {
            setFilters((prev) => ({ ...prev, pageIndex: value}));
            fetchUsers();
    }

    const openUsersDetailsModal = (user:any) => {
        if(isModalOpen) return;
        setSelectedUser(user);
        setIsModalOpen(true);
    }

    const closeUserDetailsModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedUser(null), 100);
        fetchUsers();
    }

    const openDeleteUserModal = (user:any) => {
        if(isDeleteModalOpen) return;
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    }

    const closeDeleteUserModal = () => {
        setIsDeleteModalOpen(false);
        setTimeout(() => setSelectedUser(null), 100);
        fetchUsers();
    }

    const openCreateUserModal = () => {
        const newUser = {
            firstName: "",
            lastName: "",
            username: "",
            email: "",
        } as any
        setSelectedUser(newUser);
        setIsModalOpen(true);
    }

    useEffect(() => {
        fetchUsers();
    }, [filters.sortColumn, filters.sortDirection]);

    const fetchUsers = async () => {
        const storedToken = localStorage.getItem('authToken') ?? undefined;
        if(!storedToken){
            return;
        }
        try{
            const response = await searchUsers(filters, storedToken);
            setUsers(response.data.searchedUsers);
            setFilters((prev) => ({ ...prev, pageSize: response.data.totalPages}));
        } catch (error){
            console.error("Error fetching users:", error);
            toast.error("Error fetching users:");
        }
    }

    const isCreateModal = () => {
        return selectedUser != null && selectedUser['username'] === "";
    }

    return (
        <div className="ml-[60px] mt-[50px] w-[1250px] border-2 border-solid rounded-xl p-2 shadow-xl">
        <div className="flex">
                <div>
                    <input type="text" placeholder="Search for users ..." className="mt-5 ml-5 h-[40px] w-[350px] border border-gray-300 rounded-2xl p-2"
                    value={filters.searchValue} onChange={(e) => handleSearchValueChange(e)}/>   
                </div>
                <div className="mt-2 ml-[50px] h-[40px] flex items-start flex">
                    <Select
                        labelId="demo-simple-select-label"    
                        className="w-[160px] h-[40px] mt-3 border border-gray-300 rounded-2xl p-2"
                        value={filters.searchBy}
                        onChange={(e) => handleSelectFilterChange(e)}
                        displayEmpty 
                    >
                        <MenuItem disabled value="">
                            Search by...
                        </MenuItem>
                    {filterByOptions.map((filterByOption) => { 
                        return <MenuItem key={filterByOption.key} value={filterByOption.value}>{filterByOption.key}</MenuItem>
                    })}
                    </Select>
                    <Select
                        labelId="demo-simple-select-label"    
                        className="w-[160px] h-[40px] mt-3 ml-[35px] border border-gray-300 rounded-2xl p-2"
                        value={filters.is_admin}
                        onChange={(e) => handleSelectIsAdminChange(e)}
                        displayEmpty
                    >
                        <MenuItem disabled value="">
                            Is Administrator ...
                        </MenuItem>
                    {["yes","no"].map((option: string) => {
                        return <MenuItem key={option} value={option}>{option}</MenuItem>
                    })}    
                    </Select>
                </div>
                <Button variant="contained" className="flex-col mt-5 ml-[50px] h-[40px] w-[150px]" disabled={!filters.hasSelectedFilter} onClick={handleSearchClick}>Search</Button>
                <Button variant="contained" className="flex-col mt-5 ml-[30px] h-[40px] w-[150px]" onClick={openCreateUserModal}>Create User</Button>
            </div>
                <TableContainer sx={{ marginTop: 5}} component={Paper}>
                <Table sx={{ minWidth: 650}} aria-label="simple table">
                    <TableHead>
                    <TableRow>
                        <TableCell align="left" className="cursor-pointer font-semibold w-[200px]" onClick={() => handleSort('firstName')}>
                            Name {filters.sortColumn === 'firstName' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('lastName')}>
                            Surname {filters.sortColumn === 'lastName' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('username')}>
                            Username {filters.sortColumn === 'username' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="cursor-pointer font-semibold" onClick={() => handleSort('email')}>
                            Email {filters.sortColumn === 'email' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="left" className="font-semibold">
                            Administrator
                        </TableCell>
                        <TableCell align="center" className="font-semibold">Delete</TableCell>
                        <TableCell align="center" className="font-semibold">Update</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody className="text-base">
                        {users.map((user: any) => (
                            <TableRow
                            key={user.username}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                            <TableCell component="th" scope="row">
                                {user.firstName}
                            </TableCell>
                            <TableCell align="left">{user.lastName}</TableCell>
                            <TableCell align="left">{user.username}</TableCell>
                            <TableCell align="left">{user.email}</TableCell>
                            <TableCell align="left">{user.is_admin ? <CheckIcon /> : <NotInterestedIcon/>}</TableCell>
                            <TableCell align="center"><Button className="mt-1"><DeleteIcon className="cursor-pointer"
                                onClick={() => openDeleteUserModal(user)}/></Button></TableCell>
                            <TableCell align="center"><Button className="mt-1"><UpdateIcon className="cursor-pointer"
                                 onClick={() => openUsersDetailsModal(user)}/></Button></TableCell>
                            <TableCell>
                                <UsersDetailsModal open={isModalOpen}
                                    onClose={closeUserDetailsModal}
                                    user={selectedUser}
                                    create={isCreateModal()}/>
                                <DeleteUserModal open={isDeleteModalOpen}
                                    onClose={closeDeleteUserModal}
                                    user={selectedUser}/>
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