// import generated types
import type { Route } from "./+types/example";

export async function loader({ params }: Route.LoaderArgs) {
    return { exampleKey: "Example Value" };
}

export default function Component({ loaderData }: Route.ComponentProps) {
    return <div>{loaderData?.exampleKey ?? "Loading..."}</div>;
}