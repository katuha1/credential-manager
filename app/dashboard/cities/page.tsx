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
import { getCities, createCity, updateCity, deleteCity } from '@/lib/actions/cities'

interface City {
  id: string
  name: string
  createdAt: Date | null
  enterpriseCount: number
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [deletingCity, setDeletingCity] = useState<City | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCities()
  }, [])

  async function fetchCities() {
    setLoading(true)
    const { data, error } = await getCities()

    if (error) {
      console.error('[v0] Error fetching cities:', error)
    } else {
      setCities(data || [])
    }
    setLoading(false)
  }

  function handleAdd() {
    setEditingCity(null)
    setFormData({ name: '' })
    setDialogOpen(true)
  }

  function handleEdit(city: City) {
    setEditingCity(city)
    setFormData({ name: city.name })
    setDialogOpen(true)
  }

  function handleDeleteClick(city: City) {
    setDeletingCity(city)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name) return

    setSaving(true)
    try {
      if (editingCity) {
        const { error } = await updateCity(editingCity.id, formData.name)
        if (error) throw new Error(error)
      } else {
        const { error } = await createCity(formData.name)
        if (error) throw new Error(error)
      }

      setDialogOpen(false)
      fetchCities()
    } catch (error) {
      console.error('[v0] Error saving city:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingCity) return

    try {
      const { error } = await deleteCity(deletingCity.id)
      if (error) throw new Error(error)

      setDeleteDialogOpen(false)
      setDeletingCity(null)
      fetchCities()
    } catch (error) {
      console.error('[v0] Error deleting city:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Загрузка городов...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Города</h1>
          <p className="text-muted-foreground">
            Управление списком городов
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить город
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список городов</CardTitle>
        </CardHeader>
        <CardContent>
          {cities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет городов. Добавьте первый город.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Предприятий</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>{city.enterpriseCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(city)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(city)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCity ? 'Редактировать город' : 'Добавить город'}
            </DialogTitle>
            <DialogDescription>
              {editingCity
                ? 'Измените данные города'
                : 'Заполните данные нового города'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите название города"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить город?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить город {deletingCity?.name}?
              Это также удалит все связанные предприятия и устройства.
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
