import { useState, useEffect, useMemo, useRef } from "react"; // Added useRef
import Sidebar from "./components/Sidebar";
import IdentityCard from "./components/IdentityCard";
import VitalsChart from "./components/VitalsChart";
import PharmacyPortal from "./components/PharmacyPortal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  AlertCircle,
  Menu,
  Search,
  Database,
  AlertTriangle,
} from "lucide-react";

const App = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [criticalAlert, setCriticalAlert] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollContainerRef = useRef(null);

  const mockPatients = [
    {
      ghost_id: "PID-902",
      decoded_name: "John Doe",
      age: 34,
      ward: "Ward A - Cardiology",
    },
    {
      ghost_id: "PID-441",
      decoded_name: "Jane Smith",
      age: 29,
      ward: "Ward B - Neurology",
    },
  ];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedPatient?.ghost_id]);

  const filteredPatients = useMemo(() => {
    return mockPatients.filter(
      (p) =>
        p.decoded_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ghost_id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedPatient) return;
    const interval = setInterval(() => {
      const newData = {
        timestamp: new Date().toLocaleTimeString(),
        bpm: Math.floor(Math.random() * (110 - 55 + 1) + 55),
        spo2: Math.floor(Math.random() * (99 - 94 + 1) + 94),
      };
      setTelemetry((prev) => [...prev.slice(-30), newData]);
      setCriticalAlert(newData.bpm < 60 || newData.bpm > 100); //
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedPatient]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setIsMobileMenuOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar
          patients={filteredPatients}
          onSelect={handlePatientSelect}
          selectedId={selectedPatient?.ghost_id}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative"
      >
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
                        onSelect={handlePatientSelect}
                        selectedId={selectedPatient?.ghost_id}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                      />
                    </SheetContent>
                  </Sheet>
                </div>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                  Project <span className="text-primary">Lazarus</span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
                <span className="text-xs text-muted-foreground hidden sm:inline uppercase tracking-widest font-mono">
                  System Online
                </span>
              </div>
            </div>

            <div className="relative md:hidden">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search patients..."
                className="pl-9 h-10 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {criticalAlert && (
            <Alert variant="destructive" className="animate-bounce">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Critical Alert: Patient vitals outside normal range (60-100
                BPM).
              </AlertDescription>
            </Alert>
          )}

          {selectedPatient ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <IdentityCard patient={selectedPatient} />
              <VitalsChart data={telemetry} />
              <PharmacyPortal />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 px-4">
              <div className="bg-primary/10 p-6 rounded-full">
                <Database className="h-12 w-12 text-primary opacity-80" />
              </div>
              <div className="max-w-sm space-y-2">
                <h2 className="text-xl font-semibold">
                  Forensic Registry Awaiting Data
                </h2>
                <p className="text-sm text-muted-foreground">
                  Search for a reconstructed identity to view real-time
                  telemetry and pharmacy logs. [cite: 2]
                </p>
              </div>

              <div className="w-full max-w-md relative group">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Type Name or ID to reconstruct..."
                  className="pl-10 h-12 text-lg shadow-sm border-2 focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-xl z-50 overflow-hidden text-left">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((p) => (
                        <button
                          key={p.ghost_id}
                          onClick={() => handlePatientSelect(p)}
                          className="w-full p-4 hover:bg-muted flex justify-between items-center border-b last:border-0"
                        >
                          <span className="font-medium">{p.decoded_name}</span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {p.ghost_id}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground italic">
                        No forensic matches found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
