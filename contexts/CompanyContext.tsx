import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarEmpresas, type Company } from '@/lib/services/companies';
import { buscarEmpresasUsuario, type EmpresaComRole } from '@/lib/services/user-empresas';
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
   * Carrega empresas do usuário
   * SEMPRE busca por associação (user_empresas) para garantir controle de acesso
   * Se a função não existir, usa fallback temporário
   */
  const loadCompanies = useCallback(async () => {
    if (!userId) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Busca empresas associadas via user_empresas (RPC)
      try {
        const empresasAssociadas = await buscarEmpresasUsuario(false);
        
        // Se retornou empresas, usa a lista
        if (empresasAssociadas.length > 0) {
          const empresasConvertidas: Company[] = empresasAssociadas.map(e => ({
            id: e.id,
            codigo_empresa: e.codigo_empresa,
            empresa_telos_id: e.empresa_telos_id,
            razao_social: e.razao_social,
            nome_fantasia: e.nome_fantasia,
            cnpj: e.cnpj,
            ativa: e.ativa && e.associacao_ativa,
            created_at: e.created_at,
          }));
          setCompanies(empresasConvertidas);
          setLoading(false);
          return;
        }
        
        // Lista vazia: usa fallback (empresas onde codigo_empresa = userId)
        // Assim o seletor mostra empresas até o admin vincular o usuário em user_empresas
        const { data, error: fallbackError } = await buscarEmpresas(userId, { ativa: true });
        if (fallbackError) {
          console.error('Erro ao carregar empresas (fallback):', fallbackError);
          setCompanies([]);
          return;
        }
        setCompanies(data || []);
        setLoading(false);
        return;
      } catch (error: any) {
        // RPC não existe (PGRST202): usa fallback
        if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
          console.warn('⚠️ Sistema multiusuário não configurado. Execute user-empresas-setup.sql');
          const { data, error: fallbackError } = await buscarEmpresas(userId, { ativa: true });
          if (fallbackError) {
            console.error('Erro ao carregar empresas (fallback):', fallbackError);
            setCompanies([]);
            return;
          }
          setCompanies(data || []);
          return;
        }
        console.error('Erro ao buscar empresas do usuário:', error);
        setCompanies([]);
      }
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
