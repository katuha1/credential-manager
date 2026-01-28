"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ArrowUpDown,
  ArrowLeft,
  Building2,
} from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getDevicesByEnterprise,
  getEnterpriseById,
  createDevice,
  updateDevice,
  deleteDevice,
  type DeviceInput,
} from "@/lib/actions/devices";
import { getDeviceTypes } from "@/lib/actions/device-types";

interface City {
  id: string | null;
  name: string | null;
}

interface Enterprise {
  id: string;
  name: string;
  cityId: string;
  city: City | null;
}

interface DeviceType {
  id: string;
  name: string;
  icon?: string | null;
}

interface Device {
  id: string;
  name: string;
  enterpriseId: string;
  ipAddress: string;
  deviceTypeId: string;
  login: string | null;
  password: string | null;
  connectedPort: string | null;
  macAddress: string | null;
  additionalInfo: string | null;
  deviceType?: DeviceType;
  enterprise: Enterprise | null;
}

export default function EnterpriseDevicesPage() {
  const params = useParams();
  const enterpriseId = params.enterpriseId as string;

  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [formData, setFormData] = useState<DeviceInput>({
    name: "",
    enterpriseId: "",
    ipAddress: "",
    deviceTypeId: "",
    login: "",
    password: "",
    connectedPort: "",
    macAddress: "",
    additionalInfo: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [enterpriseId]);

  async function fetchData() {
    setLoading(true);
    const [enterpriseRes, devicesRes, typesRes] = await Promise.all([
      getEnterpriseById(enterpriseId),
      getDevicesByEnterprise(enterpriseId),
      getDeviceTypes(),
    ]);

    if (enterpriseRes.error) {
      console.error("[v0] Error fetching enterprise:", enterpriseRes.error);
    } else {
      setEnterprise(enterpriseRes.data as Enterprise | null);
    }

    if (devicesRes.error) {
      console.error("[v0] Error fetching devices:", devicesRes.error);
    } else {
      setDevices((devicesRes.data || []) as Device[]);
    }

    if (typesRes.error) {
      console.error("[v0] Error fetching device types:", typesRes.error);
    } else {
      setDeviceTypes((typesRes.data || []) as DeviceType[]);
    }
    setLoading(false);
  }

  function getDeviceTypeLabel(typeId: string) {
    return deviceTypes.find((t) => t.id === typeId)?.name || typeId;
  }

  function togglePassword(deviceId: string) {
    setShowPasswords((prev) => ({ ...prev, [deviceId]: !prev[deviceId] }));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function handleAdd() {
    setEditingDevice(null);
    setFormData({
      name: "",
      enterpriseId: enterpriseId,
      ipAddress: "",
      deviceTypeId: deviceTypes.length > 0 ? deviceTypes[0].id : "",
      login: "",
      password: "",
      connectedPort: "",
      macAddress: "",
      additionalInfo: "",
    });
    setDialogOpen(true);
  }

  function handleEdit(device: Device) {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      enterpriseId: device.enterpriseId,
      ipAddress: device.ipAddress,
      deviceTypeId: device.deviceTypeId,
      login: device.login || "",
      password: device.password || "",
      connectedPort: device.connectedPort || "",
      macAddress: device.macAddress || "",
      additionalInfo: device.additionalInfo || "",
    });
    setDialogOpen(true);
  }

  function handleDeleteClick(device: Device) {
    setDeletingDevice(device);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.ipAddress) return;

    setSaving(true);
    try {
      if (editingDevice) {
        const { error } = await updateDevice(editingDevice.id, formData);
        if (error) throw new Error(error);
      } else {
        const { error } = await createDevice(formData);
        if (error) throw new Error(error);
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("[v0] Error saving device:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingDevice) return;

    try {
      const { error } = await deleteDevice(deletingDevice.id);
      if (error) throw new Error(error);

      setDeleteDialogOpen(false);
      setDeletingDevice(null);
      fetchData();
    } catch (error) {
      console.error("[v0] Error deleting device:", error);
    }
  }

  const columns: ColumnDef<Device>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0"
          >
            Название
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "deviceTypeId",
        header: "Тип",
        cell: ({ row }) => (
          <Badge variant="outline">
            {getDeviceTypeLabel(row.getValue("deviceTypeId") as string)}
          </Badge>
        ),
      },
      {
        accessorKey: "ipAddress",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0"
          >
            IP адрес
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm">
              {row.getValue("ipAddress")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() =>
                copyToClipboard(row.getValue("ipAddress") as string)
              }
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "login",
        header: "Логин",
        cell: ({ row }) => {
          const device = row.original;
          return device.login ? (
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm">{device.login}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(device.login || "")}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            "-"
          );
        },
      },
      {
        accessorKey: "password",
        header: "Пароль",
        cell: ({ row }) => {
          const device = row.original;
          return device.password ? (
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm">
                {showPasswords[device.id] ? device.password : "********"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => togglePassword(device.id)}
              >
                {showPasswords[device.id] ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(device.password || "")}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            "-"
          );
        },
      },
      {
        accessorKey: "connectedPort",
        header: "Порт",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {(row.getValue("connectedPort") as string) || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [showPasswords, deviceTypes]
  );

  const table = useReactTable({
    data: devices,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Загрузка устройств...
        </div>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/enterprises">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Предприятие не найдено
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/enterprises">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight">
                {enterprise.name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {enterprise.city?.name} - Устройства
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline ml-2">Добавить устройство</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список устройств ({devices.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет устройств. Добавьте первое устройство.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {table.getState().pagination.pageIndex + 1} из{" "}
                  {table.getPageCount()} страниц
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Предыдущая
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Следующая
                  </Button>
                  <Select
                    value={String(table.getState().pagination.pageSize)}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20].map((pageSize) => (
                        <SelectItem key={pageSize} value={String(pageSize)}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDevice
                ? "Редактировать устройство"
                : "Добавить устройство"}
            </DialogTitle>
            <DialogDescription>
              {editingDevice
                ? "Измените данные устройства"
                : "Заполните данные нового устройства"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Название устройства"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Тип устройства</Label>
                <Select
                  value={formData.deviceTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, deviceTypeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ip">IP адрес</Label>
                <Input
                  id="ip"
                  value={formData.ipAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, ipAddress: e.target.value })
                  }
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mac">MAC адрес</Label>
                <Input
                  id="mac"
                  value={formData.macAddress || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, macAddress: e.target.value })
                  }
                  placeholder="00:00:00:00:00:00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  value={formData.login || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, login: e.target.value })
                  }
                  placeholder="admin"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="********"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port">Подключён к порту</Label>
              <Input
                id="port"
                value={formData.connectedPort || ""}
                onChange={(e) =>
                  setFormData({ ...formData, connectedPort: e.target.value })
                }
                placeholder="Например: 28 на 192.168.14.1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="info">Дополнительная информация</Label>
              <Textarea
                id="info"
                value={formData.additionalInfo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, additionalInfo: e.target.value })
                }
                placeholder="Комментарии, описание..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.ipAddress}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить устройство?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить устройство {deletingDevice?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
