import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import HiveMindApp from "./pages/HiveMindApp";

// Base path for subpath deployment (e.g., /hivemind/)
const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

function AppRouter() {
  return (
    <Router base={BASE_PATH}>
      <Switch>
        <Route path={"/"} component={HiveMindApp} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
