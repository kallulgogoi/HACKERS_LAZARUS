import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Pill, Lock, Unlock, ShieldCheck } from "lucide-react";

const PharmacyPortal = ({
  decodedMed = "Prednisone",
  scrambledMed = "Vtyvshasv",
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Pharmacy Portal
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Secure medication decryption system
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Encrypted Prescription
              </span>
            </div>
            <p className="font-mono text-sm text-muted-foreground line-through">
              {scrambledMed}
            </p>
            <Badge variant="outline" className="mt-2">
              Encryption Active
            </Badge>
          </div>

          <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Unlock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Decrypted Result
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-mono text-lg font-bold text-primary">
                {decodedMed}
              </p>
              <Badge className="bg-primary text-primary-foreground">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Confidence: 99.9%
            </p>
          </div>
        </div>

        <Alert className="mt-4">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This medication has been verified and approved for administration
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PharmacyPortal;
