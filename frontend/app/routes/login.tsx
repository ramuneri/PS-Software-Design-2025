import { useState } from "react";
import { useNavigate } from "react-router";
import { useOutletContext } from "react-router";

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    const { setUser } = useOutletContext<{ setUser: React.Dispatch<React.SetStateAction<{ name?: string; email: string } | null>> }>();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem("access-token", result.accessToken);
            localStorage.setItem("user", JSON.stringify(result.user));
            setUser(result.user)
            navigate("/", { replace: true });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200">
            
            <div className="w-11/12 max-w-5xl bg-gray-300 rounded-md py-4 text-center mb-4">
                <h1 className="text-black text-sm font-medium">Please login</h1>
            </div>

            
            <div className="w-11/12 max-w-5xl bg-gray-300 rounded-md flex flex-col items-center justify-center py-16">
                <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6 text-center">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-medium text-black text-left"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full border border-black bg-white text-black px-2 py-2 focus:outline-none"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-medium text-black text-left"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full border border-black bg-white text-black px-2 py-2 focus:outline-none"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-48 bg-gray-400 text-black font-medium py-2 rounded-md hover:bg-gray-500"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
