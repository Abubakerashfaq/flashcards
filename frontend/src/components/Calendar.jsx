import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { apiGetSchedule, apiCreateSchedule, apiDeleteSchedule, apiGetDecks } from "../api";

function Calendar() {
  const [events, setEvents] = useState([]);
  const [decks, setDecks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDeck, setSelectedDeck] = useState('');

  useEffect(() => {
    loadEvents();
    apiGetDecks().then(setDecks).catch(() => {});
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiGetSchedule();
      setEvents(data.map(e => ({
        id: e.id,
        title: e.title,
        start: e.time ? `${e.date}T${e.time}` : e.date,
        backgroundColor: e.color,
        borderColor: e.color,
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setSelectedTime('09:00');
    setSelectedDeck('');
    setShowModal(true);
  };

  const handleEventClick = async (info) => {
    if (window.confirm(`Remove "${info.event.title}" from schedule?`)) {
      await apiDeleteSchedule(info.event.id);
      loadEvents();
    }
  };

  const handleAdd = async () => {
    if (!selectedDeck) return;
    await apiCreateSchedule(parseInt(selectedDeck), selectedDate, selectedTime);
    setShowModal(false);
    loadEvents();
  };

  return (
    <div style={{ position: 'relative' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          start: "today prev,next",
          center: "title",
          end: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="90vh"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <h3 style={{ margin: 0 }}>Schedule a deck for {selectedDate}</h3>
            <select
              value={selectedDeck}
              onChange={e => setSelectedDeck(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">Select a deck...</option>
              {decks.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <input
              type="time"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc',
                cursor: 'pointer', background: 'white'
              }}>Cancel</button>
              <button onClick={handleAdd} style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', background: '#378ADD', color: 'white'
              }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;