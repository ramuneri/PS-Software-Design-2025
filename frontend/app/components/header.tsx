import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";

interface HeaderProps {
    userName?: string;
    email: string;
    setUser: React.Dispatch<React.SetStateAction<{ name?: string; email: string } | null>>;
}

export default function Header({ userName, email, setUser }: HeaderProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        //fallback
        navigate("/");
    };

    const showBackButton = location.pathname !== "/";

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

    const displayName = userName?.trim() || email;
    const avatarLetter = displayName?.[0]?.toUpperCase() || "?";

    return (
        <header className="bg-gray-300 py-3 px-6 flex justify-between items-center">
            {/* Left side - Logo */}
            <div className="flex items-center gap-3">
                {showBackButton && (
                    <button
                        onClick={handleBack}
                        className="bg-gray-200 border border-black rounded-md px-3 py-1 text-black text-sm hover:bg-gray-300"
                        title="<- Back"
                    >
                        Back
                    </button>
                )}

                <Link to={"/"} className="text-black text-base font-medium">
                    OMS
                </Link>
            </div>

            {/* Right side - User info */}
            <div className="flex items-center space-x-2">
                <span className="text-black text-sm">Hi, {displayName}!</span>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={(e) => {
                            setDropdownOpen(!dropdownOpen);
                            (e.target as HTMLButtonElement).blur();
                        }}
                        className="w-8 h-8 rounded-full bg-gray-400 text-black font-semibold flex items-center justify-center cursor-pointer hover:bg-gray-500"
                    >
                        {avatarLetter}
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-1 w-36 bg-gray-200 border border-black rounded-md overflow-hidden z-50">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-300"
                            >
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
