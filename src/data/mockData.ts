import type { AnalyticsKpi, Appointment, Service, Tenant } from '../types'

export const tenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Estudio Centro',
    city: 'Ciudad de México',
    speciality: 'Belleza y estética',
    address: 'Av. Reforma 1250',
    active: true,
    calendarLinked: true,
  },
  {
    id: 'tenant-2',
    name: 'Consultorio Pedregal',
    city: 'Álvaro Obregón',
    speciality: 'Salud y medicina estética',
    address: 'Camino Real 220',
    active: false,
    calendarLinked: true,
  },
  {
    id: 'tenant-3',
    name: 'Luna Spa Private',
    city: 'Polanco',
    speciality: 'Bienestar y spa',
    address: 'Mérida 15',
    active: false,
    calendarLinked: false,
  },
]

export const services: Service[] = [
  {
    id: 'svc-1',
    name: 'Limpieza Dental Premium',
    duration: 45,
    price: 1200,
    description: 'Limpieza integral con diagnóstico de salud bucal y revisión visual.',
    category: 'Salud',
  },
  {
    id: 'svc-2',
    name: 'Corte de Cabello + Styling',
    duration: 60,
    price: 850,
    description: 'Corte personalizado con lavado, peinado y asesoría de estilo.',
    category: 'Belleza',
  },
  {
    id: 'svc-3',
    name: 'Botox Facial',
    duration: 50,
    price: 1800,
    description: 'Tratamiento facial antiarrugas para mejorar textura y luminosidad.',
    category: 'Estética',
  },
  {
    id: 'svc-4',
    name: 'Manicura Spa',
    duration: 40,
    price: 650,
    description: 'Servicio completo con esmaltado, exfoliación y terminado premium.',
    category: 'Belleza',
  },
  {
    id: 'svc-5',
    name: 'Consulta Dermatológica',
    duration: 30,
    price: 1500,
    description: 'Consulta inicial con valoración de tratamiento y recomendaciones.',
    category: 'Salud',
  },
]

export const appointmentData: Appointment[] = [
  {
    id: 'apt-1',
    tenantId: 'tenant-1',
    customer: {
      id: 'cus-1',
      name: 'María López',
      phone: '+52 55 2345 6120',
      email: 'maria.lopez@email.com',
      avatar: 'ML',
    },
    service: 'Limpieza Dental Premium',
    date: '2026-09-07',
    time: '09:30',
    status: 'confirmed',
    channel: 'WhatsApp',
    notes: ['Confirmó disponibilidad por WhatsApp.', 'Solicitó horario temprano por trabajo.'],
    amount: 1200,
  },
  {
    id: 'apt-2',
    tenantId: 'tenant-1',
    customer: {
      id: 'cus-2',
      name: 'Sofía Ramírez',
      phone: '+52 55 2990 2715',
      email: 'sofia.r@email.com',
      avatar: 'SR',
    },
    service: 'Corte de Cabello + Styling',
    date: '2026-09-07',
    time: '11:00',
    status: 'pending',
    channel: 'Instagram',
    notes: ['El bot preguntó por estilo y duración.', 'Cliente aún no confirma el tipo de corte.'],
    amount: 850,
  },
  {
    id: 'apt-3',
    tenantId: 'tenant-1',
    customer: {
      id: 'cus-3',
      name: 'Fernanda Ortega',
      phone: '+52 55 6831 4433',
      email: 'fernanda.o@email.com',
      avatar: 'FO',
    },
    service: 'Botox Facial',
    date: '2026-09-08',
    time: '15:45',
    status: 'confirmed',
    channel: 'Web',
    notes: ['Agendada desde landing con oferta por IA.', 'Pedido de cita sin dolor ni tiempo de recuperación.'],
    amount: 1800,
  },
  {
    id: 'apt-4',
    tenantId: 'tenant-1',
    customer: {
      id: 'cus-4',
      name: 'Pedro Saavedra',
      phone: '+52 55 7701 4120',
      email: 'pedro.s@email.com',
      avatar: 'PS',
    },
    service: 'Consulta Dermatológica',
    date: '2026-09-09',
    time: '17:00',
    status: 'cancelled',
    channel: 'Google Calendar',
    notes: ['Paciente notificó cambio de horario.', 'Cita reprogramada para el lunes siguiente.'],
    amount: 1500,
  },
  {
    id: 'apt-5',
    tenantId: 'tenant-2',
    customer: {
      id: 'cus-5',
      name: 'Daniela Ruiz',
      phone: '+52 55 1188 9992',
      email: 'daniela.r@email.com',
      avatar: 'DR',
    },
    service: 'Consulta Dermatológica',
    date: '2026-09-07',
    time: '10:15',
    status: 'confirmed',
    channel: 'WhatsApp',
    notes: ['Bot identificó necesidad de revisión de manchas.', 'Paciente eligió paquete de seguimiento.'],
    amount: 1500,
  },
]

export const dashboardKpis: AnalyticsKpi[] = [
  { id: 'kpi-1', label: 'Citas totales del mes', value: '1,284', delta: '+18.2%', positive: true, accent: 'emerald' },
  { id: 'kpi-2', label: 'Tasa de conversión del bot', value: '34.6%', delta: '+6.4%', positive: true, accent: 'violet' },
  { id: 'kpi-3', label: 'Ingresos estimados', value: '$84.6K', delta: '+12.1%', positive: true, accent: 'emerald' },
  { id: 'kpi-4', label: 'Cancelaciones', value: '42', delta: '-7.8%', positive: false, accent: 'rose' },
]

export const dailyBookings = [
  { day: 'Lun', bookings: 24 },
  { day: 'Mar', bookings: 38 },
  { day: 'Mié', bookings: 31 },
  { day: 'Jue', bookings: 44 },
  { day: 'Vie', bookings: 52 },
  { day: 'Sáb', bookings: 46 },
  { day: 'Dom', bookings: 28 },
]

export const hourlyDemand = [
  { hour: '09:00', demand: 12 },
  { hour: '10:00', demand: 24 },
  { hour: '11:00', demand: 28 },
  { hour: '12:00', demand: 18 },
  { hour: '14:00', demand: 31 },
  { hour: '15:00', demand: 30 },
  { hour: '16:00', demand: 22 },
  { hour: '17:00', demand: 16 },
]

export const serviceMix = [
  { name: 'Belleza', value: 38, color: '#10B981' },
  { name: 'Salud', value: 27, color: '#8B5CF6' },
  { name: 'Estética', value: 22, color: '#F59E0B' },
  { name: 'Spa', value: 13, color: '#F43F5E' },
]

export const recentActivity = [
  { id: 'act-1', message: 'Bot agendó cita con María López vía WhatsApp hace 3 min', time: 'Hace 3 min', type: 'success' },
  { id: 'act-2', message: 'El servicio de Botox Facial tuvo un 22% más de interés hoy', time: 'Hace 15 min', type: 'ai' },
  { id: 'act-3', message: 'Sofía Ramírez respondió al flujo de confirmación y quedó pendiente', time: 'Hace 34 min', type: 'pending' },
  { id: 'act-4', message: 'Se sincronizó un evento nuevo en Google Calendar', time: 'Hace 1 hr', type: 'sync' },
]
