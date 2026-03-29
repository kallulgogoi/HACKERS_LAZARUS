import { Search, User, Activity, Shield } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";

const Sidebar = ({ patients, onSelect, selectedId }) => {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <aside className="w-full sm:w-80 h-full border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Patient Registry</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient ID or name..." className="pl-9" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {patients.map((patient) => (
            <Button
              key={patient.ghost_id}
              variant={selectedId === patient.ghost_id ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-4 ${
                selectedId === patient.ghost_id
                  ? "bg-primary text-primary-foreground"
                  : ""
              }`}
              onClick={() => onSelect(patient)}
            >
              <div className="flex items-start gap-3 w-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className={
                      selectedId === patient.ghost_id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted"
                    }
                  >
                    {getInitials(patient.decoded_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">
                      {patient.decoded_name}
                    </p>
                    <Badge
                      variant={
                        selectedId === patient.ghost_id
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {patient.ghost_id}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{patient.age} years</span>
                    <span>•</span>
                    <span>{patient.ward}</span>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secure Connection • HIPAA Compliant</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
