"use client"

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getEnterprises, createEnterprise, updateEnterprise, deleteEnterprise } from '@/lib/actions/enterprises'
import { getCities } from '@/lib/actions/cities'

interface City {
  id: string
  name: string
}

interface Enterprise {
  id: string
  name: string
  cityId: string
  city: City | null
  deviceCount: number
}

export default function EnterprisesPage() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null)
  const [deletingEnterprise, setDeletingEnterprise] = useState<Enterprise | null>(null)
  const [formData, setFormData] = useState({ name: '', cityId: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [enterprisesRes, citiesRes] = await Promise.all([
      getEnterprises(),
      getCities(),
    ])

    if (enterprisesRes.error) {
      console.error('[v0] Error fetching enterprises:', enterprisesRes.error)
    } else {
      setEnterprises((enterprisesRes.data || []) as Enterprise[])
    }

    if (citiesRes.error) {
      console.error('[v0] Error fetching cities:', citiesRes.error)
    } else {
      setCities(citiesRes.data || [])
    }
    setLoading(false)
  }

  function handleAdd() {
    setEditingEnterprise(null)
    setFormData({ name: '', cityId: '' })
    setDialogOpen(true)
  }

  function handleEdit(enterprise: Enterprise) {
    setEditingEnterprise(enterprise)
    setFormData({
      name: enterprise.name,
      cityId: enterprise.cityId,
    })
    setDialogOpen(true)
  }

  function handleDeleteClick(enterprise: Enterprise) {
    setDeletingEnterprise(enterprise)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name || !formData.cityId) return

    setSaving(true)
    try {
      if (editingEnterprise) {
        const { error } = await updateEnterprise(editingEnterprise.id, formData)
        if (error) throw new Error(error)
      } else {
        const { error } = await createEnterprise(formData)
        if (error) throw new Error(error)
      }

      setDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('[v0] Error saving enterprise:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingEnterprise) return

    try {
      const { error } = await deleteEnterprise(deletingEnterprise.id)
      if (error) throw new Error(error)

      setDeleteDialogOpen(false)
      setDeletingEnterprise(null)
      fetchData()
    } catch (error) {
      console.error('[v0] Error deleting enterprise:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Загрузка предприятий...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Предприятия</h1>
          <p className="text-muted-foreground">
            Управление списком предприятий
          </p>
        </div>
        <Button onClick={handleAdd} disabled={cities.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить предприятие
        </Button>
      </div>

      {cities.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Сначала добавьте хотя бы один город
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Список предприятий</CardTitle>
        </CardHeader>
        <CardContent>
          {enterprises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет предприятий. Добавьте первое предприятие.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Устройств</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enterprises.map((enterprise) => (
                  <TableRow key={enterprise.id}>
                    <TableCell className="font-medium">{enterprise.name}</TableCell>
                    <TableCell>{enterprise.city?.name}</TableCell>
                    <TableCell>{enterprise.deviceCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(enterprise)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(enterprise)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEnterprise ? 'Редактировать предприятие' : 'Добавить предприятие'}
            </DialogTitle>
            <DialogDescription>
              {editingEnterprise
                ? 'Измените данные предприятия'
                : 'Заполните данные нового предприятия'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите название"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Город</Label>
              <Select
                value={formData.cityId}
                onValueChange={(value) => setFormData({ ...formData, cityId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.cityId}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить предприятие?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить предприятие {deletingEnterprise?.name}?
              Это также удалит все связанные устройства.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
