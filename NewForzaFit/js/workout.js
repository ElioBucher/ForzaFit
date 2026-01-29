function renderWorkoutSelect(plans) {
    const select = document.getElementById('workout-plan');
    select.innerHTML =
        '<option value="">-- Plan wählen --</option>' +
        (plans || [])
            .map(function (p) {
                return `<option value="${p.id}">${p.name}</option>`;
            })
            .join('');
}

function renderWorkoutChecklist() {
    const container = document.getElementById('workout-checklist');

    container.innerHTML = (currentWorkout.exercises || []).map(function (ex) {

        let setsHTML = (ex.sets || []).map(function (set) {
            let weightHTML = '';
            if (set.weight) {
                weightHTML = '<span>@ ' + set.weight + 'kg</span>';
            }

            let repsHTML = '';
            if (set.reps) {
                repsHTML = '<span>× ' + set.reps + ' Wiederholungen</span>';
            }

            return (
                '<div style="display: flex; gap: 8px; margin-bottom: 6px; align-items: center;">' +
                '<input type="checkbox" class="set-checkbox" data-set-id="' + set.id + '" ' + (set.completed ? 'checked' : '') + ' />' +
                '<span>Satz ' + set.set_number + '</span>' +
                weightHTML +
                repsHTML +
                '</div>'
            );
        }).join('');

        return (
            '<div style="margin-bottom: 16px;">' +
            '<h4>' + ex.name + '</h4>' +
            '<div style="margin-top: 8px;">' +
            setsHTML +
            '</div>' +
            '</div>'
        );
    }).join('');
    document.querySelectorAll('.set-checkbox').forEach(function (cb) {
        cb.addEventListener('change', async function (e) {
            const setId = e.target.getAttribute('data-set-id');
            let completed = 0;
            if (e.target.checked) {
                completed = 1;
            }

            try {
                await fetch('php/update_set.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ set_id: setId, completed: completed })
                });
            } catch (err) {
                console.error('Update set error:', err);
            }
        });
    });
}

function updateWorkoutTimer() {
  const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  document.getElementById('workout-timer').textContent =
    String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

document.getElementById('start-workout-btn').addEventListener('click', async function () {
  const planId = document.getElementById('workout-plan').value;

  if (!currentUser) {
    alert('Bitte zuerst anmelden');
    return;
  }

  if (!planId) {
    alert('Bitte einen Trainingsplan auswählen!');
    return;
  }

  try {
    const res = await fetch('php/start_workout.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId })
    });
    const data = await res.json();

    if (data.status === 'success') {
      currentWorkout = {
        id: data.workout_id,
        exercises: data.exercises
      };
      renderWorkoutChecklist();

      showView('view-workout-checklist');
      document.getElementById('workout-checklist-card').style.display = 'block';

      workoutStartTime = Date.now();
      clearInterval(workoutTimer);
      workoutTimer = setInterval(updateWorkoutTimer, 1000);
    } else {
      alert(data.message || 'Workout starten fehlgeschlagen');
    }
  } catch (err) {
    alert('Fehler: ' + err.message);
  }
});

document.getElementById('finish-workout-btn').addEventListener('click', async function () {
  if (!currentWorkout) return;

  clearInterval(workoutTimer);

  try {
    const res = await fetch('php/finish_workout.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workout_id: currentWorkout.id })
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert(`Workout beendet! Dauer: ${data.duration_minutes} Minuten`);
      currentWorkout = null;
      document.getElementById('workout-checklist-card').style.display = 'none';
      showView('view-workout');
      loadStats();
    }
  } catch (err) {
    alert('Fehler: ' + err.message);
  }



});

document.getElementById('cancel-workout-btn').addEventListener('click', function () {
  if (confirm('Workout wirklich abbrechen?')) {
    clearInterval(workoutTimer);
    currentWorkout = null;
    document.getElementById('workout-checklist-card').style.display = 'none';
  }
});