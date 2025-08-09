import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ModuleProtectedRoute from './components/layout/ModuleProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import ArgonLayout from './components/layout/ArgonLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterWizard from './pages/auth/RegisterWizard';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';
import DashboardPage from './pages/dashboard';
import ArgonDashboardExample from './pages/dashboard/ArgonDashboardExample';
import ClientsListPageEnhanced from './pages/clients/ClientsListPageEnhanced';
import ClientFormPage from './pages/clients/ClientFormPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import AgentsPage from './pages/agents/AgentsPage';
import AgencesListPage from './pages/agences/AgencesListPage';
import FournisseursPage from './pages/fournisseurs/FournisseursPage';
import FournisseurDetailPage from './pages/fournisseurs/FournisseurDetailPage';
import EditFournisseurPage from './pages/fournisseurs/EditFournisseurPage';
import CreateFournisseurPage from './pages/fournisseurs/CreateFournisseurPage';
import FacturesListPage from './pages/factures/FacturesListPage';
import FacturesNewPage from './pages/factures/FacturesNewPage';
import FacturesFournisseursPage from './pages/factures-fournisseurs/FacturesFournisseursPage';
import FactureFournisseurFormPage from './pages/factures-fournisseurs/FactureFournisseurFormPage';
import BilletsListPage from './pages/billets/BilletsListPage';
import NouveauBilletPage from './pages/billets/NouveauBilletPage';
import BilletDetailPage from './pages/billets/BilletDetailPage';
import NouvelleAssurancePage from './pages/assurance/NouvelleAssurancePage';
import NouveauManifestPage from './pages/manifest/NouveauManifestPage';
import HotelListPage from './pages/hotel/HotelListPage';
import NouveauHotelPage from './pages/hotel/NouveauHotelPage';
import VisaListPage from './pages/visa/VisaListPage';
import NouveauVisaPage from './pages/visa/NouveauVisaPage';
import ProfilePage from './pages/profile/ProfilePage';
import ParametresPage from './pages/parametres/ParametresPage';
import ModuleRequestPage from './pages/parametres/ModuleRequestPage';
import CaissePage from './pages/caisse/CaissePage';
import CalendrierPage from './pages/calendrier/CalendrierPage';
import TodosPage from './pages/todos/TodosPage';
import TodoFormPage from './pages/todos/TodoFormPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import TicketsListPage from './pages/tickets/TicketsListPage';
import AuditPage from './pages/audit/AuditPage';
import RapportsPage from './pages/rapports/RapportsPage';
import SituationPage from './pages/situation/SituationPage';
import CrmPage from './pages/crm/CrmPage';
import CreancesListPage from './pages/creances/CreancesListPage';
import ReservationsListPage from './pages/reservations/ReservationsListPage';
import PackagesListPage from './pages/packages/PackagesListPage';
import PackageFormPage from './pages/packages/PackageFormPage';
import TransactionsPage from './pages/fournisseurs/TransactionsPage';
import PreFacturesListPage from './pages/pre-factures/PreFacturesListPage';
import PreFacturesNewPage from './pages/pre-factures/PreFacturesNewPage';
import FournisseursListPage from './pages/fournisseurs/FournisseursListPage';
import VitrinePage from './pages/vitrine/VitrinePage';
import VitrinePublicPage from './pages/vitrine/VitrinePublicPage';
import AdminPage from './pages/admin/AdminPage';
import LogsPage from './pages/logs/LogsPage';
import NotFound404 from './pages/NotFound404';
import AutresPrestationsPage from './pages/autres-prestations/AutresPrestationsPage';
import NouvellePrestationPage from './pages/autres-prestations/NouvellePrestationPage';
import SuperAdminRoute from './components/layout/SuperAdminRoute';
import AssuranceListPage from './pages/assurance/AssuranceListPage';
import ManifestListPage from './pages/manifest/ManifestListPage';
import './App.css';

// Routes principales de l'application
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterWizard />} />
      <Route path="/auth/pending-approval" element={<PendingApprovalPage />} />
      <Route path="site/:slug" element={<VitrinePublicPage />} />
      
      {/* Route Argon pour démonstration */}
      <Route
        path="/argon/*"
        element={
          <ProtectedRoute>
            <ArgonLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/argon/dashboard" replace />} />
        <Route path="dashboard" element={<ArgonDashboardExample />} />
      </Route>
      
      {/* Routes protégées */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Routes de base - toujours accessibles */}
        <Route path="dashboard" element={
          <ModuleProtectedRoute moduleId="dashboard">
            <DashboardPage />
          </ModuleProtectedRoute>
        } />
        <Route path="profile" element={
          <ModuleProtectedRoute moduleId="profile">
            <ProfilePage />
          </ModuleProtectedRoute>
        } />
        
        {/* Routes avec protection des modules */}
        <Route path="agences" element={
          <SuperAdminRoute>
            <AgencesListPage />
          </SuperAdminRoute>
        } />
        <Route path="clients" element={
          <ModuleProtectedRoute moduleId="clients">
            <ClientsListPageEnhanced />
          </ModuleProtectedRoute>
        } />
        <Route path="clients/nouveau" element={
          <ModuleProtectedRoute moduleId="clients">
            <ClientFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="clients/:id" element={
          <ModuleProtectedRoute moduleId="clients">
            <ClientDetailPage />
          </ModuleProtectedRoute>
        } />
        <Route path="clients/:id/modifier" element={
          <ModuleProtectedRoute moduleId="clients">
            <ClientFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="fournisseurs" element={
          <ModuleProtectedRoute moduleId="fournisseurs">
            <FournisseursPage />
          </ModuleProtectedRoute>
        } />
        <Route path="fournisseurs/nouveau" element={
          <ModuleProtectedRoute moduleId="fournisseurs">
            <CreateFournisseurPage />
          </ModuleProtectedRoute>
        } />
        <Route path="fournisseurs/create" element={
          <ModuleProtectedRoute moduleId="fournisseurs">
            <CreateFournisseurPage />
          </ModuleProtectedRoute>
        } />
        <Route path="fournisseurs/:id" element={
          <ModuleProtectedRoute moduleId="fournisseurs">
            <FournisseurDetailPage />
          </ModuleProtectedRoute>
        } />
        <Route path="fournisseurs/:id/modifier" element={
          <ModuleProtectedRoute moduleId="fournisseurs">
            <EditFournisseurPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures-fournisseurs" element={
          <ModuleProtectedRoute moduleId="factures-fournisseurs">
            <FacturesFournisseursPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures-fournisseurs/nouveau" element={
          <ModuleProtectedRoute moduleId="factures-fournisseurs">
            <FactureFournisseurFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures-fournisseurs/new" element={
          <ModuleProtectedRoute moduleId="factures-fournisseurs">
            <FactureFournisseurFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures-fournisseurs/edit/:id" element={
          <ModuleProtectedRoute moduleId="factures-fournisseurs">
            <FactureFournisseurFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures-fournisseurs/:id/modifier" element={
          <ModuleProtectedRoute moduleId="factures-fournisseurs">
            <FactureFournisseurFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures" element={
          <ModuleProtectedRoute moduleId="factures">
            <FacturesListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures/nouveau" element={
          <ModuleProtectedRoute moduleId="factures">
            <FacturesNewPage />
          </ModuleProtectedRoute>
        } />
        <Route path="factures/:id/modifier" element={
          <ModuleProtectedRoute moduleId="factures">
            <FacturesNewPage />
          </ModuleProtectedRoute>
        } />
        <Route path="pre-factures" element={
          <ModuleProtectedRoute moduleId="pre-factures">
            <PreFacturesListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="pre-factures/nouveau" element={
          <ModuleProtectedRoute moduleId="pre-factures">
            <PreFacturesNewPage />
          </ModuleProtectedRoute>
        } />
        <Route path="creances" element={
          <ModuleProtectedRoute moduleId="creances">
            <CreancesListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="caisse" element={
          <ModuleProtectedRoute moduleId="caisse">
            <CaissePage />
          </ModuleProtectedRoute>
        } />
        <Route path="packages" element={
          <ModuleProtectedRoute moduleId="packages">
            <PackagesListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="packages/nouveau" element={
          <ModuleProtectedRoute moduleId="packages">
            <PackageFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="packages/:id/modifier" element={
          <ModuleProtectedRoute moduleId="packages">
            <PackageFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="billets" element={
          <ModuleProtectedRoute moduleId="billets">
            <BilletsListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="hotel" element={
            <ModuleProtectedRoute moduleId="hotel">
              <HotelListPage />
            </ModuleProtectedRoute>
        } />
        <Route path="hotel/nouveau" element={
            <ModuleProtectedRoute moduleId="hotel">
              <NouveauHotelPage />
            </ModuleProtectedRoute>
        } />
        <Route path="visa" element={
            <ModuleProtectedRoute moduleId="visa">
              <VisaListPage />
            </ModuleProtectedRoute>
        } />
        <Route path="visa/nouveau" element={
            <ModuleProtectedRoute moduleId="visa">
              <NouveauVisaPage />
            </ModuleProtectedRoute>
        } />
        <Route path="assurance" element={
            <ModuleProtectedRoute moduleId="assurance">
              <AssuranceListPage />
            </ModuleProtectedRoute>
        } />
        <Route path="assurance/nouveau" element={
            <ModuleProtectedRoute moduleId="assurance">
              <NouvelleAssurancePage />
            </ModuleProtectedRoute>
        } />
        <Route path="manifest" element={
            <ModuleProtectedRoute moduleId="manifest">
              <ManifestListPage />
            </ModuleProtectedRoute>
        } />
        <Route path="manifest/nouveau" element={
            <ModuleProtectedRoute moduleId="manifest">
              <NouveauManifestPage />
            </ModuleProtectedRoute>
        } />
        <Route path="manifest/:id/modifier" element={
            <ModuleProtectedRoute moduleId="manifest">
              <NouveauManifestPage />
            </ModuleProtectedRoute>
        } />
        <Route path="autre-prestation" element={
            <ModuleProtectedRoute moduleId="autre-prestation">
              <AutresPrestationsPage />
            </ModuleProtectedRoute>
        } />
        <Route path="autre-prestation/nouveau" element={
            <ModuleProtectedRoute moduleId="autre-prestation">
              <NouvellePrestationPage />
            </ModuleProtectedRoute>
        } />
        <Route path="autres-prestations" element={
            <ModuleProtectedRoute moduleId="autre-prestation">
              <AutresPrestationsPage />
            </ModuleProtectedRoute>
        } />
        <Route path="autres-prestations/nouveau" element={
            <ModuleProtectedRoute moduleId="autre-prestation">
              <NouvellePrestationPage />
            </ModuleProtectedRoute>
        } />
        <Route path="billets/nouveau" element={
          <ModuleProtectedRoute moduleId="billets">
            <NouveauBilletPage />
          </ModuleProtectedRoute>
        } />
        <Route path="billets/:id" element={
          <ModuleProtectedRoute moduleId="billets">
            <BilletDetailPage />
          </ModuleProtectedRoute>
        } />
        <Route path="fournisseurs" element={
          <ModuleProtectedRoute moduleId="fournisseurs">
            <FournisseursListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="fournisseurs/:id" element={
          <ModuleProtectedRoute moduleId="fournisseurs">
            <FournisseurDetailPage />
          </ModuleProtectedRoute>
        } />
        <Route path="transactions" element={
          <ModuleProtectedRoute moduleId="transactions">
            <TransactionsPage />
          </ModuleProtectedRoute>
        } />
        <Route path="tickets" element={
          <ModuleProtectedRoute moduleId="tickets">
            <TicketsListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="reservations" element={
          <ModuleProtectedRoute moduleId="reservations">
            <ReservationsListPage />
          </ModuleProtectedRoute>
        } />
        <Route path="crm" element={
          <ModuleProtectedRoute moduleId="crm">
            <CrmPage />
          </ModuleProtectedRoute>
        } />
        <Route path="documents" element={
          <ModuleProtectedRoute moduleId="documents">
            <DocumentsPage />
          </ModuleProtectedRoute>
        } />
        <Route path="rapports" element={
          <ModuleProtectedRoute moduleId="rapports">
            <RapportsPage />
          </ModuleProtectedRoute>
        } />
        <Route path="audit" element={
          <SuperAdminRoute>
            <AuditPage />
          </SuperAdminRoute>
        } />
        <Route path="calendrier" element={
          <ModuleProtectedRoute moduleId="calendrier">
            <CalendrierPage />
          </ModuleProtectedRoute>
        } />
        <Route path="todos" element={
          <ModuleProtectedRoute moduleId="todos">
            <TodosPage />
          </ModuleProtectedRoute>
        } />
        <Route path="todos/nouveau" element={
          <ModuleProtectedRoute moduleId="todos">
            <TodoFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="todos/:id/modifier" element={
          <ModuleProtectedRoute moduleId="todos">
            <TodoFormPage />
          </ModuleProtectedRoute>
        } />
        <Route path="logs" element={
          <SuperAdminRoute>
            <LogsPage />
          </SuperAdminRoute>
        } />
        <Route path="situation" element={
          <ModuleProtectedRoute moduleId="situation">
            <SituationPage />
          </ModuleProtectedRoute>
        } />
        <Route path="vitrine" element={
          <ModuleProtectedRoute moduleId="vitrine">
            <VitrinePage />
          </ModuleProtectedRoute>
        } />
        <Route path="agents" element={
          <ModuleProtectedRoute moduleId="agents">
            <AgentsPage />
          </ModuleProtectedRoute>
        } />
        <Route path="admin" element={
          <ModuleProtectedRoute moduleId="admin">
            <AdminPage />
          </ModuleProtectedRoute>
        } />
        <Route path="parametres" element={
          <ModuleProtectedRoute moduleId="parametres">
            <ParametresPage />
          </ModuleProtectedRoute>
        } />
        <Route path="parametres/modules" element={
          <ModuleProtectedRoute moduleId="module-requests">
            <ModuleRequestPage />
          </ModuleProtectedRoute>
        } />
        {/* Route 404 personnalisée */}
        <Route path="*" element={<NotFound404 />} />
      </Route>
      
      {/* Redirection par défaut */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gradient-to-br from-white via-[#F3F4F6] to-[#A259F7]/10">
          <AppRoutes />
          {/* {import.meta.env.DEV && <DebugAuth />} */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;