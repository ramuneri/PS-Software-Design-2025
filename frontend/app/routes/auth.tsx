import { Navigate, Outlet, useLocation } from "react-router";
import Login from "~/routes/login";

export default function Auth() {
    const location = useLocation();
    
    if (localStorage.getItem("access-token")) {
        // check with backend if valid @/me
        // if not, exchange refresh token
        
        return <Outlet />
    } else {
        if (location.pathname !== "/")
            return <Navigate to={"/"} replace />
        
        return <Login  />
    }
}