import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { Button } from './ui/button';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface DatePickerProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export function DatePicker({ visible, value, onConfirm, onCancel }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value);

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (number | null)[] = [];

    // Preencher dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Preencher dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const changeMonth = (delta: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(month + delta);
      setSelectedDate(newDate);
    };

    const changeYear = (delta: number) => {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(year + delta);
      setSelectedDate(newDate);
    };

    const selectDay = (day: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(day);
      setSelectedDate(newDate);
    };

    const isToday = (day: number | null): boolean => {
      if (day === null) return false;
      const today = new Date();
      return (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      );
    };

    const isSelected = (day: number | null): boolean => {
      if (day === null) return false;
      const current = new Date();
      return (
        day === current.getDate() &&
        month === current.getMonth() &&
        year === current.getFullYear()
      );
    };

    return (
      <View style={styles.calendarContainer}>
        {/* Header com navegação de mês/ano */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeMonth(-1)}
            activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.monthYearContainer}>
            <TouchableOpacity
              style={styles.monthYearButton}
              onPress={() => changeYear(-1)}
              activeOpacity={0.7}>
              <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.monthYearText}>
              {monthNames[month]} {year}
            </ThemedText>
            <TouchableOpacity
              style={styles.monthYearButton}
              onPress={() => changeYear(1)}
              activeOpacity={0.7}>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeMonth(1)}
            activeOpacity={0.7}>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Dias da semana */}
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <ThemedText style={styles.weekDayText}>{day}</ThemedText>
            </View>
          ))}
        </View>

        {/* Grid de dias */}
        <View style={styles.daysGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day === null && styles.dayCellEmpty,
                day !== null && isToday(day) && styles.dayCellToday,
                day !== null && selectedDate.getDate() === day && styles.dayCellSelected,
              ]}
              onPress={() => day !== null && selectDay(day)}
              disabled={day === null}
              activeOpacity={0.7}>
              {day !== null && (
                <ThemedText
                  style={[
                    styles.dayText,
                    isToday(day) && styles.dayTextToday,
                    selectedDate.getDate() === day && styles.dayTextSelected,
                  ]}>
                  {day}
                </ThemedText>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão de hoje */}
        <TouchableOpacity
          style={styles.todayButton}
          onPress={() => setSelectedDate(new Date())}
          activeOpacity={0.7}>
          <ThemedText style={styles.todayButtonText}>Hoje</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <GlassContainer style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Selecionar Data
            </ThemedText>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>

          {renderCalendar()}

          <View style={styles.actions}>
            <Button
              title="Cancelar"
              onPress={onCancel}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title="Confirmar"
              onPress={handleConfirm}
              style={styles.button}
            />
          </View>
        </GlassContainer>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthYearButton: {
    padding: 4,
  },
  monthYearText: {
    color: '#FFFFFF',
    fontSize: 18,
    minWidth: 150,
    textAlign: 'center',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayCellToday: {
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    borderWidth: 1,
    borderColor: '#00b09b',
  },
  dayCellSelected: {
    backgroundColor: '#00b09b',
  },
  dayText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  dayTextToday: {
    color: '#00b09b',
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    borderWidth: 1,
    borderColor: '#00b09b',
  },
  todayButtonText: {
    color: '#00b09b',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});
