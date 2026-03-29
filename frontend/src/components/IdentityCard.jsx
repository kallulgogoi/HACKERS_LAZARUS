import { User, MapPin, Calendar, Shield, CheckCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";

const IdentityCard = ({ patient }) => {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/5 to-transparent p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(patient.decoded_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Badge variant="secondary" className="mb-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Identity Verified
                </Badge>
                <h2 className="text-2xl font-bold">{patient.decoded_name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Patient ID: {patient.ghost_id}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Patient Information
              </p>
              <p className="text-sm font-semibold mt-1">
                {patient.decoded_name}
              </p>
              <p className="text-xs text-muted-foreground">
                Registered Patient
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ward Assignment
              </p>
              <p className="text-sm font-semibold mt-1">{patient.ward}</p>
              <p className="text-xs text-muted-foreground">Sector: Medical</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Age Specification
              </p>
              <p className="text-2xl font-bold mt-1">{patient.age}</p>
              <p className="text-xs text-muted-foreground">Years</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="p-6 bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>All patient data is encrypted and secure</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IdentityCard;
