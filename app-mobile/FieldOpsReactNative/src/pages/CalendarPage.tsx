import React, { useMemo, useState } from 'react';

import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  UserRound,
} from 'lucide-react-native';

import { Palette } from '../types';

import { calendarPageStyles as styles } from './CalendarPage.styles';

type CalendarPageProps = {
  colors: Palette;
};

type InspectionStatus =
  | 'Agendada'
  | 'Em andamento'
  | 'Concluída'
  | 'Cancelada';

type Inspection = {
  id: string;
  date: string;
  time: string;
  client: string;
  location: string;
  inspector: string;
  description?: string;
  status: InspectionStatus;
};

type CalendarDay = {
  date: Date;
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const WEEK_DAYS = [
  'D',
  'S',
  'T',
  'Q',
  'Q',
  'S',
  'S',
];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createInitialInspections(): Inspection[] {
  const today = new Date();

  const inspectionOneDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );

  const inspectionTwoDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 3,
  );

  const inspectionThreeDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 3,
  );

  return [
    {
      id: 'inspection-1',
      date: formatDateKey(
        inspectionOneDate,
      ),
      time: '08:30',
      client: 'Empresa Solar Alpha',
      location: 'Sorocaba - SP',
      inspector: 'João Silva',
      description:
        'Inspeção preventiva da instalação fotovoltaica.',
      status: 'Agendada',
    },

    {
      id: 'inspection-2',
      date: formatDateKey(
        inspectionTwoDate,
      ),
      time: '10:00',
      client: 'Comercial Beta',
      location: 'Jundiaí - SP',
      inspector: 'João Silva',
      description:
        'Verificação estrutural e elétrica.',
      status: 'Agendada',
    },

    {
      id: 'inspection-3',
      date: formatDateKey(
        inspectionThreeDate,
      ),
      time: '14:30',
      client: 'Indústria Solar Gamma',
      location: 'Campinas - SP',
      inspector: 'João Silva',
      description:
        'Inspeção pós-instalação.',
      status: 'Agendada',
    },
  ];
}

export function CalendarPage({
  colors,
}: CalendarPageProps) {
  const today = new Date();

  const [currentMonth, setCurrentMonth] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    formatDateKey(today),
  );

  const [inspections] =
    useState<Inspection[]>(
      createInitialInspections(),
    );

  const calendarDays = useMemo(() => {
    return generateCalendarDays(
      currentMonth,
    );
  }, [currentMonth]);

  const selectedDateInspections =
    useMemo(() => {
      return inspections
        .filter(
          (inspection) =>
            inspection.date ===
            selectedDate,
        )
        .sort(
          (
            firstInspection,
            secondInspection,
          ) =>
            firstInspection.time.localeCompare(
              secondInspection.time,
            ),
        );
    }, [
      inspections,
      selectedDate,
    ]);

  const monthInspections =
    useMemo(() => {
      return inspections.filter(
        (inspection) => {
          const [
            inspectionYear,
            inspectionMonth,
          ] = inspection.date
            .split('-')
            .map(Number);

          return (
            inspectionYear ===
              currentMonth.getFullYear() &&
            inspectionMonth ===
              currentMonth.getMonth() + 1
          );
        },
      );
    }, [
      inspections,
      currentMonth,
    ]);

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      ),
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      ),
    );
  }

  function goToToday() {
    const currentDate = new Date();

    setCurrentMonth(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      ),
    );

    setSelectedDate(
      formatDateKey(
        currentDate,
      ),
    );
  }

  function selectDay(
    calendarDay: CalendarDay,
  ) {
    setSelectedDate(
      calendarDay.dateKey,
    );

    if (
      !calendarDay.isCurrentMonth
    ) {
      setCurrentMonth(
        new Date(
          calendarDay.date.getFullYear(),
          calendarDay.date.getMonth(),
          1,
        ),
      );
    }
  }

  function getInspectionsForDate(
    dateKey: string,
  ) {
    return inspections.filter(
      (inspection) =>
        inspection.date === dateKey,
    );
  }

  function getStatusStyle(
    status: InspectionStatus,
  ) {
    switch (status) {
      case 'Concluída':
        return styles.statusCompleted;

      case 'Em andamento':
        return styles.statusInProgress;

      case 'Cancelada':
        return styles.statusCancelled;

      default:
        return styles.statusScheduled;
    }
  }

  function getStatusTextStyle(
    status: InspectionStatus,
  ) {
    switch (status) {
      case 'Concluída':
        return styles.statusCompletedText;

      case 'Em andamento':
        return styles.statusInProgressText;

      case 'Cancelada':
        return styles.statusCancelledText;

      default:
        return styles.statusScheduledText;
    }
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          FIELDOPS
        </Text>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Meu calendário
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.muted,
            },
          ]}
        >
          Consulte suas inspeções
          programadas pelo supervisor.
        </Text>
      </View>

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor:
              colors.panel,

            borderColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.summaryIcon
          }
        >
          <CalendarDays
            size={22}
            color="#2563eb"
          />
        </View>

        <View
          style={
            styles.summaryContent
          }
        >
          <Text
            style={[
              styles.summaryNumber,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {
              monthInspections.length
            }
          </Text>

          <Text
            style={[
              styles.summaryLabel,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            {monthInspections.length ===
            1
              ? 'inspeção programada neste mês'
              : 'inspeções programadas neste mês'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.calendarCard,
          {
            backgroundColor:
              colors.panel,

            borderColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.calendarHeader
          }
        >
          <TouchableOpacity
            style={[
              styles.navigationButton,
              {
                borderColor:
                  colors.border,
              },
            ]}
            onPress={
              previousMonth
            }
          >
            <ChevronLeft
              size={21}
              color={colors.text}
            />
          </TouchableOpacity>

          <View
            style={
              styles.monthContainer
            }
          >
            <Text
              style={[
                styles.monthTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {formatMonthTitle(
                currentMonth,
              )}
            </Text>

            <TouchableOpacity
              onPress={goToToday}
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.todayText
                }
              >
                Ir para hoje
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.navigationButton,
              {
                borderColor:
                  colors.border,
              },
            ]}
            onPress={
              nextMonth
            }
          >
            <ChevronRight
              size={21}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.weekHeader
          }
        >
          {WEEK_DAYS.map(
            (
              weekDay,
              index,
            ) => (
              <View
                key={`${weekDay}-${index}`}
                style={
                  styles.weekDay
                }
              >
                <Text
                  style={[
                    styles.weekDayText,
                    {
                      color:
                        colors.muted,
                    },
                  ]}
                >
                  {weekDay}
                </Text>
              </View>
            ),
          )}
        </View>

        <View
          style={
            styles.daysGrid
          }
        >
          {calendarDays.map(
            (calendarDay) => {
              const dayInspections =
                getInspectionsForDate(
                  calendarDay.dateKey,
                );

              const isSelected =
                calendarDay.dateKey ===
                selectedDate;

              return (
                <TouchableOpacity
                  key={
                    calendarDay.dateKey
                  }
                  activeOpacity={0.7}
                  style={
                    styles.dayCell
                  }
                  onPress={() =>
                    selectDay(
                      calendarDay,
                    )
                  }
                >
                  <View
                    style={[
                      styles.dayCircle,

                      isSelected &&
                        styles.selectedDayCircle,

                      calendarDay.isToday &&
                        !isSelected &&
                        styles.todayDayCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,

                        {
                          color:
                            calendarDay.isCurrentMonth
                              ? colors.text
                              : colors.muted,
                        },

                        !calendarDay.isCurrentMonth &&
                          styles.outsideMonthDay,

                        isSelected &&
                          styles.selectedDayNumber,

                        calendarDay.isToday &&
                          !isSelected &&
                          styles.todayDayNumber,
                      ]}
                    >
                      {
                        calendarDay.day
                      }
                    </Text>
                  </View>

                  {dayInspections.length >
                  0 ? (
                    <View
                      style={[
                        styles.inspectionCountContainer,

                        isSelected &&
                          styles.selectedInspectionCountContainer,
                      ]}
                    >
                      <Text
                        style={[
                          styles.inspectionCountText,

                          isSelected &&
                            styles.selectedInspectionCountText,
                        ]}
                      >
                        {
                          dayInspections.length
                        }
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={
                        styles.inspectionCountPlaceholder
                      }
                    />
                  )}
                </TouchableOpacity>
              );
            },
          )}
        </View>

        <View
          style={[
            styles.calendarFooter,
            {
              borderTopColor:
                colors.border,
            },
          ]}
        >
          <View
            style={
              styles.footerExample
            }
          >
            <View
              style={
                styles.exampleNumber
              }
            >
              <Text
                style={
                  styles.exampleNumberText
                }
              >
                2
              </Text>
            </View>

            <Text
              style={[
                styles.footerText,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              quantidade de inspeções
              no dia
            </Text>
          </View>
        </View>
      </View>

      <View
        style={
          styles.selectedDateHeader
        }
      >
        <View
          style={
            styles.selectedDateTextContainer
          }
        >
          <Text
            style={[
              styles.scheduleTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Inspeções do dia
          </Text>

          <Text
            style={[
              styles.scheduleDate,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            {formatSelectedDate(
              selectedDate,
            )}
          </Text>
        </View>

        {selectedDateInspections.length >
          0 && (
          <View
            style={
              styles.dayInspectionCount
            }
          >
            <Text
              style={
                styles.dayInspectionCountText
              }
            >
              {
                selectedDateInspections.length
              }
            </Text>
          </View>
        )}
      </View>

      {selectedDateInspections.length ===
      0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor:
                colors.panel,

              borderColor:
                colors.border,
            },
          ]}
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <CalendarDays
              size={28}
              color="#2563eb"
            />
          </View>

          <Text
            style={[
              styles.emptyStateTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Nenhuma inspeção
          </Text>

          <Text
            style={[
              styles.emptyStateDescription,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Você não possui inspeções
            programadas para esta data.
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.inspectionList
          }
        >
          {selectedDateInspections.map(
            (inspection) => (
              <View
                key={
                  inspection.id
                }
                style={[
                  styles.inspectionCard,
                  {
                    backgroundColor:
                      colors.panel,

                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <View
                  style={
                    styles.inspectionCardHeader
                  }
                >
                  <View
                    style={
                      styles.timeContainer
                    }
                  >
                    <View
                      style={
                        styles.timeIcon
                      }
                    >
                      <Clock3
                        size={18}
                        color="#2563eb"
                      />
                    </View>

                    <View>
                      <Text
                        style={[
                          styles.timeLabel,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        HORÁRIO
                      </Text>

                      <Text
                        style={[
                          styles.inspectionTime,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          inspection.time
                        }
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,

                      getStatusStyle(
                        inspection.status,
                      ),
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,

                        getStatusTextStyle(
                          inspection.status,
                        ),
                      ]}
                    >
                      {
                        inspection.status
                      }
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.inspectionClient,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {
                    inspection.client
                  }
                </Text>

                <View
                  style={[
                    styles.detailBox,
                    {
                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <MapPin
                      size={17}
                      color="#2563eb"
                    />

                    <View
                      style={
                        styles.detailContent
                      }
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        LOCAL
                      </Text>

                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          inspection.location
                        }
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.detailDivider,
                      {
                        backgroundColor:
                          colors.border,
                      },
                    ]}
                  />

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <UserRound
                      size={17}
                      color="#2563eb"
                    />

                    <View
                      style={
                        styles.detailContent
                      }
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        INSPETOR
                      </Text>

                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          inspection.inspector
                        }
                      </Text>
                    </View>
                  </View>
                </View>

                {inspection.description ? (
                  <View
                    style={
                      styles.descriptionContainer
                    }
                  >
                    <Text
                      style={[
                        styles.descriptionLabel,
                        {
                          color:
                            colors.muted,
                        },
                      ]}
                    >
                      OBSERVAÇÕES
                    </Text>

                    <Text
                      style={[
                        styles.inspectionDescription,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {
                        inspection.description
                      }
                    </Text>
                  </View>
                ) : null}
              </View>
            ),
          )}
        </View>
      )}
    </ScrollView>
  );
}

function generateCalendarDays(
  currentMonth: Date,
): CalendarDay[] {
  const year =
    currentMonth.getFullYear();

  const month =
    currentMonth.getMonth();

  const firstDayOfMonth =
    new Date(
      year,
      month,
      1,
    );

  const startDay =
    new Date(
      year,
      month,
      1 -
        firstDayOfMonth.getDay(),
    );

  const today =
    new Date();

  const todayKey =
    formatDateKey(today);

  const days: CalendarDay[] =
    [];

  for (
    let index = 0;
    index < 42;
    index += 1
  ) {
    const date =
      new Date(
        startDay.getFullYear(),
        startDay.getMonth(),
        startDay.getDate() +
          index,
      );

    days.push({
      date,

      dateKey:
        formatDateKey(date),

      day:
        date.getDate(),

      isCurrentMonth:
        date.getMonth() ===
        month,

      isToday:
        formatDateKey(date) ===
        todayKey,
    });
  }

  return days;
}

function formatMonthTitle(
  date: Date,
): string {
  const formattedDate =
    date.toLocaleDateString(
      'pt-BR',
      {
        month: 'long',
        year: 'numeric',
      },
    );

  return (
    formattedDate
      .charAt(0)
      .toUpperCase() +
    formattedDate.slice(1)
  );
}

function formatSelectedDate(
  dateKey: string,
): string {
  const [
    year,
    month,
    day,
  ] = dateKey
    .split('-')
    .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day,
    );

  const formattedDate =
    date.toLocaleDateString(
      'pt-BR',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      },
    );

  return (
    formattedDate
      .charAt(0)
      .toUpperCase() +
    formattedDate.slice(1)
  );
}