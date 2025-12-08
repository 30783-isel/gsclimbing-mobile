import React from 'react';
import ProjectsScreen from '@/screens/partilhado/ProjectsScreen';

export default function AdminProjectsRoute() {
  return <ProjectsScreen userRole="ADMIN" />;
}