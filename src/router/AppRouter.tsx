import { Route, Routes } from "react-router-dom";
import AccountsPage from "../pages/AccountPage";
import DisplayPage from "../pages/DisplayPage";
import FeedbackPage from "../pages/FeedbackPage";
import NavigationPage from "../pages/NavigationPage";
import WizardPage from "../pages/WizardPage";
import SmoothResizableTable from "../pages/ResizableTable";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AccountsPage />} />
      <Route path="/wizard" element={<WizardPage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/test" element={<SmoothResizableTable />} />
      <Route path="/navigation" element={<NavigationPage />} />
    </Routes>
  );
}
