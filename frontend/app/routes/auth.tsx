import { Navigate, Outlet, useLocation, useOutletContext } from "react-router";
import Login from "~/routes/login";

type UserOutletContext = {
    setUser: React.Dispatch<
        React.SetStateAction<{ name?: string; email: string } | null>
    >;
};

export default function Auth() {
    const location = useLocation();
    const outletContext = useOutletContext<UserOutletContext>();
    
    // Allow accept-invite route without authentication
    if (location.pathname === "/accept-invite") {
        return <Outlet context={outletContext} />;
    }

    // Allow /login route without authentication (so redirects don't 404)
    if (location.pathname === "/login") {
        if (localStorage.getItem("access-token")) {
            return <Navigate to={"/"} replace />;
        }
        return <Outlet context={outletContext} />;
    }
    
    if (localStorage.getItem("access-token")) {
        return <Outlet context={outletContext} />
    } else {
        if (location.pathname !== "/")
            return <Navigate to={"/"} replace />
        
        return <Login  />
    }
}
