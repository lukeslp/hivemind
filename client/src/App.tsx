import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import HexMindApp from "./pages/HexMindApp";

// Base path for subpath deployment (e.g., /hexmind/)
const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

function AppRouter() {
  return (
    <Router base={BASE_PATH}>
      <Switch>
        <Route path={"/"} component={HexMindApp} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
