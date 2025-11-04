import { useEffect, useState } from "react";
import "../../styles/globals.css";
import { sideBarOptions } from "@/constants/sidebarOptions";

interface SideBarProps {
  onSelectView: (view: 'books' | 'administration' | 'previous_orders' | 'current_cart') => void;
}

const SideBar: React.FC<SideBarProps> = ({ onSelectView }) => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const isAdminFlag = localStorage.getItem("isAdmin") === "true";
        setIsAdmin(isAdminFlag);
    })
    return (
        <div className="h-screen w-48 bg-navbarBlue text-white">
            <p className="text-center mt-1">Options</p>
            <ul>
                {sideBarOptions.map((option) => {
                    if(option.administratorOnly && !isAdmin){
                        return;
                    } else {
                        return <li key={option.description} className="my-2 hover:bg-sky-700 p-3">
                                <button className="w-full" onClick={() => onSelectView(option.key)}>
                                    {option.description}</button>
                                </li>
                    }
                })}
            </ul>
        </div>
    );
};

export default SideBar;