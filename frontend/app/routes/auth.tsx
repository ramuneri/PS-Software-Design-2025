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

  const hasToken = Boolean(localStorage.getItem("access-token"));
  const isAcceptInvite = location.pathname === "/accept-invite";
  const isLogin = location.pathname === "/login";

  // Routes that must be accessible without being logged in.
  if (isAcceptInvite || isLogin) {
    if (isLogin && hasToken) {
      return <Navigate to={"/"} replace />;
    }
    return <Outlet context={outletContext} />;
  }

  if (hasToken) {
    return <Outlet context={outletContext} />;
  }

  if (location.pathname !== "/") {
    return <Navigate to={"/"} replace />;
  }

  return <Login />;
}
