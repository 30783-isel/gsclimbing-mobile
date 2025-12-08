import React from 'react';
import ProjectsScreen from '@/screens/ProjectsScreen';

export default function AdminProjectsRoute() {
  return <ProjectsScreen userRole="ADMIN" />;
}