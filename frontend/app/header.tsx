import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";

interface HeaderProps {
    userName: string;
    setUser: React.Dispatch<React.SetStateAction<{ name: string } | null>>;
}

export default function Header({ userName, setUser }: HeaderProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("access-token");
            await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ allSessions: false }),
                credentials: "include",
            });
        } finally {
            localStorage.removeItem("access-token");
            localStorage.removeItem("user");
            setUser(null);
            navigate("/");
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center py-2 px-4 sm:px-6">
                <Link to={"/"} className="text-lg font-semibold cursor-pointer">OMS</Link>

                <div className="flex items-center">
                    <span className="mr-3 text-sm font-medium text-gray-700">
                        Hello, {userName}!
                    </span>
                    
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={(e) => {
                                setDropdownOpen(!dropdownOpen);
                                (e.target as HTMLButtonElement).blur();
                            }}
                            className="w-9 h-9 rounded-full bg-blue-500 text-white font-semibold flex items-center justify-center cursor-pointer"
                        >
                            {userName[0].toUpperCase()}
                        </button>

                        {dropdownOpen && (
                            <div
                                className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-md overflow-hidden z-50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
