import axios from "axios";
import { authBackendUrl } from "@/constants/url";

export async function submitLogin(username: string, password: string){
    return await axios.post(authBackendUrl+"/signin",{username,password});
}

export async function submitRegister(payload: any){
   return await axios.post(authBackendUrl+"/register", payload);
}