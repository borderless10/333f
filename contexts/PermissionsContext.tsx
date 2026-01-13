import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { canEdit, canDelete, isAdmin, isViewer, type UserRole } from '@/lib/services/profiles';

interface PermissionsContextData {
  userRole: UserRole | null;
  roleLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  isViewerOnly: boolean;
  hasRole: boolean;
}

const PermissionsContext = createContext<PermissionsContextData>({} as PermissionsContextData);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { userRole, roleLoading } = useAuth();

  const permissions = useMemo(() => {
    return {
      userRole,
      roleLoading,
      canEdit: canEdit(userRole),
      canDelete: canDelete(userRole),
      isAdmin: isAdmin(userRole),
      isViewerOnly: isViewer(userRole),
      hasRole: userRole !== null,
    };
  }, [userRole, roleLoading]);

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de um PermissionsProvider');
  }
  return context;
}
