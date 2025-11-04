import { useRouter } from "next/router";
import { useEffect } from "react";
export function useAuthRedirect() {
    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if(!token){
            router.replace('/login');
        }
    }, []);
}
