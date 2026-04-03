import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Suppliers from './pages/Suppliers';
import SupplierDetails from './pages/SupplierDetails';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes */}
                    <Route path="/" element={
                        <PrivateRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/invoices" element={
                        <PrivateRoute>
                            <Layout>
                                <Invoices />
                            </Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Layout>
                                <Settings />
                            </Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/suppliers" element={
                        <PrivateRoute>
                            <Layout>
                                <Suppliers />
                            </Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/suppliers/:id" element={
                        <PrivateRoute>
                            <Layout>
                                <SupplierDetails />
                            </Layout>
                        </PrivateRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
