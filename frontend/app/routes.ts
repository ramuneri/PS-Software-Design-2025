import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/auth.tsx", [
    index("routes/home.tsx"),
    
    
    route("orders/view", "routes/orders/index.tsx"),
    route("orders/create", "routes/orders/create.tsx"),
    route("orders/view/:id", "routes/orders/view.tsx"),
    route("orders/edit/:id", "routes/orders/edit.tsx"),
    
    route("discounts", "routes/discounts/index.tsx"),
    route("discounts/create", "routes/discounts/create.tsx"),
    route("discounts/:id/edit", "routes/discounts/edit.tsx"),
    
    route("services", "routes/services/index.tsx"),
    route("services/create", "routes/services/create.tsx"),
    route("services/:id/edit", "routes/services/edit.tsx"),
    
    route("products", "routes/products/index.tsx"),
    route("products/create", "routes/products/create.tsx"),
    route("products/:id/edit", "routes/products/edit.tsx"),
    
    
    route("example", "routes/example.tsx"),
    route("debug", "routes/debug.tsx"),
  ]),
] satisfies RouteConfig;
