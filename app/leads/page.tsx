import Sidebar from "@/components/Sidebar";
import LeadsPage from "@/components/LeadsPage";

export default function Leads() {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0 }}>
        <LeadsPage />
      </div>
    </div>
  );
}
