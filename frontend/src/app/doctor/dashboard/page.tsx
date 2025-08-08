'use client';

import React from 'react';
import { PatientList } from '@/components/doctor/patient-list';

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Doctor Portal Dashboard</h1>
      <PatientList />
    </div>
  );
}
