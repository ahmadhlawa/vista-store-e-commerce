import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import App from "./App";

function RoutedApp() {
  const location = useLocation();
  const navigate = useNavigate();
  return <App pathname={location.pathname} navigate={navigate} />;
}

export default function AppRouter() {
  return <BrowserRouter><RoutedApp /></BrowserRouter>;
}
