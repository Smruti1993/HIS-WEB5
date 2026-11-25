/**
 * toolDefinitions.ts
 *
 * JSON-schema declarations for all 9 AI chat tools.
 * These are given to Gemini so it knows what tools exist and what arguments they take.
 * Descriptions must be clear and concise — they affect token usage on the free tier.
 *
 * Phase 2:  searchPatient, getPatientSummary, getPatientVisits,
 *           getPatientAllergies, getPatientVitals   ← implemented
 * Phase 4:  listDoctors, getAvailableSlots, getDashboardStats  ← declared only
 * Phase 5:  prepareAppointment  ← declared only
 */
import { type Tool } from './llmClient';

export const CHAT_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      // ── Patient search & demographics ────────────────────────────────────
      {
        name: 'search_patient',
        description:
          'Search for patients by name (partial match), phone number, or exact patient ID. ' +
          'Returns up to 5 matches. If multiple results are returned, ask the user to choose one.',
        parameters: {
          type: 'object' as any,
          properties: {
            query: {
              type: 'string' as any,
              description:
                'Patient name (partial OK), phone number, or patient UUID. Min 2 characters.',
            },
          },
          required: ['query'],
        },
      },

      {
        name: 'get_patient_summary',
        description:
          'Get basic demographics and registration info for a specific patient by their ID. ' +
          'Use after identifying the patient from search_patient.',
        parameters: {
          type: 'object' as any,
          properties: {
            patient_id: {
              type: 'string' as any,
              description: 'Patient UUID (from search_patient results).',
            },
          },
          required: ['patient_id'],
        },
      },

      // ── Clinical history ─────────────────────────────────────────────────
      {
        name: 'get_patient_visits',
        description:
          'Get appointment/visit history for a patient. Returns date, doctor, department, status. ' +
          'Clinical staff also see symptoms, notes, and diagnosis. ' +
          'Defaults to the 5 most recent visits.',
        parameters: {
          type: 'object' as any,
          properties: {
            patient_id: {
              type: 'string' as any,
              description: 'Patient UUID.',
            },
            limit: {
              type: 'number' as any,
              description: 'Number of visits to return. Default 5, max 20.',
            },
          },
          required: ['patient_id'],
        },
      },

      {
        name: 'get_patient_allergies',
        description:
          'Get active allergy records for a patient: allergen, reaction, severity, and type.',
        parameters: {
          type: 'object' as any,
          properties: {
            patient_id: {
              type: 'string' as any,
              description: 'Patient UUID.',
            },
          },
          required: ['patient_id'],
        },
      },

      {
        name: 'get_patient_vitals',
        description:
          'Get recent vital signs for a patient: blood pressure, pulse, temperature, SpO2, weight, height. ' +
          'Defaults to the 3 most recent readings.',
        parameters: {
          type: 'object' as any,
          properties: {
            patient_id: {
              type: 'string' as any,
              description: 'Patient UUID.',
            },
            limit: {
              type: 'number' as any,
              description: 'Number of vital records to return. Default 3, max 10.',
            },
          },
          required: ['patient_id'],
        },
      },

      // ── Doctors & availability ────────────────────────────────────────────
      {
        name: 'list_doctors',
        description:
          'List active doctors, optionally filtered by department name.',
        parameters: {
          type: 'object' as any,
          properties: {
            department: {
              type: 'string' as any,
              description: 'Optional department name to filter by (partial match).',
            },
          },
          required: [],
        },
      },

      {
        name: 'get_available_slots',
        description:
          'Get free appointment time slots for a doctor on a specific date.',
        parameters: {
          type: 'object' as any,
          properties: {
            doctor_id: {
              type: 'string' as any,
              description: 'Doctor employee UUID.',
            },
            date: {
              type: 'string' as any,
              description: 'Date to check in YYYY-MM-DD format.',
            },
          },
          required: ['doctor_id', 'date'],
        },
      },

      // ── Dashboard ─────────────────────────────────────────────────────────
      {
        name: 'get_dashboard_stats',
        description:
          "Get today's dashboard statistics: total patients, active doctors, today's appointments, " +
          'appointments by department. Admins see full detail; others see summary counts.',
        parameters: {
          type: 'object' as any,
          properties: {},
          required: [],
        },
      },

      // ── Appointment booking (Phase 5) ─────────────────────────────────────
      {
        name: 'prepare_appointment',
        description:
          'Validate and prepare an appointment booking for user confirmation. ' +
          'Does NOT book the appointment — the user must press the Confirm button. ' +
          'Requires: patient ID, doctor ID, date (YYYY-MM-DD), and time (HH:MM).',
        parameters: {
          type: 'object' as any,
          properties: {
            patient_id: {
              type: 'string' as any,
              description: 'Patient UUID.',
            },
            doctor_id: {
              type: 'string' as any,
              description: 'Doctor employee UUID.',
            },
            date: {
              type: 'string' as any,
              description: 'Appointment date in YYYY-MM-DD format.',
            },
            time: {
              type: 'string' as any,
              description: 'Appointment time in HH:MM (24-hour) format.',
            },
          },
          required: ['patient_id', 'doctor_id', 'date', 'time'],
        },
      },
    ],
  },
];

