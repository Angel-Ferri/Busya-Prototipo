// panel/auth.js

const CLAVE_CORRECTA = "1234";

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('login-overlay');
    const panel = document.getElementById('panel-chofer');
    const form = document.getElementById('login-form');
    const inputPass = document.getElementById('input-password');
    const errorMsg = document.getElementById('error-msg');
    const btnLogout = document.getElementById('btn-logout');

    // Verificar si ya está autenticado en la sesión actual
    if (sessionStorage.getItem('chofer_autenticado') === 'true') {
        mostrarPanel();
    }

    // Evento submit del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (inputPass.value === CLAVE_CORRECTA) {
            sessionStorage.setItem('chofer_autenticado', 'true');
            mostrarPanel();
            inputPass.value = '';
            errorMsg.style.display = 'none';
        } else {
            errorMsg.style.display = 'block';
            inputPass.value = '';
            inputPass.focus();
        }
    });

    // Cerrar sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('chofer_autenticado');
            window.location.reload();
        });
    }

    function mostrarPanel() {
        overlay.style.display = 'none';
        panel.style.display = 'block';
        
        // Evento personalizado para avisar a chofer.js que inicie la carga de datos
        document.dispatchEvent(new CustomEvent('loginExitoso'));
    }
});