import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/auth/portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";
import {
  getMedicalCertificateExpiry,
  getMedicalCertificateStatus
} from "@/lib/utils/medical-certificates";

const MEDICAL_TYPES = ["certificado_medico", "certificados_medicos", "medical_certificate"];
const UNIFORM_TYPES = ["uniforme", "uniformes", "uniform"];

export default async function PortalDashboard() {
  const { user, employee } = await getPortalContext();
  if (!user) {
    return null;
  }

  if (!employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin empleado asociado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contacta al administrador para vincular tu usuario a un empleado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const supabase = await createServerClient();
  const [receiptsResponse, medicalResponse, uniformResponse] = await Promise.all([
    supabase
      .from("salary_receipts")
      .select("id, signed_at", { count: "exact" })
      .eq("employee_id", employee.id),
    supabase
      .from("employee_documents")
      .select("id, uploaded_at", { count: "exact" })
      .eq("employee_id", employee.id)
      .in("document_type", MEDICAL_TYPES)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("employee_documents")
      .select("id, signed_at", { count: "exact" })
      .eq("employee_id", employee.id)
      .in("document_type", UNIFORM_TYPES)
  ]);

  const receipts = receiptsResponse.data ?? [];
  const pendingReceipts = receipts.filter((receipt) => !receipt.signed_at).length;
  const medicalCount = medicalResponse.count ?? (medicalResponse.data ?? []).length;
  const medicalDocs = medicalResponse.data ?? [];
  const latestMedical = medicalDocs[0];
  const medicalStatus = getMedicalCertificateStatus(latestMedical?.uploaded_at);
  const medicalExpiry = getMedicalCertificateExpiry(latestMedical?.uploaded_at);
  const medicalLabel =
    medicalStatus === "valid"
      ? `Vigente hasta ${medicalExpiry ? formatDate(medicalExpiry) : "-"}`
      : medicalStatus === "expired"
        ? "Certificado vencido"
        : "Pendiente de carga";
  const uniformCount = uniformResponse.count ?? (uniformResponse.data ?? []).length;
  const pendingUniforms = (uniformResponse.data ?? []).filter((doc) => !doc.signed_at).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-semibold sm:text-2xl">Mi panel</h2>
        <p className="text-sm text-muted-foreground">
          Accede rapido a tus recibos, documentos y asistencia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Recibos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">{receipts.length}</p>
            <p className="text-xs text-muted-foreground">
              {pendingReceipts} sin firma
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/receipts">Ver recibos</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Certificados medicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">{medicalCount}</p>
            <p className="text-xs text-muted-foreground">{medicalLabel}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/medical-certificates">Ver certificados</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uniformes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">{uniformCount}</p>
            <p className="text-xs text-muted-foreground">
              {pendingUniforms} sin firma
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/uniforms">Ver uniformes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Asistencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">Hoy</p>
            <p className="text-xs text-muted-foreground">Fichar o registrar licencia</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/attendance">Ir a asistencia</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
