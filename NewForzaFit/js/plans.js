document.getElementById('add-exercise').addEventListener('click', function () {
  const name = document.getElementById('exercise-name').value.trim();
  const muscle = document.getElementById('exercise-muscle').value.trim();
  let weight = parseFloat(document.getElementById('exercise-weight').value);
  let reps = parseInt(document.getElementById('exercise-reps').value);
  let sets = parseInt(document.getElementById('exercise-sets').value);

  if (isNaN(weight) || weight <= 0) weight = 1;
  if (isNaN(reps) || reps <= 0) reps = 8;
  if (isNaN(sets) || sets <= 0) sets = 3;

  if (!name) {
    alert('Übungsname erforderlich');
    return;
  }
  tempExercises.push({ 
    name,
    muscle_group: muscle,
    weight, 
    reps, 
    sets 
});
  renderTempExercises();

  document.getElementById('exercise-name').value = '';
  document.getElementById('exercise-muscle').value = '';
  document.getElementById('exercise-weight').value = '';
  document.getElementById('exercise-reps').value = '';
  document.getElementById('exercise-sets').value = '';
});

function renderTempExercises() {
  const list = document.getElementById('plan-exercise-list');
  const noEx = document.getElementById('no-exercises');

  if (tempExercises.length === 0) {
    list.innerHTML = '';
    noEx.style.display = 'block';
    return;
  }

  noEx.style.display = 'none';

  list.innerHTML = tempExercises.map(function (ex, i) {
    var muscle = ex.muscle_group ? ex.muscle_group : '—';

    return (`
      <li class="list-item">
      <div>
      <strong>${ex.name}</strong> ('${muscle}')
      <br><small>${ex.sets}x ${ex.reps} ${ex.weight}kg</small>
      </div>
      <button class="secondary" onclick="removeTempExercise(${i})">✕</button>
      </li>
    `);
  }).join('');
}

function removeTempExercise(idx) {
  tempExercises.splice(idx, 1);
  renderTempExercises();
}

document.getElementById('save-plan-btn').addEventListener('click', async function () {
  const name = document.getElementById('plan-name').value.trim();

  if (!name) {
    alert('Plan-Name erforderlich');
    return;
  }

  if (tempExercises.length === 0) {
    alert('Mindestens eine Übung erforderlich');
    return;
  }

  try {
    let url;
    let payload = { name: name, exercises: tempExercises };

    if (currentPlanId) {
      url = 'php/update_plan.php';
      payload.id = currentPlanId;
    } else {
      url = 'php/create_plan.php';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert('Plan gespeichert!');
      document.getElementById('plan-name').value = '';
      tempExercises = [];
      currentPlanId = null;
      renderTempExercises();
      loadPlans();
    } else {
      alert(data.message || 'Speichern fehlgeschlagen');
    }
  } catch (err) {
    alert('Fehler: ' + err.message);
  }
});


function loadPlans() {
  if (!currentUser) return;

  fetch('php/get_plans.php')
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data.status === 'success') {
        renderPlans(data.plans);
        renderWorkoutSelect(data.plans);
      }
    })
    .catch(function (err) {
      console.error('Plans load error:', err);
    });
}

function renderPlans(plans) {
  const list = document.getElementById('plan-list');
  const noPlan = document.getElementById('no-plans');

  if (!plans || plans.length === 0) {
    list.innerHTML = '';
    noPlan.style.display = 'block';
    return;
  }

  noPlan.style.display = 'none';
  list.innerHTML = '';

  plans.forEach(function (plan) {
    const li = document.createElement('li');
    li.className = 'list-item';

    const infoDiv = document.createElement('div');
    const count = (plan.exercises && plan.exercises.length) ? plan.exercises.length : 0;

    infoDiv.innerHTML = `<strong>${plan.name}</strong><br><small>${count} Übungen</small>`;

    const editBtn = document.createElement('button');
    editBtn.className = 'secondary';
    editBtn.textContent = 'Bearbeiten';
    editBtn.addEventListener('click', function () {
      loadPlanForEditing(plan.id);
    });


    const delBtn = document.createElement('button');
    delBtn.className = 'secondary';
    delBtn.textContent = 'Löschen';
    delBtn.addEventListener('click', function () {
      deletePlan(plan.id);
    });

    li.appendChild(infoDiv);
    li.appendChild(editBtn);
    li.appendChild(delBtn);

    list.appendChild(li);
  });
}

function deletePlan(planId) {
  if (!confirm('Plan wirklich löschen?')) {
    return;
  }

  fetch('php/delete_plan.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId })
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data.status === 'success') {
        alert('Plan gelöscht');
        loadPlans();
      } else {
        alert(data.message || 'Löschen fehlgeschlagen');
      }
    })
    .catch(function (err) {
      alert('Fehler: ' + err.message);
    });
}

let editingPlanId = null;
let editingExercises = [];

function loadPlanForEditing(planId) {
  fetch('php/update_plan.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId })
  })
    .then(function(r) {
        return r.json();
    })
    .then(function (data) {
      if (data.status === 'success') {
        editingPlanId = planId;
        editingExercises = JSON.parse(JSON.stringify(data.plan.exercises || []));
        showEditPlanModal(data.plan.name, editingExercises);
      } else {
        alert('Fehler: ' + data.message);
      }
    })
    .catch(function(err){
         console.error('Fehler:', err);
    })
}

function showEditPlanModal(planName, exercises) {
  const modal = document.createElement('div');
  modal.id = 'edit-plan-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; align-items: center;
    justify-content: center; z-index: 1000;
  `;

  let exercisesHTML = (exercises || []).map(function (ex, i) {
    return `
    <div style="margin: 15px 0; padding: 15px; background: var(--color-surface); border-radius: 8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h4 style="margin: 0;">${ex.name || 'Neue Übung'}</h4>
        <div>
          <button class="btn btn--secondary btn--sm" onclick="moveEditExercise(${i}, -1)">↑</button>
          <button class="btn btn--secondary btn--sm" onclick="moveEditExercise(${i}, 1)">↓</button>
        </div>
      </div>

      <input type="text" placeholder="Übungsname" value="${ex.name || ''}"
             data-ex-index="${i}" data-field="name"
             class="edit-exercise-input form-control" style="margin-bottom: 10px;">

      <select data-ex-index="${i}" data-field="muscle_group"
              class="edit-exercise-input form-control" style="margin-bottom: 10px;">
        <option value="">Wählen...</option>
        <option value="Brust" ${(ex.muscle_group === 'Brust') ? 'selected' : ''}>Brust</option>
        <option value="Rücken" ${(ex.muscle_group === 'Rücken') ? 'selected' : ''}>Rücken</option>
        <option value="Schultern" ${(ex.muscle_group === 'Schultern') ? 'selected' : ''}>Schultern</option>
        <option value="Bizeps" ${(ex.muscle_group === 'Bizeps') ? 'selected' : ''}>Bizeps</option>
        <option value="Trizeps" ${(ex.muscle_group === 'Trizeps') ? 'selected' : ''}>Trizeps</option>
        <option value="Unterarme" ${(ex.muscle_group === 'Unterarme') ? 'selected' : ''}>Unterarme</option>
        <option value="Quadrizeps" ${(ex.muscle_group === 'Quadrizeps') ? 'selected' : ''}>Quadrizeps/Vorderer Oberschenkel</option>
        <option value="Hamstrings" ${(ex.muscle_group === 'Hamstrings') ? 'selected' : ''}>Hamstrings/Hinterer Oberschenkel</option>
        <option value="Gluteus" ${(ex.muscle_group === 'Gluteus') ? 'selected' : ''}>Glutes</option>
        <option value="Adduktoren" ${(ex.muscle_group === 'Adduktoren') ? 'selected' : ''}>Adduktoren</option>
        <option value="Waden" ${(ex.muscle_group === 'Waden') ? 'selected' : ''}>Waden</option>
        <option value="Abs" ${(ex.muscle_group === 'Abs') ? 'selected' : ''}>Sixpack</option>
        <option value="Unterer Rücken" ${(ex.muscle_group === 'Unterer Rücken') ? 'selected' : ''}>Unterer Rücken</option>
      </select>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
        <div>
          <label>Gewicht (kg)</label>
          <input type="number" placeholder="Gewicht"
                 value="${(ex.sets && ex.sets[0] && ex.sets[0].weight) ? ex.sets[0].weight : (ex.weight || 0.5)}"
                 data-ex-index="${i}" data-field="weight"
                 class="edit-exercise-input form-control">
        </div>
        <div>
          <label>Reps</label>
          <input type="number" placeholder="Reps"
                 value="${(ex.sets && ex.sets[0] && ex.sets[0].reps) ? ex.sets[0].reps : (ex.reps || 8)}"
                 data-ex-index="${i}" data-field="reps"
                 class="edit-exercise-input form-control">
        </div>
        <div>
          <label>Sätze</label>
          <input type="number" placeholder="Sätze"
                 value="${(ex.sets && ex.sets.length) ? ex.sets.length : (ex.sets_count || 3)}"
                 data-ex-index="${i}" data-field="sets"
                 class="edit-exercise-input form-control">
        </div>
      </div>

      <button class="btn btn--secondary btn--sm" onclick="removeEditExercise(${i})">Löschen</button>
    </div>
  `
}).join('');
  

  if (!exercisesHTML) {
    exercisesHTML = '<p class="muted small">Noch keine Übungen im Plan.</p>';
  }

  modal.innerHTML = `
    <div style="background: var(--color-surface); padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
      <h2 style="margin-top: 0;">Plan bearbeiten: ${planName}</h2>
      <div id="edit-exercises-list" style="margin: 20px 0;">
        ${exercisesHTML}
      </div>

      <button class="btn btn--secondary btn--sm" onclick="addEditExercise()">+ Übung hinzufügen</button>

      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button class="btn btn--primary" onclick="savePlanChanges()">Speichern</button>
        <button class="btn btn--secondary" onclick="closeEditModal()">Abbrechen</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function addEditExercise() {
  editingExercises.push({
    name: '',
    muscle_group: '',
    sets: [{ weight: 0.5, reps: 8 }]
  });
  const modal = document.getElementById('edit-plan-modal');
  if (modal) modal.remove();
  showEditPlanModal('Plan', editingExercises);
}

function moveEditExercise(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= editingExercises.length) return;

  const tmp = editingExercises[index];
  editingExercises[index] = editingExercises[newIndex];
  editingExercises[newIndex] = tmp;

  const modal = document.getElementById('edit-plan-modal');
  if (modal) modal.remove();
  showEditPlanModal('Plan', editingExercises);
}

function removeEditExercise(index) {
  editingExercises.splice(index, 1);
  const modal = document.getElementById('edit-plan-modal');
  if (modal) modal.remove();
  showEditPlanModal('Plan', editingExercises);
}

function closeEditModal() {
  const modal = document.getElementById('edit-plan-modal');
  if (modal) modal.remove();
}

async function savePlanChanges() {
  if (!editingPlanId) {
    alert('Fehler: Plan-ID nicht gesetzt');
    return;
  }

  const inputs = document.querySelectorAll('.edit-exercise-input');
  const exercisesData = [];

  inputs.forEach(function (input) {
    const exIndex = parseInt(input.getAttribute('data-ex-index'), 10);
    const field = input.getAttribute('data-field');

    if (!exercisesData[exIndex]) {
      exercisesData[exIndex] = {
        name: editingExercises[exIndex].name || '',
        muscle_group: editingExercises[exIndex].muscle_group || '',
        weight: (editingExercises[exIndex].sets && editingExercises[exIndex].sets[0])
          ? parseFloat(editingExercises[exIndex].sets[0].weight || 0.5)
          : 0.5,
        reps: (editingExercises[exIndex].sets && editingExercises[exIndex].sets[0])
          ? parseInt(editingExercises[exIndex].sets[0].reps || 8, 10)
          : 8,
        sets: (editingExercises[exIndex].sets && editingExercises[exIndex].sets.length)
          ? editingExercises[exIndex].sets.length
          : 3
      };
    }

    if (field === 'weight') {
      exercisesData[exIndex].weight = parseFloat(input.value) || 0.5;
    } else if (field === 'reps') {
      exercisesData[exIndex].reps = parseInt(input.value, 10) || 8;
    } else if (field === 'sets') {
      exercisesData[exIndex].sets = parseInt(input.value, 10) || 3;
    } else {
      exercisesData[exIndex][field] = input.value;
    }
  });

  try {
    const res = await fetch('php/update_plan.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: editingPlanId,
        exercises: exercisesData.filter(Boolean)
      })
    });

    const data = await res.json();

    if (data.status === 'success') {
      alert('Plan erfolgreich gespeichert!');
      closeEditModal();
      loadPlans();
      showView('view-plans');
    } else {
      alert('Fehler: ' + data.message);
    }
  } catch (err) {
    alert('Speicherfehler: ' + err.message);
  }
}