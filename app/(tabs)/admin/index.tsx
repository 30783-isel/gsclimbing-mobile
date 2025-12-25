import React from 'react';
import ProjectsScreen from '@/screens/common/ProjectsScreen';

export default function AdminProjectsRoute() {
  return <ProjectsScreen userRole="ADMIN" />;
}