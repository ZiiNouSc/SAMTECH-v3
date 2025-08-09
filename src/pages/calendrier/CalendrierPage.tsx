import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  Plane, 
  Clock, 
  CheckSquare,
  Plus,
  Filter,
  Eye,
  User,
  MapPin,
  Edit,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { todosAPI, clientsAPI } from '../../services/api';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  type: 'reservation' | 'rappel' | 'rendez_vous' | 'tache' | 'autre';
  clientId?: string;
  clientNom?: string;
  description?: string;
  location?: string;
  color: string;
}

interface EventFormData {
  titre: string;
  type: string;
  clientId: string;
  allDay: boolean;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  description: string;
}

const CalendrierPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [eventFormData, setEventFormData] = useState<EventFormData>({
    titre: '',
    type: 'tache',
    clientId: '',
    allDay: false,
    dateDebut: '',
    dateFin: '',
    lieu: '',
    description: ''
  });

  const eventTypes = [
    { id: 'reservation', label: 'Réservations', icon: Plane, color: '#3B82F6' },
    { id: 'rendez_vous', label: 'Rendez-vous', icon: Users, color: '#10B981' },
    { id: 'rappel', label: 'Rappels', icon: Clock, color: '#F59E0B' },
    { id: 'tache', label: 'Tâches', icon: CheckSquare, color: '#8B5CF6' },
    { id: 'autre', label: 'Autres', icon: Calendar, color: '#6B7280' }
  ];

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, [currentDate, currentView]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Récupérer les tâches depuis l'API
      const todosResponse = await todosAPI.getAll();
      const todos = todosResponse.data.data || [];
      
      // Convertir les tâches en événements calendrier
      const todoEvents: CalendarEvent[] = todos.map((todo: any) => ({
        id: `todo-${todo.id}`,
        title: todo.titre,
        start: todo.dateEcheance,
        end: todo.dateEcheance,
        allDay: false,
        type: 'tache',
        clientId: todo.clientId,
        clientNom: todo.clientNom,
        description: todo.description,
        color: getPriorityColor(todo.priorite)
      }));

      // Pour l'instant, on utilise seulement les tâches
      // Plus tard, on pourra ajouter d'autres types d'événements
      setEvents(todoEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgente': return '#EF4444'; // red-500
      case 'haute': return '#F59E0B'; // yellow-500
      case 'normale': return '#3B82F6'; // blue-500
      case 'faible': return '#10B981'; // green-500
      default: return '#6B7280'; // gray-500
    }
  };

  const handleAddEvent = async () => {
    if (!eventFormData.titre || !eventFormData.dateDebut) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      setActionLoading(true);
      
      // Si c'est une tâche, créer via l'API todos
      if (eventFormData.type === 'tache') {
        await todosAPI.create({
          titre: eventFormData.titre,
          description: eventFormData.description,
          clientId: eventFormData.clientId || undefined,
          dateEcheance: new Date(eventFormData.dateDebut).toISOString(),
          priorite: 'normale',
          type: 'tache',
          assigneA: undefined
        });
      } else {
        // Pour les autres types d'événements, on pourrait créer une API séparée
        // Pour l'instant, on crée juste une tâche
        await todosAPI.create({
          titre: eventFormData.titre,
          description: eventFormData.description,
          clientId: eventFormData.clientId || undefined,
          dateEcheance: new Date(eventFormData.dateDebut).toISOString(),
          priorite: 'normale',
          type: 'tache',
          assigneA: undefined
        });
      }

      // Recharger les événements
      await fetchEvents();
      
      // Fermer le modal et réinitialiser le formulaire
      setShowAddModal(false);
      resetEventForm();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création: ' + (error.response?.data?.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const resetEventForm = () => {
    setEventFormData({
      titre: '',
      type: 'tache',
      clientId: '',
      allDay: false,
      dateDebut: '',
      dateFin: '',
      lieu: '',
      description: ''
    });
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleFilter = (typeId: string) => {
    setActiveFilters(prev => {
      if (prev.includes(typeId)) {
        return (Array.isArray(prev) ? prev : []).filter(id => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const filteredEvents = (Array.isArray(events) ? events : []).filter(event => {
    if ((Array.isArray(activeFilters) ? activeFilters : []).length === 0) return true;
    return activeFilters.includes(event.type);
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reservation': return <Plane className="w-4 h-4" />;
      case 'rendez_vous': return <Users className="w-4 h-4" />;
      case 'rappel': return <Clock className="w-4 h-4" />;
      case 'tache': return <CheckSquare className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatMonth = (date: number) => {
    return format(new Date(date), 'MMMM', { locale: fr });
  };

  const getViewTitle = () => {
    if (currentView === 'month') {
      return `${formatMonth(currentDate.getMonth())} ${currentDate.getFullYear()}`;
    } else if (currentView === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getDate()} - ${weekEnd.getDate()} ${formatMonth(weekStart.getMonth())} ${weekStart.getFullYear()}`;
      } else {
        return `${weekStart.getDate()} ${formatMonth(weekStart.getMonth())} - ${weekEnd.getDate()} ${formatMonth(weekEnd.getMonth())} ${weekStart.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Obtenir le premier lundi (ou le premier jour du mois)
    let startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    if (dayOfWeek !== 1) { // Si ce n'est pas un lundi
      startDate.setDate(firstDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    }
    
    // Obtenir le dernier dimanche (ou le dernier jour du mois)
    let endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    if (lastDayOfWeek !== 0) { // Si ce n'est pas un dimanche
      endDate.setDate(lastDay.getDate() + (7 - lastDayOfWeek));
    }
    
    const days = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const currentDay = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Commencer par lundi
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getHoursInDay = () => {
    const hours = [];
    for (let i = 8; i <= 20; i++) { // De 8h à 20h
      hours.push(i);
    }
    return hours;
  };

  const getEventsForDay = (day: Date) => {
    return (Array.isArray(filteredEvents) ? filteredEvents : []).filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Pour les événements sur toute la journée
      if (event.allDay) {
        return eventStart.toDateString() === day.toDateString();
      }
      
      // Pour les événements avec une heure spécifique
      return eventStart.toDateString() === day.toDateString();
    });
  };

  const getEventsForHour = (day: Date, hour: number) => {
    return (Array.isArray(filteredEvents) ? filteredEvents : []).filter(event => {
      if (event.allDay) return false;
      
      const eventStart = new Date(event.start);
      return eventStart.toDateString() === day.toDateString() && 
             eventStart.getHours() === hour;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const handleEventModalClose = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleEventModalOpen = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
    resetEventForm();
  };

  const handleAddModalOpen = () => {
    setShowAddModal(true);
    resetEventForm();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEventFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddEvent();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Calendrier</h1>
          <p className="text-gray-600">Gérer vos événements et rendez-vous</p>
        </div>
        <button onClick={handleAddModalOpen} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouvel Événement
        </button>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>

      {/* Contrôles du calendrier */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 ml-2">
            {getViewTitle()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setCurrentView('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                currentView === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                currentView === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setCurrentView('day')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                currentView === 'day' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Jour
            </button>
          </div>
          
          <div className="relative">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Filtrer par type"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10 p-2">
              {(Array.isArray(eventTypes) ? eventTypes : []).map(type => (
                <div key={type.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id={`filter-${type.id}`}
                    checked={(Array.isArray(activeFilters) ? activeFilters : []).length === 0 || activeFilters.includes(type.id)}
                    onChange={() => toggleFilter(type.id)}
                    className="mr-2"
                  />
                  <label 
                    htmlFor={`filter-${type.id}`}
                    className="flex items-center cursor-pointer"
                  >
                    <span 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vue du calendrier */}
      <Card className="overflow-hidden">
        {currentView === 'month' && (
          <div className="calendar-month">
            {/* En-têtes des jours de la semaine */}
            <div className="grid grid-cols-7 border-b">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                <div key={index} className="p-2 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grille des jours */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {getDaysInMonth(currentDate).map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-[120px] border-b border-r p-1 ${
                      isToday(day) 
                        ? 'bg-blue-50' 
                        : isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`text-right p-1 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div 
                          key={event.id}
                          onClick={() => handleEventModalOpen(event)}
                          className="text-xs p-1 rounded truncate cursor-pointer"
                          style={{ backgroundColor: event.color + '33' }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {(Array.isArray(dayEvents) ? dayEvents : []).length > 3 && (
                        <div className="text-xs text-gray-500 p-1">
                          + {(Array.isArray(dayEvents) ? dayEvents : []).length - 3} autre(s)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'week' && (
          <div className="calendar-week">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 text-center text-sm font-medium text-gray-700 border-r">
                Heure
              </div>
              {getDaysInWeek(currentDate).map((day, index) => (
                <div 
                  key={index} 
                  className={`p-2 text-center ${
                    isToday(day) ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-700">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Grille des heures */}
            {getHoursInDay().map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b">
                <div className="p-2 text-right text-sm text-gray-500 border-r">
                  {hour}:00
                </div>
                {getDaysInWeek(currentDate).map((day, dayIndex) => {
                  const hourEvents = getEventsForHour(day, hour);
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`p-1 ${isToday(day) ? 'bg-blue-50' : ''}`}
                    >
                      {(Array.isArray(hourEvents) ? hourEvents : []).map(event => (
                        <div 
                          key={event.id}
                          onClick={() => handleEventModalOpen(event)}
                          className="text-xs p-1 rounded truncate cursor-pointer mb-1"
                          style={{ backgroundColor: event.color + '33' }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {currentView === 'day' && (
          <div className="calendar-day">
            <div className="text-center p-4 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
            </div>
            
            {/* Événements sur toute la journée */}
            <div className="p-4 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Toute la journée</h4>
              <div className="space-y-2">
                {getEventsForDay(currentDate)
                  .filter(event => event.allDay)
                  .map(event => (
                    <div 
                      key={event.id}
                      onClick={() => handleEventModalOpen(event)}
                      className="p-2 rounded cursor-pointer"
                      style={{ backgroundColor: event.color + '33' }}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: event.color }}
                        />
                        <span className="font-medium text-gray-900">{event.title}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                  ))}
                {getEventsForDay(currentDate).filter(event => event.allDay).length === 0 && (
                  <p className="text-sm text-gray-500">Aucun événement sur toute la journée</p>
                )}
              </div>
            </div>
            
            {/* Grille des heures */}
            <div className="space-y-4 p-4">
              {getHoursInDay().map(hour => {
                const hourEvents = getEventsForHour(currentDate, hour);
                
                return (
                  <div key={hour} className="relative">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {hour}:00
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                      {(Array.isArray(hourEvents) ? hourEvents : []).map(event => (
                        <div 
                          key={event.id}
                          onClick={() => handleEventModalOpen(event)}
                          className="p-2 rounded cursor-pointer"
                          style={{ backgroundColor: event.color + '33' }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: event.color }}
                              />
                              <span className="font-medium text-gray-900">{event.title}</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {new Date(event.start).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                              {' - '}
                              {new Date(event.end).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
                      {(Array.isArray(hourEvents) ? hourEvents : []).length === 0 && (
                        <div className="h-8 border border-dashed border-gray-200 rounded-lg"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Modal détails événement */}
      <Modal
        isOpen={showEventModal}
        onClose={handleEventModalClose}
        title="Détails de l'événement"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEvent.color }}
              />
              <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <div className="flex items-center">
                    {getTypeIcon(selectedEvent.type)}
                    <span className="ml-2 capitalize">{selectedEvent.type.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date et heure
                  </label>
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {selectedEvent.allDay ? (
                      <span>
                        {new Date(selectedEvent.start).toLocaleDateString('fr-FR')} (Toute la journée)
                      </span>
                    ) : (
                      <span>
                        {new Date(selectedEvent.start).toLocaleDateString('fr-FR')}{' '}
                        {new Date(selectedEvent.start).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {' - '}
                        {new Date(selectedEvent.end).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {selectedEvent.clientNom && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedEvent.clientNom}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {selectedEvent.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lieu
                    </label>
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedEvent.location}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEvent.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900">{selectedEvent.description}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button className="btn-secondary">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
              <button className="btn-primary">
                <Bell className="w-4 h-4 mr-2" />
                Ajouter un rappel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal ajout événement */}
      <Modal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
        title="Nouvel événement"
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input 
              type="text" 
              name="titre" 
              value={eventFormData.titre} 
              onChange={handleFormChange} 
              className="input-field" 
              placeholder="Titre de l'événement" 
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select 
                name="type" 
                value={eventFormData.type} 
                onChange={handleFormChange} 
                className="input-field" 
                required
              >
                {(Array.isArray(eventTypes) ? eventTypes : []).map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client (optionnel)
              </label>
              <select 
                name="clientId" 
                value={eventFormData.clientId} 
                onChange={handleFormChange} 
                className="input-field"
              >
                <option value="">Aucun client</option>
                {(Array.isArray(clients) ? clients : []).map(client => (
                  <option key={client._id} value={client._id}>
                    {client.entreprise || `${client.prenom} ${client.nom}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input 
              type="checkbox" 
              name="allDay" 
              checked={eventFormData.allDay} 
              onChange={handleFormChange} 
              id="allDay" 
              className="mr-2"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700">
              Toute la journée
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input 
                type="datetime-local" 
                name="dateDebut" 
                value={eventFormData.dateDebut} 
                onChange={handleFormChange} 
                className="input-field" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin *
              </label>
              <input 
                type="datetime-local" 
                name="dateFin" 
                value={eventFormData.dateFin} 
                onChange={handleFormChange} 
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lieu
            </label>
            <input 
              type="text" 
              name="lieu" 
              value={eventFormData.lieu} 
              onChange={handleFormChange} 
              className="input-field" 
              placeholder="Lieu de l'événement"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea 
              name="description" 
              value={eventFormData.description} 
              onChange={handleFormChange} 
              className="input-field" 
              rows={3} 
              placeholder="Description de l'événement"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleAddModalClose}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : 'Créer l\'événement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendrierPage;