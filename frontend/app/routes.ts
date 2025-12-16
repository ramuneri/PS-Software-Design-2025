import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/auth.tsx", [
    index("routes/home.tsx"),
    
    
    route("orders/view", "routes/orders/index.tsx"),
    route("orders/create", "routes/orders/create.tsx"),
    route("orders/view/:id", "routes/orders/view.tsx"),
    route("orders/edit/:id", "routes/orders/edit.tsx"),
    route("orders/checkout/:id", "routes/orders/checkout.tsx"),
    route("orders/receipt/:id", "routes/orders/receipt.tsx"),
    
    route("discounts", "routes/discounts/index.tsx"),
    route("discounts/create", "routes/discounts/create.tsx"),
    route("discounts/:id/edit", "routes/discounts/edit.tsx"),
    
    route("services", "routes/services/index.tsx"),
    route("services/create", "routes/services/create.tsx"),
    route("services/:id/edit", "routes/services/edit.tsx"),
    
    route("products", "routes/products/index.tsx"),
    route("products/create", "routes/products/create.tsx"),
    route("products/:id/edit", "routes/products/edit.tsx"),

    route("service-charge-policies", "routes/serviceChargePolicies/index.tsx"),
    route("service-charge-policies/create", "routes/serviceChargePolicies/create.tsx"),
    route("service-charge-policies/:id/edit", "routes/serviceChargePolicies/edit.tsx"),

    route("payments", "routes/payments/index.tsx"),
    route("payments/create", "routes/payments/create.tsx"),
    route("payments/:id", "routes/payments/details.tsx"),
    route("payments/:id/edit", "routes/payments/edit.tsx"),

    route("reservations", "routes/reservations/index.tsx"),
    route("reservations/create", "routes/reservations/create.tsx"),
    route("reservations/:id/edit", "routes/reservations/edit.tsx"),
    route("reservations/calendar", "routes/reservations/calendar.tsx"),

    route("taxes", "routes/taxes/index.tsx"),
    route("taxes/create", "routes/taxes/create.tsx"),

    route("giftcards", "routes/giftcards/index.tsx"),
    route("giftcards/create", "routes/giftcards/create.tsx"),
    route("giftcards/view/:id", "routes/giftcards/view.tsx"),
    route("giftcards/edit/:id", "routes/giftcards/edit.tsx"),

    route("users", "routes/users/index.tsx"),
    route("users/create", "routes/users/create.tsx"),
    route("users/:id/edit", "routes/users/edit.tsx"),
    route("users/:id", "routes/users/details.tsx"),

    route("customers", "routes/customers/index.tsx"),
    route("customers/:id", "routes/customers/$id.tsx"),




    
    
    route("example", "routes/example.tsx"),
    route("debug", "routes/debug.tsx"),
  ]),
] satisfies RouteConfig;
