function loadStats() {
  if (!currentUser) {
    return;
  }

  fetch('php/get_stats.php')
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data.status === 'success') {
        document.getElementById('stat-total-workouts').textContent = data.total_workouts;
        document.getElementById('stat-total-minutes').textContent = data.total_minutes;
        document.getElementById('stat-top-exercise').textContent = data.top_exercise;

        const musclesDiv = document.getElementById('stats-muscles');
        if (data.muscle_groups.length === 0) {
          musclesDiv.innerHTML = '<p class="muted small">Noch keine Daten.</p>';
        } else {
          musclesDiv.innerHTML = data.muscle_groups.map(function (mg) {
            return (
              '<div style="margin-bottom: 12px;">' +
              '<strong>' + (mg.muscle_group || 'Sonstiges') + '</strong>' +
              '<small style="display: block; color: #777;">' +
              mg.sets_count + ' Sätze in ' + mg.workouts_count + ' Workouts' +
              '</small>' +
              '</div>'
            );
          }).join('');
        }
        updateMuscleMap(data.muscle_groups);
      }
    })
    .catch(function (err) {
      console.error('Stats load error:', err);
    });

  fetch('php/get_history.php')
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data.status === 'success') {
        renderHistory(data.history);
      }
    })
    .catch(function (err) {
      console.error('History load error:', err);
    });
}

function updateMuscleMap(muscleGroups) {
  const targetSets = 6;

  function normalizeMuscleGroup(raw) {
    const v = (raw || '').trim();

    if (v === 'Forearm') return 'Unterarme';
    if (v === 'Calvs' || v === 'Calves') return 'Waden';
    if (v === 'Glutes') return 'Gluteus';
    if (v === 'Aductors') return 'Adduktoren';

    return v;
  }

  const overlays = document.querySelectorAll('.muscle-overlay');
  overlays.forEach(function (element) {
    element.style.backgroundColor = 'rgba(255, 0, 0, 0)';
  });

  (muscleGroups || []).forEach(function (mg) {
    const muscle = normalizeMuscleGroup(mg.muscle_group);
    let id = '';

    if (muscle === 'Brust') id = 'muscle-chest';

    if (muscle === 'Schultern') {
      setOverlayColor('muscle-shoulder-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-shoulder-right', mg.sets_count, targetSets);
      return;
    }
    if (muscle === 'Bizeps'){
      setOverlayColor('muscle-bizeps-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-bizeps-right', mg.sets_count, targetSets);
      return;
    }

    if (muscle === 'Unterarme') {
      setOverlayColor('muscle-forearm-front-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-forearm-front-right', mg.sets_count, targetSets);
      setOverlayColor('muscle-forearm-back-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-forearm-back-right', mg.sets_count, targetSets);

      return;
    }

    if (muscle === 'Rücken') id = 'muscle-back';
    if (muscle === 'Unterer Rücken') id = 'muscle-lowerback';
    if (muscle === 'Trizeps'){
      setOverlayColor('muscle-triceps-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-triceps-right', mg.sets_count, targetSets);
      return;
    }
    if (muscle === 'Quadrizeps'){
      setOverlayColor('muscle-quads-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-quads-right', mg.sets_count, targetSets);
      return;
    }
    if (muscle === 'Adduktoren'){
      setOverlayColor('muscle-adductors-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-adductors-right', mg.sets_count, targetSets);
      return;
    }
    if (muscle === 'Abs') id = 'muscle-abs';
    if (muscle === 'Hamstrings'){
      setOverlayColor('muscle-hamstrings-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-hamstrings-right', mg.sets_count, targetSets);
      return;
    }
    if (muscle === 'Gluteus'){
      setOverlayColor('muscle-glutes-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-glutes-right', mg.sets_count, targetSets);
      return;
    }
    if (muscle === 'Waden'){
      setOverlayColor('muscle-calves-left', mg.sets_count, targetSets);
      setOverlayColor('muscle-calves-right', mg.sets_count, targetSets);
      return;
    }

    if (!id) return;
    setOverlayColor(id, mg.sets_count, targetSets);
  });
}

function setOverlayColor(id, setsCount, targetSets) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

const repsPerSet = 6;
const sets = Number(setsCount);
const target = Number(targetSets);

  let intensity = (sets * repsPerSet) / (target * repsPerSet);
  if (intensity > 1) { intensity = 1; }
  if (intensity < 0) { intensity = 0; }
  const alpha = 0.15 + 0.75 * intensity;
  element.style.backgroundColor = 'rgba(130, 0, 0,' + alpha + ')'
};



function renderHistory(history) {
  const tbody = document.querySelector('#history-table tbody');
  const noHist = document.getElementById('no-history-text');

  if (!history || history.length === 0) {
    tbody.innerHTML = '';
    noHist.style.display = 'block';
    return;
  }

  noHist.style.display = 'none';
  tbody.innerHTML = history.map(function (h) {
    return (
      '<tr>' +
      '<td>' + new Date(h.started_at).toLocaleDateString('de-CH') + '</td>' +
      '<td>' + h.name + '</td>' +
      '<td>' + h.total_duration_minutes + ' min</td>' +
      '<td>' + h.completed_sets + '/' + h.total_sets + '</td>' +
      '<td>' +
      '<button class="secondary" onclick="deleteHistoryEntry(' + h.workout_id + ')">X</button>' +
      '</td>' +
      '</tr>'
    );
  }).join('');
}

function deleteHistoryEntry(workoutId) {
  if (!confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
    return;
  }
  fetch('php/delete_workout.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workout_id: workoutId })
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.status === 'success') {
        loadStats();
      } else {
        alert(data.message || 'Fehler beim Löschen des Eintrags.');
      }
    })
    .catch(function (err) {
      alert('Fehler: ' + err.message);
    });
}
