import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import IdentityCard from "./components/IdentityCard";
import VitalsChart from "./components/VitalsChart";
import PharmacyPortal from "./components/PharmacyPortal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Menu,
  Search,
  Database,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const App = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pagination & Infinite Scroll States
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const scrollContainerRef = useRef(null);

  const API_BASE_URL = "http://127.0.0.1:8000";

  // Optimized Fetch Logic
  const fetchPatients = useCallback(
    async (pageNum) => {
      if (isLoading || !hasMore) return;
      setIsLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/patients?skip=${pageNum * 20}&limit=20`,
        );
        const data = await response.json();

        const formatted = data.map((p) => ({
          ghost_id: p.patient_id,
          decoded_name: p.patient_name || "Unknown Identity",
          age: p.age,
          ward: p.status || "Unassigned", // Mapped from backend status
          bpm: p.hr_adjusted,
          spo2: p.spo2_adjusted,
        }));

        if (data.length < 20) setHasMore(false);
        setPatients((prev) => [...prev, ...formatted]);
      } catch (error) {
        console.error("Forensic Retrieval Error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore],
  );

  // Initial load
  useEffect(() => {
    if (patients.length === 0) fetchPatients(0);
  }, []);

  // Intersection Observer for Infinite Scroll
  const lastPatientElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchPatients(nextPage);
            return nextPage;
          });
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, fetchPatients],
  );

  // Dynamic Triage Alert Logic
  const getAlertDetails = () => {
    if (!selectedPatient) return null;

    // Severity mapping from backend status
    const severity = selectedPatient.ward;

    if (severity === "Critical") {
      return {
        color: "bg-destructive animate-pulse",
        icon: <AlertTriangle className="h-6 w-6" />,
        title: "CRITICAL SYSTEM ANOMALY",
        desc: `Immediate review required for ${selectedPatient.decoded_name}. Vitals: ${selectedPatient.bpm} BPM / ${selectedPatient.spo2}% SpO2.`,
      };
    }

    if (severity === "Warning") {
      return {
        color: "bg-yellow-600",
        icon: <AlertCircle className="h-6 w-6" />,
        title: "PHYSIOLOGICAL WARNING",
        desc: `Monitoring unstable vitals for ${selectedPatient.decoded_name}. Trend analysis suggested.`,
      };
    }

    return null;
  };

  const alert = getAlertDetails();

  // Scroll to Top on Patient Change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedPatient?.ghost_id]);

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.decoded_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ghost_id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, patients]);

  useEffect(() => {
    if (!selectedPatient) return;
    const newData = {
      timestamp: new Date().toLocaleTimeString(),
      bpm: selectedPatient.bpm,
      spo2: selectedPatient.spo2,
    };
    setTelemetry((prev) => [...prev.slice(-30), newData]);
  }, [selectedPatient]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex">
        <Sidebar
          patients={filteredPatients}
          onSelect={(p) => {
            setSelectedPatient(p);
            setSearchQuery("");
          }}
          selectedId={selectedPatient?.ghost_id}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          lastElementRef={lastPatientElementRef}
        />
      </div>

      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative"
      >
        {/* DYNAMIC STICKY ALERT */}
        {alert && (
          <div
            className={`sticky top-0 z-50 w-full ${alert.color} text-white px-4 py-3 shadow-xl flex items-center justify-center gap-3 border-b-2 border-black/20 animate-in slide-in-from-top duration-300`}
          >
            {alert.icon}
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-center">
              <span className="font-black text-lg uppercase tracking-tighter italic">
                {alert.title}
              </span>
              <span className="text-sm font-medium opacity-90">
                {alert.desc}
              </span>
            </div>
          </div>
        )}

        <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-6xl">
          <div className="flex flex-col gap-4 border-b pb-4 md:border-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="md:hidden">
                  <Sheet
                    open={isMobileMenuOpen}
                    onOpenChange={setIsMobileMenuOpen}
                  >
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80">
                      <Sidebar
                        patients={filteredPatients}
                        onSelect={(p) => {
                          setSelectedPatient(p);
                          setIsMobileMenuOpen(false);
                          setSearchQuery("");
                        }}
                        selectedId={selectedPatient?.ghost_id}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        lastElementRef={lastPatientElementRef}
                      />
                    </SheetContent>
                  </Sheet>
                </div>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                  Project{" "}
                  <span className="text-primary tracking-tighter uppercase">
                    Lazarus
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
              </div>
            </div>

            {/* MOBILE QUICK SEARCH */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search..."
                className="pl-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {selectedPatient ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <IdentityCard patient={selectedPatient} />
              <VitalsChart data={telemetry} />
              <PharmacyPortal />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 px-4">
              <Database className="h-12 w-12 text-primary opacity-80" />
              <div className="max-w-sm space-y-2">
                <h2 className="text-xl font-semibold uppercase tracking-tight">
                  Forensic Registry Awaiting Data
                </h2>
                <div className="w-full max-w-md relative group mt-4">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
                  <Input
                    placeholder="Search Reconstructed Identities..."
                    className="pl-10 h-12 border-2 focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && filteredPatients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-2xl z-50 overflow-hidden text-left">
                      {filteredPatients.slice(0, 5).map((p) => (
                        <button
                          key={p.ghost_id}
                          onClick={() => setSelectedPatient(p)}
                          className="w-full p-4 hover:bg-muted flex justify-between items-center border-b last:border-0"
                        >
                          <span className="font-medium">{p.decoded_name}</span>
                          <span className="text-xs font-mono opacity-60 uppercase">
                            {p.ghost_id}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
