import { Navigate, Outlet, useLocation } from "react-router";
import Login from "~/routes/login";

export default function Auth() {
    const location = useLocation();
    
    // Allow accept-invite route without authentication
    if (location.pathname === "/accept-invite") {
        return <Outlet />;
    }
    
    if (localStorage.getItem("access-token")) {
        return <Outlet />
    } else {
        if (location.pathname !== "/")
            return <Navigate to={"/"} replace />
        
        return <Login  />
    }
}