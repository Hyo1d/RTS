"use client";

import { useMemo, useState, type FormEvent } from "react";
import { RefreshCcw, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { apiMutation, invalidateTag, useApiQuery } from "@/lib/data/cache";

type AppUser = {
  id: string;
  email?: string;
  created_at?: string;
  invited_at?: string | null;
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

type EmployeeLite = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  status?: string | null;
  position?: string | null;
  department?: string | null;
};

interface AppUsersTableProps {
  initialUsers: AppUser[];
  initialEmployees: EmployeeLite[];
  supabaseAuthUrl?: string | null;
}

const toDisplayString = (value: unknown) => (typeof value === "string" ? value : "");

const getDisplayName = (user: AppUser) => {
  const metadata = user.user_metadata ?? {};
  const fullName =
    toDisplayString(metadata.full_name) || toDisplayString(metadata.name);
  return fullName || "-";
};

const getPrimaryLabel = (user: AppUser) => {
  const name = getDisplayName(user);
  return name === "-" ? user.email ?? "-" : name;
};

const getStatusInfo = (user: AppUser) => {
  if (user.email_confirmed_at || user.confirmed_at) {
    return { label: "Activo", variant: "success" as const };
  }
  if (user.invited_at) {
    return { label: "Invitado", variant: "secondary" as const };
  }
  return { label: "Pendiente", variant: "outline" as const };
};

const employeeStatusOptions = [
  { value: "active", label: "Activo", variant: "success" as const },
  { value: "on_leave", label: "Licencia", variant: "secondary" as const },
  { value: "vacation", label: "Vacaciones", variant: "outline" as const },
  { value: "inactive", label: "Desactivado", variant: "destructive" as const }
];

const getEmployeeStatusInfo = (status?: string | null) => {
  const normalized = status === "disabled" ? "inactive" : status;
  if (!normalized) {
    return null;
  }
  return employeeStatusOptions.find((option) => option.value === normalized) ?? null;
};

export function AppUsersTable({
  initialUsers,
  initialEmployees,
  supabaseAuthUrl
}: AppUsersTableProps) {
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeLite | null>(null);
  const [employeeStatus, setEmployeeStatus] = useState("active");
  const [employeePosition, setEmployeePosition] = useState("");
  const [employeeCompany, setEmployeeCompany] = useState("");
  const [savingEmployee, setSavingEmployee] = useState(false);
  const { data: usersData } = useApiQuery<AppUser[]>(
    "app-users",
    "/api/app-users",
    { page: 1, perPage: 200 },
    { fallbackData: { data: initialUsers } }
  );
  const { data: employeesData } = useApiQuery<EmployeeLite[]>(
    "employees",
    "/api/app-users/employees",
    undefined,
    { fallbackData: { data: initialEmployees } }
  );
  const users = usersData ?? [];
  const employees = employeesData ?? [];

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }
    return users.filter((user) => {
      const email = user.email?.toLowerCase() ?? "";
      const id = user.id.toLowerCase();
      const name = getDisplayName(user).toLowerCase();
      return email.includes(query) || id.includes(query) || name.includes(query);
    });
  }, [users, search]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  }, [filteredUsers]);

  const employeeByEmail = useMemo(() => {
    const map = new Map<string, EmployeeLite>();
    employees.forEach((employee) => {
      if (employee.email) {
        map.set(employee.email.toLowerCase(), employee);
      }
    });
    return map;
  }, [employees]);

  const employeeByUserId = useMemo(() => {
    const map = new Map<string, EmployeeLite>();
    employees.forEach((employee) => {
      if (employee.user_id) {
        map.set(employee.user_id, employee);
      }
    });
    return map;
  }, [employees]);

  const getEmployeeForUser = (user: AppUser) => {
    const byUserId = employeeByUserId.get(user.id);
    if (byUserId) {
      return byUserId;
    }
    if (!user.email) {
      return null;
    }
    return employeeByEmail.get(user.email.toLowerCase()) ?? null;
  };

  const openEmployeeEditor = (employee: EmployeeLite) => {
    const normalizedStatus =
      employee.status === "disabled" ? "inactive" : employee.status;
    setEditingEmployee(employee);
    setEmployeeStatus(normalizedStatus ?? "active");
    setEmployeePosition(employee.position ?? "");
    setEmployeeCompany(employee.department ?? "");
  };

  const closeEmployeeEditor = () => {
    setEditingEmployee(null);
  };

  const refreshUsers = async () => {
    setRefreshing(true);
    try {
      await Promise.all([invalidateTag("app-users"), invalidateTag("employees")]);
    } catch {
      toast.error("No se pudo actualizar la lista");
    } finally {
      setRefreshing(false);
    }
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = inviteEmail.trim();
    const fullName = inviteName.trim();

    if (!email) {
      toast.error("Ingresa un email valido");
      return;
    }

    setInviting(true);
    try {
      await apiMutation(
        "/api/app-users",
        {
          method: "POST",
          body: { email, fullName: fullName || undefined }
        },
        ["app-users", "employees"]
      );
      toast.success("Invitacion enviada");
      setInviteEmail("");
      setInviteName("");
      setInviteOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo invitar al usuario"
      );
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminar este usuario de la app?")) {
      return;
    }

    setDeletingId(id);
    try {
      await apiMutation(`/api/app-users/${id}`, { method: "DELETE" }, ["app-users"]);
      toast.success("Usuario eliminado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el usuario"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (user: AppUser) => {
    if (!user.email) {
      toast.error("Este usuario no tiene email");
      return;
    }
    if (!window.confirm(`Enviar correo de restablecimiento a ${user.email}?`)) {
      return;
    }

    setResettingId(user.id);
    try {
      await apiMutation("/api/app-users/reset-password", {
        method: "POST",
        body: { email: user.email }
      });
      toast.success("Correo de restablecimiento enviado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo enviar el correo"
      );
    } finally {
      setResettingId(null);
    }
  };

  const handleEmployeeSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingEmployee) {
      return;
    }

    setSavingEmployee(true);
    try {
      const payload = {
        status: employeeStatus || undefined,
        position: employeePosition.trim() || undefined,
        department: employeeCompany.trim() || undefined
      };
      await apiMutation(
        `/api/employees/${editingEmployee.id}`,
        { method: "PATCH", body: payload },
        ["employees"]
      );
      toast.success("Empleado actualizado");
      closeEmployeeEditor();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar el empleado"
      );
    } finally {
      setSavingEmployee(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <Dialog
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => {
          if (!open) {
            closeEmployeeEditor();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empleado</DialogTitle>
            <DialogDescription>
              Actualiza el estado, cargo y empresa del empleado.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEmployeeSave}>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label>Estado del empleado</Label>
                <Select value={employeeStatus} onValueChange={setEmployeeStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  placeholder="Cargo"
                  value={employeePosition}
                  onChange={(event) => setEmployeePosition(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input
                  placeholder="Empresa"
                  value={employeeCompany}
                  onChange={(event) => setEmployeeCompany(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEmployeeEditor}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingEmployee}>
                {savingEmployee ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Usuarios de la app</CardTitle>
          <CardDescription>Administra los accesos de Supabase Auth.</CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto">
          {supabaseAuthUrl ? (
            <Button asChild variant="outline">
              <a href={supabaseAuthUrl} target="_blank" rel="noreferrer">
                Abrir Supabase
              </a>
            </Button>
          ) : null}
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invitar usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invitar usuario</DialogTitle>
                <DialogDescription>
                  Envia un correo para que el usuario configure su acceso.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleInvite}>
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre (opcional)</Label>
                    <Input
                      placeholder="Nombre y apellido"
                      value={inviteName}
                      onChange={(event) => setInviteName(event.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? "Enviando..." : "Enviar invitacion"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-1 items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o ID"
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshUsers}
              disabled={refreshing}
            >
              <RefreshCcw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              {refreshing ? "Actualizando" : "Actualizar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredUsers.length} de {users.length} usuarios
          </p>
        </div>

        <div className="space-y-3 md:hidden">
          {sortedUsers.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
              No hay usuarios con esos filtros.
            </div>
          ) : (
            sortedUsers.map((user) => {
              const status = getStatusInfo(user);
              const employee = getEmployeeForUser(user);
              const employeeStatus = getEmployeeStatusInfo(employee?.status);
              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{getPrimaryLabel(user)}</p>
                      <p className="text-xs text-muted-foreground">{user.email ?? "-"}</p>
                      <p className="text-[11px] text-muted-foreground">ID {user.id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={status.variant}>App: {status.label}</Badge>
                      {employeeStatus ? (
                        <Badge variant={employeeStatus.variant}>
                          Empleado: {employeeStatus.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Empleado: -</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Ultimo acceso</span>
                      <span className="font-medium text-foreground">
                        {formatDate(user.last_sign_in_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Creado</span>
                      <span className="font-medium text-foreground">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cargo</span>
                      <span className="font-medium text-foreground">
                        {employee?.position ?? "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Empresa</span>
                      <span className="font-medium text-foreground">
                        {employee?.department ?? "-"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="grid gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => employee && openEmployeeEditor(employee)}
                        disabled={!employee}
                      >
                        Editar empleado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleResetPassword(user)}
                        disabled={resettingId === user.id || !user.email}
                      >
                        {resettingId === user.id ? "Enviando..." : "Restablecer password"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                      >
                        {deletingId === user.id ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-border/60 bg-background/70 md:block">
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado app</TableHead>
                <TableHead>Estado empleado</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Ultimo acceso</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                      <p>No hay usuarios con esos filtros.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => {
                  const status = getStatusInfo(user);
                  const employee = getEmployeeForUser(user);
                  const employeeStatus = getEmployeeStatusInfo(employee?.status);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{getPrimaryLabel(user)}</p>
                          <p className="text-xs text-muted-foreground">{user.email ?? "-"}</p>
                          <p className="text-[11px] text-muted-foreground">ID {user.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {employeeStatus ? (
                          <Badge variant={employeeStatus.variant}>{employeeStatus.label}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{employee?.position ?? "-"}</TableCell>
                      <TableCell>{employee?.department ?? "-"}</TableCell>
                      <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => employee && openEmployeeEditor(employee)}
                            disabled={!employee}
                          >
                            Editar empleado
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                            disabled={resettingId === user.id || !user.email}
                          >
                            {resettingId === user.id ? "Enviando..." : "Restablecer password"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? "Eliminando..." : "Eliminar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
