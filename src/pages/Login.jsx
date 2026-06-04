import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
                setIsLoading(false);
            }
        } catch {
            setError('Ocorreu um erro ao fazer login.');
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon-lg">N</div>
                    <h1>Controle de Notas</h1>
                    <p>Acesse seu painel financeiro</p>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <div className="input-with-icon">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Senha</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : (
                            <>
                                <span>Entrar</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Controle de Notas &copy; 2026</p>
                </div>
            </div>

            <style>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background:
                        radial-gradient(circle at 20% 15%, rgba(35, 183, 239, 0.24), transparent 26rem),
                        radial-gradient(circle at 85% 75%, rgba(8, 108, 235, 0.16), transparent 30rem),
                        var(--bg-app);
                    padding: 1rem;
                }
                .login-card {
                    background: white;
                    padding: 2.5rem;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-xl);
                    width: 100%;
                    max-width: 420px;
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .logo-icon-lg {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--primary-500), var(--accent-cyan));
                    color: white;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.5rem;
                    margin: 0 auto 1rem;
                    box-shadow: 0 16px 30px rgba(8, 108, 235, 0.24);
                }
                .login-header h1 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    margin-bottom: 0.5rem;
                }
                .login-header p {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .btn-block {
                    width: 100%;
                    padding: 0.875rem;
                    font-size: 1rem;
                    margin-top: 1rem;
                }
                .alert-error {
                    background-color: var(--danger-bg);
                    color: var(--danger);
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }
                .login-footer {
                    margin-top: 2rem;
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }
                .login-footer code {
                    background: var(--slate-100);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-family: monospace;
                    display: block;
                    margin-top: 0.5rem;
                }
            `}</style>
        </div>
    );
};

export default Login;
