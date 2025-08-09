// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/billets', require('./routes/billets'));
app.use('/api/fournisseurs', require('./routes/fournisseurs'));
app.use('/api/factures-fournisseurs', require('./routes/facturesFournisseurs')); 