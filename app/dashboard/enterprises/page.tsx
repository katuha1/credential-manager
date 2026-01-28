"use client"

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Building2, Server, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { getEnterprises, createEnterprise, updateEnterprise, deleteEnterprise } from '@/lib/actions/enterprises'
import { getCities, createCity, updateCity, deleteCity } from '@/lib/actions/cities'
import { cn } from '@/lib/utils'

interface City {
  id: string
  name: string
  createdAt: Date | null
  enterpriseCount: number
}

interface Enterprise {
  id: string
  name: string
  cityId: string
  city: { id: string; name: string } | null
  deviceCount: number
}

interface EnterprisesByCity {
  city: City
  enterprises: Enterprise[]
}

export default function EnterprisesPage() {
  const [enterprisesByCity, setEnterprisesByCity] = useState<EnterprisesByCity[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  
  // Enterprise dialog state
  const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false)
  const [editingEnterprise, setEditingEnterprise] = useState<Enterprise | null>(null)
  const [enterpriseFormData, setEnterpriseFormData] = useState({ name: '', cityId: '' })
  
  // City dialog state
  const [cityDialogOpen, setCityDialogOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [cityFormData, setCityFormData] = useState({ name: '' })
  
  // Delete dialogs
  const [deleteEnterpriseDialogOpen, setDeleteEnterpriseDialogOpen] = useState(false)
  const [deletingEnterprise, setDeletingEnterprise] = useState<Enterprise | null>(null)
  const [deleteCityDialogOpen, setDeleteCityDialogOpen] = useState(false)
  const [deletingCity, setDeletingCity] = useState<City | null>(null)
  
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

    if (citiesRes.error) {
      console.error('[v0] Error fetching cities:', citiesRes.error)
    } else {
      const citiesData = citiesRes.data || []
      setCities(citiesData)
      
      // Expand all cities by default
      setExpandedCities(new Set(citiesData.map(c => c.id)))
    }

    if (enterprisesRes.error) {
      console.error('[v0] Error fetching enterprises:', enterprisesRes.error)
    } else {
      const enterprises = (enterprisesRes.data || []) as Enterprise[]
      const citiesData = citiesRes.data || []
      
      // Group enterprises by city
      const grouped = citiesData.map(city => ({
        city,
        enterprises: enterprises.filter(e => e.cityId === city.id)
      }))
      
      setEnterprisesByCity(grouped)
    }
    
    setLoading(false)
  }

  function toggleCity(cityId: string) {
    setExpandedCities(prev => {
      const next = new Set(prev)
      if (next.has(cityId)) {
        next.delete(cityId)
      } else {
        next.add(cityId)
      }
      return next
    })
  }

  // Enterprise handlers
  function handleAddEnterprise(cityId?: string) {
    setEditingEnterprise(null)
    setEnterpriseFormData({ name: '', cityId: cityId || '' })
    setEnterpriseDialogOpen(true)
  }

  function handleEditEnterprise(enterprise: Enterprise) {
    setEditingEnterprise(enterprise)
    setEnterpriseFormData({
      name: enterprise.name,
      cityId: enterprise.cityId,
    })
    setEnterpriseDialogOpen(true)
  }

  function handleDeleteEnterpriseClick(enterprise: Enterprise) {
    setDeletingEnterprise(enterprise)
    setDeleteEnterpriseDialogOpen(true)
  }

  async function handleSaveEnterprise() {
    if (!enterpriseFormData.name || !enterpriseFormData.cityId) return

    setSaving(true)
    try {
      if (editingEnterprise) {
        const { error } = await updateEnterprise(editingEnterprise.id, enterpriseFormData)
        if (error) throw new Error(error)
      } else {
        const { error } = await createEnterprise(enterpriseFormData)
        if (error) throw new Error(error)
      }

      setEnterpriseDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('[v0] Error saving enterprise:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteEnterprise() {
    if (!deletingEnterprise) return

    try {
      const { error } = await deleteEnterprise(deletingEnterprise.id)
      if (error) throw new Error(error)

      setDeleteEnterpriseDialogOpen(false)
      setDeletingEnterprise(null)
      fetchData()
    } catch (error) {
      console.error('[v0] Error deleting enterprise:', error)
    }
  }

  // City handlers
  function handleAddCity() {
    setEditingCity(null)
    setCityFormData({ name: '' })
    setCityDialogOpen(true)
  }

  function handleEditCity(city: City) {
    setEditingCity(city)
    setCityFormData({ name: city.name })
    setCityDialogOpen(true)
  }

  function handleDeleteCityClick(city: City) {
    setDeletingCity(city)
    setDeleteCityDialogOpen(true)
  }

  async function handleSaveCity() {
    if (!cityFormData.name) return

    setSaving(true)
    try {
      if (editingCity) {
        const { error } = await updateCity(editingCity.id, cityFormData.name)
        if (error) throw new Error(error)
      } else {
        const { error } = await createCity(cityFormData.name)
        if (error) throw new Error(error)
      }

      setCityDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('[v0] Error saving city:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCity() {
    if (!deletingCity) return

    try {
      const { error } = await deleteCity(deletingCity.id)
      if (error) throw new Error(error)

      setDeleteCityDialogOpen(false)
      setDeletingCity(null)
      fetchData()
    } catch (error) {
      console.error('[v0] Error deleting city:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Загрузка данных...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Предприятия</h1>
          <p className="text-muted-foreground">
            Управление предприятиями по городам
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddCity}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить город
          </Button>
          <Button onClick={() => handleAddEnterprise()} disabled={cities.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить предприятие
          </Button>
        </div>
      </div>

      {cities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Нет городов. Добавьте первый город, чтобы начать.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enterprisesByCity.map(({ city, enterprises }) => (
            <Collapsible
              key={city.id}
              open={expandedCities.has(city.id)}
              onOpenChange={() => toggleCity(city.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChevronRight 
                          className={cn(
                            "w-5 h-5 transition-transform",
                            expandedCities.has(city.id) && "rotate-90"
                          )} 
                        />
                        <CardTitle className="text-lg">{city.name}</CardTitle>
                        <Badge variant="secondary">
                          {enterprises.length} {enterprises.length === 1 ? 'предприятие' : 
                            enterprises.length > 1 && enterprises.length < 5 ? 'предприятия' : 'предприятий'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddEnterprise(city.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Предприятие
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCity(city)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCityClick(city)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {enterprises.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        Нет предприятий в этом городе
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {enterprises.map((enterprise) => (
                          <div
                            key={enterprise.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium">{enterprise.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Server className="w-3 h-3" />
                                  <span>{enterprise.deviceCount} устройств</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/dashboard/enterprises/${enterprise.id}/devices`}>
                                  Устройства
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditEnterprise(enterprise)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEnterpriseClick(enterprise)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Enterprise Dialog */}
      <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
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
              <Label htmlFor="enterprise-name">Название</Label>
              <Input
                id="enterprise-name"
                value={enterpriseFormData.name}
                onChange={(e) => setEnterpriseFormData({ ...enterpriseFormData, name: e.target.value })}
                placeholder="Введите название"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enterprise-city">Город</Label>
              <Select
                value={enterpriseFormData.cityId}
                onValueChange={(value) => setEnterpriseFormData({ ...enterpriseFormData, cityId: value })}
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
            <Button variant="outline" onClick={() => setEnterpriseDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSaveEnterprise}
              disabled={saving || !enterpriseFormData.name || !enterpriseFormData.cityId}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* City Dialog */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
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
              <Label htmlFor="city-name">Название</Label>
              <Input
                id="city-name"
                value={cityFormData.name}
                onChange={(e) => setCityFormData({ ...cityFormData, name: e.target.value })}
                placeholder="Введите название города"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveCity} disabled={saving || !cityFormData.name}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Enterprise Dialog */}
      <AlertDialog open={deleteEnterpriseDialogOpen} onOpenChange={setDeleteEnterpriseDialogOpen}>
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
            <AlertDialogAction onClick={handleDeleteEnterprise}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete City Dialog */}
      <AlertDialog open={deleteCityDialogOpen} onOpenChange={setDeleteCityDialogOpen}>
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
            <AlertDialogAction onClick={handleDeleteCity}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
