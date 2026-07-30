* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: #0f172a;
    color: #f8fafc;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.container {
    width: 100%;
    max-width: 600px;
}

.card {
    background-color: #1e293b;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    border: 1px solid #334155;
}

.hidden {
    display: none !important;
}

h1, h2 {
    text-align: center;
    margin-bottom: 15px;
    color: #ef4444;
}

.subtitle, .info-text {
    text-align: center;
    color: #94a3b8;
    margin-bottom: 20px;
    font-size: 0.95rem;
}

.form-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
    color: #cbd5e1;
    font-weight: 600;
}

input, select, textarea {
    width: 100%;
    padding: 12px;
    background-color: #0f172a;
    border: 1px solid #475569;
    border-radius: 6px;
    color: #fff;
    font-size: 1rem;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #ef4444;
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
}

.btn {
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary { background-color: #2563eb; color: white; }
.btn-primary:hover { background-color: #1d4ed8; }

.btn-secondary { background-color: #475569; color: white; }
.btn-secondary:hover { background-color: #334155; }

.btn-success { background-color: #16a34a; color: white; }
.btn-success:hover { background-color: #15803d; }

.btn-danger { background-color: #dc2626; color: white; font-size: 1.1rem; }
.btn-danger:hover { background-color: #b91c1c; }

.btn-back { background-color: transparent; border: 1px solid #475569; color: #94a3b8; }
.btn-back:hover { background-color: #334155; color: white; }

.error-msg {
    color: #f87171;
    text-align: center;
    font-weight: bold;
    margin-top: 10px;
}

.user-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.badge {
    background-color: #0284c7;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
}

/* EKRAN ALARMOWY REMIZY */
.alarm-box {
    background-color: #0f172a;
    border: 2px solid #334155;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin-bottom: 20px;
}

.alarm-active {
    border-color: #ef4444;
    background-color: #450a0a;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.stats-box {
    display: flex;
    justify-content: space-around;
    background-color: #0f172a;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-size: 0.85rem;
}

.historia-item {
    background-color: #0f172a;
    border-left: 4px solid #ef4444;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 10px;
}

.historia-naglowek {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #94a3b8;
}
