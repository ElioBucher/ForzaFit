let currentUser = null;
let currentWorkout = null;
let tempExercises = [];
let workoutTimer = null;
let workoutStartTime = null;
let currentPlanId = null;

const views = document.querySelectorAll('.view');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnProfile = document.getElementById('btn-profile');
const btnLogout = document.getElementById('btn-logout');
const navLogo = document.querySelector('.nav-logo');


function checkAuth() {
  fetch('php/check_auth.php')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.authenticated) {
        currentUser = data.username;
        setAuthUI(true, data.username);
        loadPlans();
        loadStats();
        showView('view-landing');
      } else {
        setAuthUI(false);
        showView('view-landing');
      }
    })
    .catch(function (err) {
      console.error('Auth check error:', err);
      setAuthUI(false);
      showView('view-landing');
    });
}

function setAuthUI(isLoggedIn, username = '') {
  if (isLoggedIn) {
    btnLogin.style.display = 'none';
    btnRegister.style.display = 'none';
    btnProfile.style.display = 'inline-flex';
    btnLogout.style.display = 'inline-flex';
    btnProfile.textContent = username;
  } else {
    btnLogin.style.display = 'inline-flex';
    btnRegister.style.display = 'inline-flex';
    btnProfile.style.display = 'none';
    btnLogout.style.display = 'none';
  }
}

document.querySelectorAll('.nav-link[data-target]').forEach(function (btn) {
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const target = btn.getAttribute('data-target');

    if (currentWorkout) {
      const reallyEnd = confirm('Du hast ein laufendes Workout. Möchtest du es wirklich verlassen?');

      if (!reallyEnd) {
        return;
      }
      clearInterval(workoutTimer);
      currentWorkout = null;
      document.getElementById('workout-checklist-card').style.display = 'none';
    }

    showView(target);
  });
});

if (navLogo) {
  navLogo.addEventListener('click', function () {
    showView('view-landing');
  });
}

function showView(viewId) {
  views.forEach(function (viewElement) {
    viewElement.classList.remove('view-active');
  });
  document.getElementById(viewId).classList.add('view-active');
}

document.getElementById('login-btn').addEventListener('click', async function () {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!username || !password) {
    alert('Alle Felder ausfüllen');
    return;
  }

  try {
    const res = await fetch('php/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert(data.message);
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      currentUser = username;
      setAuthUI(true, username);
      loadPlans();
      loadStats();
      showView('view-landing');
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Fehler: ' + err.message);
  }
});

document.getElementById('register-btn').addEventListener('click', async function () {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const passwordConfirm = document.getElementById('register-password-confirm').value.trim();

  if (!username || !password || !passwordConfirm) {
    alert('Alle Felder ausfüllen');
    return;
  }

  if (password !== passwordConfirm) {
    alert('Passwörter stimmen nicht überein');
    return;
  }

  try {
    const res = await fetch('php/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, passwordConfirm })
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert('Registrierung erfolgreich!');
      document.getElementById('register-username').value = '';
      document.getElementById('register-password').value = '';
      document.getElementById('register-password-confirm').value = '';
      currentUser = username;
      setAuthUI(true, username);
      loadPlans();
      loadStats();
      showView('view-landing');
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Fehler: ' + err.message);
  }
});

document.getElementById('btn-logout').addEventListener('click', async function () {
  try {
    const res = await fetch('php/logout.php', {
        method: 'POST'
        });
    const data = await res.json();

    if (data.status === 'success') {
      currentUser = null;
      tempExercises = [];
      currentWorkout = null;
      setAuthUI(false);
      showView('view-landing');
      alert('Abgemeldet');
    }
  } catch (err) {
    alert('Logout fehlgeschlagen');
  }
});

checkAuth();