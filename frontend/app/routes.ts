import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/auth.tsx", [
    index("routes/home.tsx"),
    route("products", "routes/products.tsx"),
    route("orders/create", "routes/createOrder.tsx"),
    route("discounts", "routes/discounts.tsx"),

    // Services routes
    route("services", "routes/services/index.tsx"),
    route("services/create", "routes/services/create.tsx"),
    route("services/:id/edit", "routes/services/edit.tsx"),

    
    route("example", "routes/example.tsx"),
    route("debug", "routes/debug.tsx"),
  ]),
] satisfies RouteConfig;
