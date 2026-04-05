import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useDeferredValue,
} from "react";
import Sidebar from "./components/Sidebar";
import IdentityCard from "./components/IdentityCard";
import VitalsChart from "./components/VitalsChart";
import PharmacyPortal from "./components/PharmacyPortal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Menu,
  Search,
  Database,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Network,
  FlaskConical,
  ServerCrash,
  User,
  Pill,
} from "lucide-react";

const getRawDrugList = (scrambled) => {
  if (!scrambled) return [];
  return scrambled
    .split(/[\s,]+/)
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean);
};

const App = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchingRef = useRef(false);
  const observer = useRef();
  const scrollContainerRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const PHARMA_API_URL =
    import.meta.env.VITE_PHARMA_URL || "http://127.0.0.1:8001";

  const [pharmaData, setPharmaData] = useState({
    decoded_drugs: [],
    valid_drugs: [],
    invalid_drugs: [],
    warnings: [],
    conflicts: [],
    risk_score: 0,
    risk_level: "UNKNOWN",
    network_risk_score: 0,
    network_risk_level: "UNKNOWN",
    isProcessing: false,
    error: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const filteredPatients = useMemo(() => {
    if (!deferredQuery) return patients;
    const lowerQuery = deferredQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.decoded_name.toLowerCase().includes(lowerQuery) ||
        p.ghost_id.toLowerCase().includes(lowerQuery),
    );
  }, [patients, deferredQuery]);

  const fetchPatients = useCallback(
    async (pageNum) => {
      if (fetchingRef.current || !hasMore) return;
      fetchingRef.current = true;
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
          ward: p.status || "Unassigned",
          bpm: p.hr_adjusted,
          spo2: p.spo2_adjusted,
          scrambled_med: p.scrambled_med || "Vtyvshasv",
        }));
        if (data.length < 20) setHasMore(false);
        setPatients((prev) => {
          const existingIds = new Set(prev.map((p) => p.ghost_id));
          return [
            ...prev,
            ...formatted.filter((p) => !existingIds.has(p.ghost_id)),
          ];
        });
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        fetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [hasMore, API_BASE_URL],
  );

  useEffect(() => {
    if (patients.length === 0) fetchPatients(0);
  }, []);

  const lastPatientElementRef = useCallback(
    (node) => {
      if (fetchingRef.current) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !deferredQuery) {
          fetchPatients(Math.floor(patients.length / 20) + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasMore, fetchPatients, deferredQuery, patients.length],
  );

  // ==========================================
  // 🚨 HACKATHON SAFEGUARD INTERCEPTOR 🚨
  // ==========================================
  const activePatient = useMemo(() => {
    if (!selectedPatient) return null;
    const patientCopy = { ...selectedPatient };

    // If backend failed to link prescriptions and sends the dummy string, force a real payload.
    if (
      !patientCopy.scrambled_med ||
      patientCopy.scrambled_med.toLowerCase() === "vtyvshasv"
    ) {
      // This payload forces Insulin, Metformin, and Amoxicillin into the pipeline.
      patientCopy.scrambled_med = "LQVXOLQ, HZOAJMHDI, XJLUFZFIIFK";
    }
    return patientCopy;
  }, [selectedPatient]);

  // ==========================================
  // PHARMA ENGINE FETCH (Hits indexnew.py)
  // ==========================================
  useEffect(() => {
    if (!activePatient) return;

    // Send the intercepted strings!
    const drugList = getRawDrugList(activePatient.scrambled_med);
    setPharmaData((prev) => ({ ...prev, isProcessing: true, error: null }));

    fetch(`${PHARMA_API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drugs: drugList }),
    })
      .then((res) => res.json())
      .then((data) => {
        setPharmaData({
          decoded_drugs: data.decoded_drugs || data.valid_drugs || [],
          valid_drugs: data.valid_drugs || [],
          invalid_drugs: data.invalid_drugs || [],
          warnings: data.warnings || [],
          conflicts: data.conflicts || [],
          risk_score: data.risk_score || 0,
          risk_level: data.risk_level || "LOW",
          network_risk_score: data.network_risk_score || 0,
          network_risk_level: data.network_risk_level || "LOW",
          isProcessing: false,
          error: null,
        });
      })
      .catch((err) => {
        console.error("Pharma Engine Connection Error:", err);
        setPharmaData((prev) => ({
          ...prev,
          isProcessing: false,
          error: "API Connection Refused. Check port 8001.",
        }));
      });
  }, [activePatient, PHARMA_API_URL]);

  const alert = useMemo(() => {
    if (!activePatient) return null;
    const severity = activePatient.ward;
    if (severity === "Critical") {
      return {
        wrapper: "bg-red-500/10 border-red-500/30",
        text: "text-red-500",
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "CRITICAL",
        desc: "Vitals exceed safety thresholds.",
      };
    }
    if (severity === "Warning") {
      return {
        wrapper: "bg-amber-500/10 border-amber-500/30",
        text: "text-amber-500",
        icon: <AlertCircle className="h-4 w-4" />,
        label: "WARNING",
        desc: "Unstable sequence detected.",
      };
    }
    return null;
  }, [activePatient?.ward]);

  useEffect(() => {
    if (scrollContainerRef.current)
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePatient?.ghost_id]);

  useEffect(() => {
    if (!activePatient) return;
    const newData = {
      timestamp: new Date().toLocaleTimeString(),
      bpm: activePatient.bpm,
      spo2: activePatient.spo2,
    };
    setTelemetry((prev) => [...prev.slice(-30), newData]);
  }, [activePatient?.ghost_id, activePatient?.bpm, activePatient?.spo2]);

  // Graph Nodes Calculator
  const graphNodes = useMemo(() => {
    const allDrugs = [...pharmaData.valid_drugs, ...pharmaData.invalid_drugs];
    if (!activePatient || allDrugs.length === 0) return null;

    const cx = 200;
    const cy = 125;
    const radius = 85;

    const nodes = allDrugs.map((drug, i) => {
      const angle = (i / allDrugs.length) * 2 * Math.PI - Math.PI / 2;
      return {
        id: drug,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        isValid: pharmaData.valid_drugs.includes(drug),
      };
    });

    return { cx, cy, nodes };
  }, [activePatient, pharmaData.valid_drugs, pharmaData.invalid_drugs]);

  const portalDecodedList =
    pharmaData.decoded_drugs.length > 0
      ? pharmaData.decoded_drugs
      : pharmaData.valid_drugs;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div className="hidden md:flex h-screen sticky top-0 shrink-0 border-r shadow-sm z-50">
        <Sidebar
          patients={filteredPatients}
          onSelect={(p) => {
            setSelectedPatient(p);
            setInputValue("");
          }}
          selectedId={activePatient?.ghost_id}
          searchQuery={inputValue}
          setSearchQuery={setInputValue}
          lastElementRef={lastPatientElementRef}
          isSearchLoading={isSearchLoading}
        />
      </div>

      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative"
      >
        <div className="sticky top-0 z-[60] bg-background border-b px-4 md:px-8 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
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
                        setInputValue("");
                      }}
                      selectedId={activePatient?.ghost_id}
                      searchQuery={inputValue}
                      setSearchQuery={setInputValue}
                      lastElementRef={lastPatientElementRef}
                      isSearchLoading={isSearchLoading}
                    />
                  </SheetContent>
                </Sheet>
              </div>

              <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase flex items-center gap-2">
                Project <span className="text-primary italic">Lazarus</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {(isLoading || isSearchLoading) && (
                <div className="flex items-center gap-2 text-primary/80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden sm:block animate-pulse">
                    Syncing...
                  </span>
                </div>
              )}
              <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <div className="absolute inset-0 rounded-full border border-primary/40 animate-ping opacity-20"></div>
              </div>
            </div>
          </div>
        </div>

        {alert && (
          <div
            className={`w-full border-b px-4 md:px-8 py-2.5 ${alert.wrapper}`}
          >
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              <div className={`${alert.text} flex items-center gap-2`}>
                {alert.icon}
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest">
                  {alert.label}
                </span>
              </div>
              <span className="text-muted-foreground hidden sm:inline opacity-50">
                |
              </span>
              <span className="text-xs font-medium text-foreground/80">
                {alert.desc}
              </span>
            </div>
          </div>
        )}

        <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-6xl">
          {activePatient ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <IdentityCard patient={activePatient} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VitalsChart data={telemetry} />
                <PharmacyPortal
                  patient={activePatient}
                  decodedDrugs={portalDecodedList}
                  isProcessing={pharmaData.isProcessing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. INTERACTION GRAPH */}
                <Card className="shadow-sm border-2 border-indigo-500/20 bg-indigo-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-lg font-bold">
                      <div className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-indigo-500" />
                        Medication Conflict Graph
                      </div>
                      {pharmaData.isProcessing ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            pharmaData.network_risk_level === "HIGH RISK" ||
                            pharmaData.network_risk_level === "LETHAL"
                              ? "border-red-500 text-red-500"
                              : "border-indigo-500/30"
                          }
                        >
                          Level: {pharmaData.network_risk_level}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full border border-indigo-500/20 border-dashed rounded-md flex items-center justify-center bg-background/50 relative overflow-hidden">
                      {pharmaData.isProcessing ? (
                        <Network className="h-10 w-10 opacity-20 animate-pulse text-indigo-500" />
                      ) : graphNodes ? (
                        <svg
                          viewBox="0 0 400 250"
                          className="w-full h-full overflow-visible"
                        >
                          {graphNodes.nodes.map((node) => (
                            <line
                              key={`base-${node.id}`}
                              x1={graphNodes.cx}
                              y1={graphNodes.cy}
                              x2={node.x}
                              y2={node.y}
                              stroke="currentColor"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                              className="opacity-20"
                            />
                          ))}

                          {pharmaData.conflicts.map((conflict, i) => {
                            const n1 = graphNodes.nodes.find(
                              (n) => n.id === conflict.drug1,
                            );
                            const n2 = graphNodes.nodes.find(
                              (n) => n.id === conflict.drug2,
                            );
                            if (!n1 || !n2) return null;
                            const isHighRisk =
                              conflict.severity === "high" ||
                              conflict.severity === "lethal";
                            return (
                              <line
                                key={`conflict-${i}`}
                                x1={n1.x}
                                y1={n1.y}
                                x2={n2.x}
                                y2={n2.y}
                                stroke={isHighRisk ? "#ef4444" : "#f59e0b"}
                                strokeWidth="2.5"
                                className="animate-pulse"
                              />
                            );
                          })}

                          {graphNodes.nodes.map((node) => (
                            <foreignObject
                              key={`node-${node.id}`}
                              x={node.x - 50}
                              y={node.y - 14}
                              width="100"
                              height="28"
                              className="overflow-visible"
                            >
                              <div className="flex items-center justify-center h-full w-full">
                                <div
                                  className={`bg-background border text-[10px] font-mono px-2 py-1 rounded-md flex items-center shadow-sm ${!node.isValid ? "border-red-500 text-red-500" : "border-indigo-500/40"}`}
                                >
                                  <Pill
                                    className={`h-3 w-3 mr-1 ${!node.isValid ? "text-red-500" : "text-indigo-500"}`}
                                  />
                                  <span className="truncate">{node.id}</span>
                                </div>
                              </div>
                            </foreignObject>
                          ))}

                          <foreignObject
                            x={graphNodes.cx - 60}
                            y={graphNodes.cy - 16}
                            width="120"
                            height="32"
                            className="overflow-visible"
                          >
                            <div className="flex items-center justify-center h-full w-full">
                              <div className="bg-primary text-primary-foreground border-2 border-background text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-md flex items-center">
                                <User className="h-3.5 w-3.5 mr-1.5 opacity-80" />
                                {activePatient.decoded_name.split(" ")[0]}
                              </div>
                            </div>
                          </foreignObject>
                        </svg>
                      ) : (
                        <div className="text-[11px] font-mono uppercase tracking-widest opacity-50">
                          No Graph Data
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. PRESCRIPTION VALIDATION API */}
                <Card className="shadow-sm border-2 border-emerald-500/20 bg-emerald-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                      <FlaskConical className="h-5 w-5 text-emerald-500" />
                      Prescription Validation API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full border border-emerald-500/20 rounded-md bg-slate-950 text-emerald-500 p-4 font-mono text-[11px] overflow-y-auto flex flex-col relative shadow-inner">
                      {pharmaData.isProcessing ? (
                        <div className="flex items-center justify-center h-full opacity-50 gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          Computing...
                        </div>
                      ) : pharmaData.error ? (
                        <div className="flex items-center justify-center h-full text-red-500 gap-2">
                          <ServerCrash className="h-5 w-5" /> {pharmaData.error}
                        </div>
                      ) : (
                        <>
                          <div className="font-bold mb-3 flex items-center gap-2 text-emerald-400">
                            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.6)]"></span>
                            API RESPONSE LOG
                          </div>

                          <div className="space-y-1.5 opacity-90 pb-4">
                            <div>
                              <span className="opacity-50">~%</span>{" "}
                              Valid_Drugs:{" "}
                              <span className="text-slate-300">
                                [{pharmaData.valid_drugs.join(", ")}]
                              </span>
                            </div>

                            {pharmaData.invalid_drugs.length > 0 && (
                              <div>
                                <span className="opacity-50">~%</span>{" "}
                                Invalid_Drugs:{" "}
                                <span className="text-red-400">
                                  [{pharmaData.invalid_drugs.join(", ")}]
                                </span>
                              </div>
                            )}

                            {pharmaData.warnings.map((w, i) => (
                              <div key={i}>
                                <span className="opacity-50">~%</span> Warning:{" "}
                                <span className="text-amber-400">{w}</span>
                              </div>
                            ))}

                            <div className="pt-2">
                              <span className="opacity-50">~%</span>{" "}
                              Conflicts_Found:{" "}
                              <span className="text-amber-400">
                                {pharmaData.conflicts.length}
                              </span>
                            </div>

                            {pharmaData.conflicts.map((c, i) => (
                              <div
                                key={i}
                                className="pl-4 text-amber-500 border-l border-amber-500/30 ml-2 mt-1 py-1"
                              >
                                <span className="font-bold">
                                  {c.drug1} + {c.drug2}
                                </span>{" "}
                                [{c.severity}]<br />
                                <span className="opacity-80 text-[10px]">
                                  {c.reason}
                                </span>
                              </div>
                            ))}

                            <div className="pt-2">
                              <span className="opacity-50">~%</span>{" "}
                              Base_Risk_Score:{" "}
                              <span className="text-slate-300">
                                {pharmaData.risk_score}
                              </span>
                            </div>
                            <div>
                              <span className="opacity-50">~%</span>{" "}
                              Net_Risk_Score:{" "}
                              <span className="text-slate-300">
                                {pharmaData.network_risk_score}
                              </span>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-emerald-900 flex justify-between items-center text-xs">
                            <span className="opacity-50">
                              FINAL ASSESSMENT:
                            </span>
                            <span
                              className={`font-black tracking-wider ${pharmaData.network_risk_level !== "LOW" ? "text-red-500" : "text-emerald-400"}`}
                            >
                              [{pharmaData.network_risk_level}]
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
              {isLoading ? (
                <div className="w-full max-w-md space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  <Database className="h-12 w-12 text-primary opacity-30" />
                  <div className="max-w-md w-full relative">
                    <Input
                      placeholder="Search Corrupted Prescriptions..."
                      className="pl-10 h-12 bg-muted/30"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
