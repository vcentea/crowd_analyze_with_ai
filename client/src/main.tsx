import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add a title to the document
document.title = "Crowd Analytics Dashboard";

createRoot(document.getElementById("root")!).render(<App />);
