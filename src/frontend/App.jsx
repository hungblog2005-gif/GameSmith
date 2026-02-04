import MainLayout from "./layouts/MainLayout"
import Home from "./pages/Home"
import { ThemeProvider } from "./context/ThemeContext"

export default function App() {
  return (
    <ThemeProvider>
      <MainLayout>
        <Home />
      </MainLayout>
    </ThemeProvider>
  )
}
