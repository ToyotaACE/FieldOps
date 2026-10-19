import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  Wrench,
  Plus
} from 'lucide-react'

type CalendarStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

type CalendarInspection = {
  id: number | string
  title?: string
  scheduledDate?: string
  date?: string
  status?: CalendarStatus | string
  clientName?: string
  siteName?: string
  technicianName?: string
  equipmentName?: string
}

type CalendarPageProps = {
  inspections?: CalendarInspection[]
  onNewInspection?: () => void
  onOpenInspection?: (inspection: CalendarInspection) => void
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planejada',
  IN_PROGRESS: 'Em andamento',
  UNDER_REVIEW: 'Em revisão',
  APPROVED: 'Aprovada',
  REJECTED: 'Reprovada',
  CANCELLED: 'Cancelada'
}

function getStatusClass(status?: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'calendar-status calendar-status-progress'

    case 'UNDER_REVIEW':
      return 'calendar-status calendar-status-review'

    case 'APPROVED':
      return 'calendar-status calendar-status-approved'

    case 'REJECTED':
      return 'calendar-status calendar-status-rejected'

    case 'CANCELLED':
      return 'calendar-status calendar-status-cancelled'

    default:
      return 'calendar-status calendar-status-planned'
  }
}

function parseDate(value?: string) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatTime(value?: string) {
  const date = parseDate(value)

  if (!date) return ''

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function CalendarPage({
  inspections = [],
  onNewInspection,
  onOpenInspection
}: CalendarPageProps) {
  const today = new Date()

  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const firstDay = useMemo(
    () => new Date(currentYear, currentMonth, 1),
    [currentMonth, currentYear]
  )

  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear]
  )

  const startingDay = firstDay.getDay()

  const calendarDays = useMemo(() => {
    const days: Array<number | null> = []

    for (let index = 0; index < startingDay; index++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [startingDay, daysInMonth])

  function previousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((year) => year - 1)
      return
    }

    setCurrentMonth((month) => month - 1)
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((year) => year + 1)
      return
    }

    setCurrentMonth((month) => month + 1)
  }

  function goToToday() {
    const now = new Date()

    setCurrentMonth(now.getMonth())
    setCurrentYear(now.getFullYear())
  }

  function inspectionsForDay(day: number) {
    return inspections.filter((inspection) => {
      const date = parseDate(
        inspection.scheduledDate ?? inspection.date
      )

      if (!date) return false

      return (
        date.getFullYear() === currentYear &&
        date.getMonth() === currentMonth &&
        date.getDate() === day
      )
    })
  }

  function isToday(day: number) {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  return (
    <section className="calendar-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">PLANEJAMENTO</div>

          <h1>Calendário</h1>

          <p>
            Organize a agenda das equipes e evite conflitos de atendimento.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onNewInspection}
        >
          <Plus size={18} />
          Nova inspeção
        </button>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-toolbar-left">
          <button
            type="button"
            className="calendar-nav-button"
            onClick={previousMonth}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            className="calendar-nav-button"
            onClick={nextMonth}
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>

          <button
            type="button"
            className="calendar-today-button"
            onClick={goToToday}
          >
            Hoje
          </button>

          <div className="calendar-month-title">
            <CalendarDays size={20} />

            <strong>
              {MONTHS[currentMonth]} {currentYear}
            </strong>
          </div>
        </div>

        <div className="calendar-legend">
          <span>
            <i className="legend-dot legend-planned" />
            Planejada
          </span>

          <span>
            <i className="legend-dot legend-progress" />
            Em andamento
          </span>

          <span>
            <i className="legend-dot legend-review" />
            Em revisão
          </span>

          <span>
            <i className="legend-dot legend-approved" />
            Aprovada
          </span>
        </div>
      </div>

      <div className="calendar-card">
        <div className="calendar-week-header">
          {WEEK_DAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="calendar-day calendar-day-empty"
                />
              )
            }

            const dayInspections = inspectionsForDay(day)

            return (
              <div
                key={day}
                className={`calendar-day ${
                  isToday(day) ? 'calendar-day-today' : ''
                }`}
              >
                <div className="calendar-day-number">
                  <span>{day}</span>

                  {isToday(day) && (
                    <small>Hoje</small>
                  )}
                </div>

                <div className="calendar-day-inspections">
                  {dayInspections.length === 0 && (
                    <div className="calendar-empty-day">
                      Sem inspeções
                    </div>
                  )}

                  {dayInspections.map((inspection) => (
                    <button
                      key={inspection.id}
                      type="button"
                      className={getStatusClass(inspection.status)}
                      onClick={() =>
                        onOpenInspection?.(inspection)
                      }
                    >
                      <strong>
                        {inspection.title ||
                          `Inspeção #${inspection.id}`}
                      </strong>

                      {formatTime(
                        inspection.scheduledDate ??
                          inspection.date
                      ) && (
                        <span>
                          <Clock3 size={12} />

                          {formatTime(
                            inspection.scheduledDate ??
                              inspection.date
                          )}
                        </span>
                      )}

                      {inspection.clientName && (
                        <span>
                          {inspection.clientName}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="calendar-summary">
        <div className="calendar-summary-header">
          <div>
            <div className="eyebrow">RESUMO</div>
            <h2>Inspeções do período</h2>
          </div>

          <span className="calendar-summary-count">
            {inspections.length}
          </span>
        </div>

        {inspections.length === 0 ? (
          <div className="calendar-empty-state">
            <CalendarDays size={42} />

            <h3>Nenhuma inspeção cadastrada</h3>

            <p>
              As inspeções aparecerão aqui automaticamente quando
              forem cadastradas no sistema.
            </p>
          </div>
        ) : (
          <div className="calendar-inspection-list">
            {inspections.map((inspection) => (
              <button
                key={inspection.id}
                type="button"
                className="calendar-inspection-row"
                onClick={() =>
                  onOpenInspection?.(inspection)
                }
              >
                <div className="calendar-inspection-main">
                  <strong>
                    {inspection.title ||
                      `Inspeção #${inspection.id}`}
                  </strong>

                  <span>
                    {inspection.clientName ||
                      'Cliente não informado'}
                  </span>
                </div>

                <div className="calendar-inspection-info">
                  {inspection.siteName && (
                    <span>
                      <MapPin size={14} />
                      {inspection.siteName}
                    </span>
                  )}

                  {inspection.technicianName && (
                    <span>
                      <UserRound size={14} />
                      {inspection.technicianName}
                    </span>
                  )}

                  {inspection.equipmentName && (
                    <span>
                      <Wrench size={14} />
                      {inspection.equipmentName}
                    </span>
                  )}
                </div>

                <span
                  className={getStatusClass(
                    inspection.status
                  )}
                >
                  {STATUS_LABELS[
                    inspection.status || ''
                  ] || 'Planejada'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}