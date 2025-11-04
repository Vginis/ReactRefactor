import React from "react";
import { useRouter } from "next/router";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
  
const NavBar: React.FC = () => {
    const router = useRouter();
    
    const handleNavigation = (path:string) => {
        router.push(path);
    }

    const redirectTologout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("isAdmin")
        window.location.href = "/login";
    }
    return(
    <AppBar position="static" sx={{ background: "#2196f3"}}>
        <Toolbar>
            <Typography
                variant="h6" component="div"
                sx={{ flexGrow: 1, cursor: "pointer"}}
                onClick={() => handleNavigation("/")}>
                Library App
            </Typography>
            <Box>
                <Button color="inherit" sx={{ textTransform: "none"}} 
                    onClick={() => redirectTologout()}>
                    Logout
                </Button>
            </Box>
        </Toolbar>
    </AppBar>)
}

export default NavBar;