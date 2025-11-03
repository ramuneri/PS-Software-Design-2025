import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/auth.tsx", [
        index("routes/home.tsx"),
        
        route("example", "routes/example.tsx")
    ]),
] satisfies RouteConfig;
