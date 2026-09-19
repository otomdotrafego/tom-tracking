import Sidebar from "@/components/Sidebar";
import LeadsPage from "@/components/LeadsPage";

export default function Leads() {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <LeadsPage />
    </div>
  );
}
