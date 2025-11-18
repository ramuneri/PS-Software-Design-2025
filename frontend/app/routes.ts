import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/auth.tsx", [
    index("routes/home.tsx"),

    route("example", "routes/example.tsx"),

    route("debug", "routes/debug.tsx"),
  ]),
] satisfies RouteConfig;
