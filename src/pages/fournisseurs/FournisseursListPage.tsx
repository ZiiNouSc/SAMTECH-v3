import React, { useState } from 'react';
import { Building2, FileText, Calculator, Plus } from 'lucide-react';
import TransactionsPage from './TransactionsPage';
import { Link } from 'react-router-dom';

type TabType = 'liste' | 'factures' | 'transactions';

const FournisseursListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('liste');

  const tabs = [
    { id: 'liste' as TabType, label: 'Liste des fournisseurs', icon: Building2 },
    { id: 'factures' as TabType, label: 'Situation fournisseurs', icon: FileText },
    { id: 'transactions' as TabType, label: 'Transactions fournisseurs', icon: Calculator }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="relative rounded-2xl p-6 mb-8 shadow-md bg-white/70 backdrop-blur-md border border-white/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Gestion des Fournisseurs</h1>
          <p className="text-gray-600">Gérer votre base de fournisseurs</p>
        </div>
        <Link to="/fournisseurs/nouveau" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Fournisseur
        </Link>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] rounded-t-2xl"></div>
      </div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
            </div>
      <div>
        {activeTab === 'liste' && <div>Contenu liste fournisseurs</div>}
        {activeTab === 'factures' && <div>Contenu situation fournisseurs</div>}
        {activeTab === 'transactions' && <TransactionsPage />}
          </div>
    </div>
  );
};

export default FournisseursListPage;