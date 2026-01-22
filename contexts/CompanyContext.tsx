import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarEmpresas, type Company } from '@/lib/services/companies';
import { useAuth } from './AuthContext';

interface CompanyContextData {
  selectedCompany: Company | null;
  companies: Company[];
  loading: boolean;
  setSelectedCompany: (company: Company | null) => Promise<void>;
  loadCompanies: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextData>({} as CompanyContextData);

const STORAGE_KEY = '@borderless:selectedCompanyId';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega todas as empresas do usuário
   */
  const loadCompanies = useCallback(async () => {
    if (!userId) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await buscarEmpresas(userId, { ativa: true });

      if (error) {
        console.error('Erro ao carregar empresas:', error);
        setCompanies([]);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Carrega a empresa salva do AsyncStorage
   */
  const loadSavedCompany = useCallback(async () => {
    try {
      const savedCompanyId = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedCompanyId && companies.length > 0) {
        const company = companies.find(c => c.id?.toString() === savedCompanyId);
        if (company) {
          setSelectedCompanyState(company);
          return;
        }
      }

      // Se não encontrou empresa salva, seleciona a primeira disponível
      if (companies.length > 0 && !selectedCompany) {
        const firstCompany = companies[0];
        setSelectedCompanyState(firstCompany);
        await AsyncStorage.setItem(STORAGE_KEY, firstCompany.id!.toString());
      }
    } catch (error) {
      console.error('Erro ao carregar empresa salva:', error);
    }
  }, [companies, selectedCompany]);

  /**
   * Define a empresa selecionada e persiste no AsyncStorage
   */
  const setSelectedCompany = useCallback(async (company: Company | null) => {
    try {
      setSelectedCompanyState(company);
      
      if (company?.id) {
        await AsyncStorage.setItem(STORAGE_KEY, company.id.toString());
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Erro ao salvar empresa selecionada:', error);
    }
  }, []);

  /**
   * Recarrega as empresas
   */
  const refreshCompanies = useCallback(async () => {
    await loadCompanies();
  }, [loadCompanies]);

  // Carrega empresas quando userId muda
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Carrega empresa salva quando empresas são carregadas
  useEffect(() => {
    if (companies.length > 0) {
      loadSavedCompany();
    }
  }, [companies, loadSavedCompany]);

  return (
    <CompanyContext.Provider
      value={{
        selectedCompany,
        companies,
        loading,
        setSelectedCompany,
        loadCompanies,
        refreshCompanies,
      }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany deve ser usado dentro de CompanyProvider');
  }
  return context;
}
