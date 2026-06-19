import Sidebar from "@/components/ui/Sidebar";
import TopBar from "@/components/ui/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <TopBar />
      <main
        style={{
          marginRight: "var(--sidebar-w)",
          marginTop: "var(--topbar-h)",
          flex: 1,
          padding: 32,
          minHeight: "calc(100vh - var(--topbar-h))",
        }}
      >
        {children}
      </main>
    </div>
  );
}
