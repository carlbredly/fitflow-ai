import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

const router = getRouter();
const root = document.getElementById("root")!;

const app = createRoot(root);
app.render(<RouterProvider router={router} />);
