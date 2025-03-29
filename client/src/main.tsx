import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import TestApp from "./TestApp"; // Import our test application
import "./index.css";

// Use the test app for development, comment this and uncomment below for production
createRoot(document.getElementById("root")!).render(
  <TestApp />
);

// Production app (uncomment to use)
/*
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
*/
