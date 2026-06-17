import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import SemiFinished from "@/pages/SemiFinished";
import MoldPrep from "@/pages/MoldPrep";
import PlateVulcanization from "@/pages/PlateVulcanization";
import TankVulcanization from "@/pages/TankVulcanization";
import Demolding from "@/pages/Demolding";
import AppearanceInspection from "@/pages/AppearanceInspection";
import PhysicalInspection from "@/pages/PhysicalInspection";
import EnergyStatistics from "@/pages/EnergyStatistics";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/semi-finished" element={<SemiFinished />} />
          <Route path="/mold-prep" element={<MoldPrep />} />
          <Route path="/plate-vulcanization" element={<PlateVulcanization />} />
          <Route path="/tank-vulcanization" element={<TankVulcanization />} />
          <Route path="/demolding" element={<Demolding />} />
          <Route path="/appearance-inspection" element={<AppearanceInspection />} />
          <Route path="/physical-inspection" element={<PhysicalInspection />} />
          <Route path="/energy-statistics" element={<EnergyStatistics />} />
        </Route>
      </Routes>
    </Router>
  );
}
