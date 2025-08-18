import { Route, Routes } from "react-router-dom";
import AccountsPage from "../pages/AccountPage";
import DisplayPage from "../pages/DisplayPage";
import FeedbackPage from "../pages/FeedbackPage";
import NavigationPage from "../pages/NavigationPage";
import WizardPage from "../pages/WizardPage";
// import ResizableSortableTable from "../components/ResizableSortableTable";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AccountsPage />} />
      <Route path="/wizard" element={<WizardPage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />

      <Route path="/navigation" element={<NavigationPage />} />
      {/* <Route
        path="/resizable-sortable-table"
        element={<ResizableSortableTable />}
      /> */}
    </Routes>
  );
}
