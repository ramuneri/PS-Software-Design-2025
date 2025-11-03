import type { Route } from "./+types/home";
import {Link} from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "OMS" },
  ];
}

export default function Home() {
  return <Link to={"/example"}>Go to /example</Link>
}
