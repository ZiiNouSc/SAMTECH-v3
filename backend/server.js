const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const fournisseursRoutes = require('./routes/fournisseurs');
const facturesRoutes = require('./routes/factures');
const facturesFournisseursRoutes = require('./routes/facturesFournisseurs');
const preFacturesRoutes = require('./routes/preFactures');
const prestationsRoutes = require('./routes/prestations');
const caisseRoutes = require('./routes/caisse');
const packagesRoutes = require('./routes/packages');
const billetsRoutes = require('./routes/billets');
const agencesRoutes = require('./routes/agences');
const agentsRoutes = require('./routes/agents');
const ticketsRoutes = require('./routes/tickets');
const todosRoutes = require('./routes/todos');
const documentsRoutes = require('./routes/documents');
const dashboardRoutes = require('./routes/dashboard');
const creancesRoutes = require('./routes/creances');
const reservationsRoutes = require('./routes/reservations');
const profileRoutes = require('./routes/profile');
const parametresRoutes = require('./routes/parametres');
const vitrineRoutes = require('./routes/vitrine');
const rapportsRoutes = require('./routes/rapports');
const notificationsRoutes = require('./routes/notifications');
const calendrierRoutes = require('./routes/calendrier');
const logsRoutes = require('./routes/logs');
const permissionsRoutes = require('./routes/permissions');
const auditRoutes = require('./routes/audit');
const moduleRequestsRoutes = require('./routes/moduleRequests');
const utilisateursRoutes = require('./routes/utilisateurs');
const usersRoutes = require('./routes/users');
const crmRoutes = require('./routes/crm');
const hotelRoutes = require('./routes/hotel');
const visaRoutes = require('./routes/visa');
const assuranceRoutes = require('./routes/assurance');
const manifestRoutes = require('./routes/manifest');
const autrePrestationRoutes = require('./routes/autrePrestation');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sert le dossier uploads en statique
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/fournisseurs', fournisseursRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/factures-fournisseurs', facturesFournisseursRoutes);
app.use('/api/pre-factures', preFacturesRoutes);
app.use('/api/prestations', prestationsRoutes);
app.use('/api/caisse', caisseRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/billets', billetsRoutes);
app.use('/api/agences', agencesRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/creances', creancesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/parametres', parametresRoutes);
app.use('/api/vitrine', vitrineRoutes);
app.use('/api/rapports', rapportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/calendrier', calendrierRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/module-requests', moduleRequestsRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/hotel', hotelRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/assurance', assuranceRoutes);
app.use('/api/manifest', manifestRoutes);
app.use('/api/autres-prestations', autrePrestationRoutes);

// Placeholder for image placeholders
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.redirect(`https://via.placeholder.com/${width}x${height}`);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});