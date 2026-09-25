import { Eye, EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../../lib/api'
import { useAppStore } from '../../../store/useAppStore'
import type { Service } from '../../../types'
import { Button } from '../../../shared/components/button'

const toServiceRecord = (item: Record<string, unknown>, fallbackId = `svc-${Date.now()}`): Service => ({
  id: String(item.id ?? item.service_id ?? item.uuid ?? fallbackId),
  name: String(item.nombre ?? item.name ?? item.title ?? 'Servicio sin nombre'),
  duration: Number(item.duracion_minutos ?? item.duration ?? item.length_minutes ?? item.duration_minutes ?? 45),
  price: Number(item.precio ?? item.price ?? item.amount ?? item.cost ?? 0),
  description: String(item.descripcion ?? item.description ?? item.notes ?? 'Sin descripción disponible.'),
  category: String(item.categoria ?? item.category ?? item.type ?? 'General'),
  activo: item.activo === undefined ? item.active === undefined ? true : Boolean(item.active) : Boolean(item.activo),
})

const unwrapServices = (payload: unknown): Service[] => {
  const container = (() => {
    if (Array.isArray(payload)) return payload
    if (!payload || typeof payload !== 'object') return []
    const entry = payload as Record<string, unknown>
    if (Array.isArray(entry.data)) return entry.data
    if (Array.isArray(entry.items)) return entry.items
    if (Array.isArray(entry.results)) return entry.results
    if (Array.isArray(entry.services)) return entry.services
    if (Array.isArray(entry.payload)) return entry.payload
    return []
  })()

  return container.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object').map((item, index) => toServiceRecord(item, `svc-${index + 1}`))
}

function ServiceCatalog() {
  const { services, addService, updateService, hydrateFromApi, theme, tenants, activeTenantId } = useAppStore()
  const isDark = theme === 'dark'
  const activeTenantRole = String((tenants.find((tenant) => tenant.id === activeTenantId)?.role ?? 'staff') || 'staff').toLowerCase()
  const canManageServices = activeTenantRole === 'owner' || activeTenantRole === 'admin'
  const [form, setForm] = useState({ name: '', duration: '45', price: '1200', description: '' })
  const [showInactive, setShowInactive] = useState(false)
  const [inactiveServices, setInactiveServices] = useState<Service[]>([])
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', duration: '' })
  const [editError, setEditError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [isAddingService, setIsAddingService] = useState(false)

  const activeServices = useMemo(
    () => services.filter((service) => service.activo !== false),
    [services],
  )

  const loadInactiveServices = async () => {
    try {
      const response = await apiRequest<unknown>('/api/services', { method: 'GET' }, { tenant_id: activeTenantId, include_inactive: true })
      const normalized = unwrapServices(response)
      setInactiveServices(normalized.filter((service) => service.activo === false))
    } catch (error) {
      console.warn('Inactive services could not be loaded from the backend.', error)
      setInactiveServices([])
    }
  }

  useEffect(() => {
    if (!showInactive || !activeTenantId) return
    void loadInactiveServices()
  }, [showInactive, activeTenantId])

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) return

    const newService: Service = {
      id: `svc-${Date.now()}`,
      name: form.name,
      duration: Number(form.duration),
      price: Number(form.price),
      description: form.description,
      category: 'Nuevo',
      activo: true,
    }

    setIsAddingService(true)
    setCatalogError('')

    try {
      await addService(newService)
      setForm({ name: '', duration: '45', price: '1200', description: '' })
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'No pudimos guardar el servicio.')
    } finally {
      setIsAddingService(false)
    }
  }

  const handleSoftDelete = async (service: Service) => {
    const confirmed = window.confirm(`¿Seguro que quieres eliminar '${service.name}'? Ya no aparecerá disponible para tus clientes.`)
    if (!confirmed) return

    setDeletingServiceId(service.id)
    setCatalogError('')
    try {
      await updateService(service.id, { activo: false })
      await hydrateFromApi()
      if (showInactive) {
        await loadInactiveServices()
      }
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'No pudimos eliminar el servicio.')
    } finally {
      setDeletingServiceId(null)
    }
  }

  const handleReactivateService = async (service: Service) => {
    setCatalogError('')
    try {
      await updateService(service.id, { activo: true })
      await hydrateFromApi()
      await loadInactiveServices()
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'No pudimos reactivar el servicio.')
    }
  }

  const openEditService = (service: Service) => {
    setEditingService(service)
    setEditError('')
    setEditForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      duration: String(service.duration),
    })
  }

  const handleSaveEdit = async () => {
    if (!editingService) return

    const trimmedName = editForm.name.trim()
    const nextPrice = Number(editForm.price)
    const nextDuration = Number(editForm.duration)

    if (!trimmedName) {
      setEditError('El nombre del servicio es obligatorio.')
      return
    }

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setEditError('El precio debe ser un número mayor a 0.')
      return
    }

    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      setEditError('La duración debe ser un número mayor a 0.')
      return
    }

    setIsSavingEdit(true)
    setEditError('')

    try {
      const response = await apiRequest<Record<string, unknown>>('/api/services', {
        method: 'PATCH',
        body: JSON.stringify({
          id: editingService.id,
          tenant_id: activeTenantId,
          nombre: trimmedName,
          descripcion: editForm.description.trim(),
          precio: nextPrice,
          duracion_minutos: nextDuration,
        }),
      }, { tenant_id: activeTenantId })

      const payload = response && typeof response === 'object' ? response as Record<string, unknown> : {}
      const updatedService: Service = {
        ...editingService,
        id: String(payload.id ?? editingService.id),
        name: String(payload.nombre ?? payload.name ?? trimmedName),
        description: String(payload.descripcion ?? payload.description ?? editForm.description.trim()),
        price: Number(payload.precio ?? payload.price ?? nextPrice),
        duration: Number(payload.duracion_minutos ?? payload.duration ?? nextDuration),
        activo: payload.activo === undefined ? editingService.activo : Boolean(payload.activo),
      }

      useAppStore.setState((state) => ({
        services: state.services.map((service) => (service.id === editingService.id ? updatedService : service)),
      }))

      setEditingService(null)
    } catch (error) {
      setEditError('No se pudo guardar el servicio, intenta de nuevo')
      console.warn('The service could not be edited.', error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  if (!canManageServices) {
    return (
      <div className={isDark ? 'rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300' : 'rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm'}>
        Solo los roles owner y admin pueden crear o editar servicios para este tenant.
      </div>
    )
  }

  const visibleServices = showInactive ? inactiveServices : activeServices

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1.5fr]">
      <div className={isDark ? 'rounded-2xl border border-slate-800 bg-slate-900/80 p-4' : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'}>
        <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Sucursal</p>
        <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Registrar servicio</h3>

        <div className="mt-5 space-y-3">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nombre del servicio"
            className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-500'}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.duration}
              onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
              type="number"
              placeholder="Duración"
              className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-500'}
            />
            <input
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              type="number"
              placeholder="Precio"
              className={isDark ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500' : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-500'}
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Descripción para IA"
            className={isDark ? 'min-h-[110px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500' : 'min-h-[110px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-500'}
          />
          {catalogError && (
            <div className={isDark ? 'rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
              {catalogError}
            </div>
          )}
          <Button onClick={() => void handleSubmit()} disabled={isAddingService} className="w-full justify-center gap-2">
            <Plus className="h-4 w-4" />
            {isAddingService ? 'Guardando…' : 'Añadir servicio'}
          </Button>
        </div>
      </div>

      <div className={isDark ? 'rounded-2xl border border-slate-800 bg-slate-900/80 p-4' : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Catálogo</p>
            <h3 className={isDark ? 'text-xl font-semibold text-white' : 'text-xl font-semibold text-slate-900'}>{showInactive ? 'Servicios eliminados' : 'Servicios activos'}</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowInactive((current) => !current)}
            className={isDark ? 'inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-200' : 'inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-700'}
          >
            {showInactive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
          </button>
        </div>

        <div className="space-y-3">
          {visibleServices.length === 0 ? (
            <div className={isDark ? 'rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400' : 'rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500'}>
              {showInactive ? 'No hay servicios eliminados en este tenant.' : 'No hay servicios activos en este tenant.'}
            </div>
          ) : (
            visibleServices.map((service) => (
              <div key={service.id} className={isDark ? 'rounded-2xl border border-slate-700 bg-slate-950/60 p-4' : 'rounded-2xl border border-slate-300 bg-slate-50 p-4'}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className={isDark ? 'text-base font-medium text-white' : 'text-base font-medium text-slate-900'}>{service.name}</h4>
                    <p className={isDark ? 'mt-1 text-xs uppercase tracking-[0.18em] text-slate-500' : 'mt-1 text-xs uppercase tracking-[0.18em] text-slate-500'}>{service.category}</p>
                  </div>
                  <span className={isDark ? 'rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-200' : 'rounded-full border border-violet-300 bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700'}>
                    ${service.price.toLocaleString()}
                  </span>
                </div>
                <div className={isDark ? 'mt-3 flex items-center justify-between text-xs text-slate-400' : 'mt-3 flex items-center justify-between text-xs text-slate-500'}>
                  <span>{service.duration} min</span>
                  {showInactive ? (
                    <span className={isDark ? 'rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300' : 'rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-700'}>
                      Inactivo
                    </span>
                  ) : (
                    <span className={isDark ? 'rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200' : 'rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-800'}>
                      Activo
                    </span>
                  )}
                </div>
                <p className={isDark ? 'mt-3 text-sm text-slate-300' : 'mt-3 text-sm text-slate-600'}>{service.description}</p>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditService(service)}
                    className="gap-1.5"
                  >
                    Editar
                  </Button>

                  {showInactive ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleReactivateService(service)}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reactivar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleSoftDelete(service)}
                      className="gap-1.5 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-300/80 dark:bg-amber-400/20 dark:text-amber-50 dark:hover:bg-amber-400/30"
                      disabled={deletingServiceId === service.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingServiceId === service.id ? 'Eliminando…' : 'Eliminar'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className={isDark ? 'w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl' : 'w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl'}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Servicio</p>
                <h3 className={isDark ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-900'}>Editar servicio</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className={isDark ? 'rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300' : 'rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700'}
              >
                Cerrar
              </button>
            </div>

            {editError && (
              <div className={isDark ? 'mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200' : 'mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'}>
                {editError}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Nombre</label>
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  className={isDark ? 'mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white' : 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'}
                />
              </div>

              <div>
                <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Descripción</label>
                <textarea
                  value={editForm.description}
                  onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                  className={isDark ? 'mt-2 min-h-[110px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white' : 'mt-2 min-h-[110px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Precio</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.price}
                    onChange={(event) => setEditForm((current) => ({ ...current, price: event.target.value }))}
                    className={isDark ? 'mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white' : 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'}
                  />
                </div>

                <div>
                  <label className={isDark ? 'text-xs uppercase tracking-[0.2em] text-slate-400' : 'text-xs uppercase tracking-[0.2em] text-slate-500'}>Duración (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.duration}
                    onChange={(event) => setEditForm((current) => ({ ...current, duration: event.target.value }))}
                    className={isDark ? 'mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-white' : 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900'}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingService(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleSaveEdit()} disabled={isSavingEdit}>
                {isSavingEdit ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceCatalog
