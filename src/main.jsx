import React from "react"
import ReactDOM from "react-dom/client"
import App from "./frontend/App.jsx"
import "./index.css"
import { ThemeProvider } from "./frontend/context/ThemeContext.jsx"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
