import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/auth.tsx", [
    index("routes/home.tsx"),

    route("products", "routes/products.tsx"),

    route("orders/create", "routes/createOrder.tsx"),
    route("orders/view", "routes/ordersList.tsx"),
    route("orders/view/:id", "routes/viewOrder.tsx"),

    route("discounts", "routes/discounts/index.tsx"),
    route("discounts/create", "routes/discounts/create.tsx"),
    route("discounts/:id/edit", "routes/discounts/edit.tsx"),
    
    route("example", "routes/example.tsx"),
    route("debug", "routes/debug.tsx"),
  ]),
] satisfies RouteConfig;
