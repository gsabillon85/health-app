

// ---- State ----
let activeTab = 'weight';
let currentFoodItems = [];

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initWeight();
  initMeals();
  initExercises();
});

// ---- Tab Navigation ----
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  loadEntries(tab);
}

function loadEntries(tab) {
  if (tab === 'weight') loadWeightEntries();
  else if (tab === 'meals') loadMealEntries();
  else if (tab === 'exercises') loadExerciseEntries();
}

// ---- Utilities ----
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

function groupByDate(entries) {
  const groups = {};
  entries.forEach(e => {
    const d = e.date;
    if (!groups[d]) groups[d] = [];
    groups[d].push(e);
  });
  return groups;
}

function renderEntries(container, entries, renderFn) {
  const groups = groupByDate(entries);
  const dates = Object.keys(groups).sort().reverse();
  if (dates.length === 0) {
    container.innerHTML = '<div class="empty-state">No entries yet</div>';
    return;
  }
  let html = '';
  dates.forEach(date => {
    html += `<div class="date-group-header">${formatDate(date)}</div>`;
    groups[date].forEach(entry => {
      html += renderFn(entry);
    });
  });
  container.innerHTML = html;
}

// ============================================================
// WEIGHT TAB
// ============================================================
function initWeight() {
  document.getElementById('weight-date').value = todayStr();
  document.getElementById('weight-form').addEventListener('submit', saveWeight);
  loadWeightEntries();
}

async function saveWeight(e) {
  e.preventDefault();
  const date = document.getElementById('weight-date').value;
  const weight_kg = parseFloat(document.getElementById('weight-value').value);

  const { error } = await supabaseClient
    .from('weight_entries')
    .upsert({ date, weight_kg }, { onConflict: 'date' });

  if (error) {
    showToast('Error: ' + error.message);
    return;
  }
  showToast('Weight saved!');
  document.getElementById('weight-value').value = '';
  loadWeightEntries();
}

async function loadWeightEntries() {
  const container = document.getElementById('weight-entries');
  const { data, error } = await supabaseClient
    .from('weight_entries')
    .select('*')
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    container.innerHTML = '<div class="empty-state">Error loading data</div>';
    return;
  }

  renderEntries(container, data || [], entry => `
    <div class="entry-card">
      <div class="entry-info">
        <div class="entry-main">${entry.weight_kg} kg</div>
      </div>
      <button class="entry-delete" data-id="${entry.id}" data-type="weight">&times;</button>
    </div>
  `);

  container.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry('weight_entries', btn.dataset.id));
  });
}

// ============================================================
// MEALS TAB
// ============================================================
function initMeals() {
  document.getElementById('meal-date').value = todayStr();
  document.getElementById('add-food-item').addEventListener('click', addFoodItem);
  document.getElementById('meal-form').addEventListener('submit', saveMeal);
  loadMealEntries();
}

function addFoodItem() {
  currentFoodItems.push({ name: '', weight_g: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  renderFoodItems();
}

function renderFoodItems() {
  const container = document.getElementById('food-items-list');
  container.innerHTML = currentFoodItems.map((item, i) => `
    <div class="food-item">
      <div class="food-item-header">
        <input type="text" placeholder="Food name" data-field="name" data-index="${i}" value="${item.name}">
        <button type="button" class="remove-food" data-index="${i}">&times;</button>
      </div>
      <div class="food-item-grid">
        <div>
          <label>g</label>
          <input type="number" data-field="weight_g" data-index="${i}" value="${item.weight_g || ''}" placeholder="0">
        </div>
        <div>
          <label>kcal</label>
          <input type="number" data-field="calories" data-index="${i}" value="${item.calories || ''}" placeholder="0">
        </div>
        <div>
          <label>Protein</label>
          <input type="number" data-field="protein_g" data-index="${i}" value="${item.protein_g || ''}" placeholder="0">
        </div>
        <div>
          <label>Carbs</label>
          <input type="number" data-field="carbs_g" data-index="${i}" value="${item.carbs_g || ''}" placeholder="0">
        </div>
      </div>
      <div class="food-item-grid" style="margin-top:6px;">
        <div>
          <label>Fat</label>
          <input type="number" data-field="fat_g" data-index="${i}" value="${item.fat_g || ''}" placeholder="0">
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      const field = e.target.dataset.field;
      if (field === 'name') {
        currentFoodItems[idx][field] = e.target.value;
      } else {
        currentFoodItems[idx][field] = parseFloat(e.target.value) || 0;
      }
      updateMealTotals();
    });
  });

  container.querySelectorAll('.remove-food').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFoodItems.splice(parseInt(btn.dataset.index), 1);
      renderFoodItems();
      updateMealTotals();
    });
  });
}

function updateMealTotals() {
  const totalsEl = document.getElementById('meal-totals');
  if (currentFoodItems.length === 0) {
    totalsEl.classList.add('hidden');
    return;
  }
  totalsEl.classList.remove('hidden');
  const t = currentFoodItems.reduce((acc, item) => ({
    weight: acc.weight + (item.weight_g || 0),
    cal: acc.cal + (item.calories || 0),
    protein: acc.protein + (item.protein_g || 0),
    carbs: acc.carbs + (item.carbs_g || 0),
    fat: acc.fat + (item.fat_g || 0),
  }), { weight: 0, cal: 0, protein: 0, carbs: 0, fat: 0 });

  document.getElementById('total-weight').textContent = t.weight + 'g';
  document.getElementById('total-cal').textContent = t.cal;
  document.getElementById('total-protein').textContent = t.protein;
  document.getElementById('total-carbs').textContent = t.carbs;
  document.getElementById('total-fat').textContent = t.fat;
}

async function saveMeal(e) {
  e.preventDefault();
  const date = document.getElementById('meal-date').value;
  const name = document.getElementById('meal-name').value.trim();
  const meal_type = document.getElementById('meal-type').value;

  if (currentFoodItems.length === 0) {
    showToast('Add at least one food item');
    return;
  }

  const totals = currentFoodItems.reduce((acc, item) => ({
    weight: acc.weight + (item.weight_g || 0),
    cal: acc.cal + (item.calories || 0),
    protein: acc.protein + (item.protein_g || 0),
    carbs: acc.carbs + (item.carbs_g || 0),
    fat: acc.fat + (item.fat_g || 0),
  }), { weight: 0, cal: 0, protein: 0, carbs: 0, fat: 0 });

  const { error } = await supabaseClient.from('meal_entries').insert({
    date,
    name,
    meal_type,
    food_items: currentFoodItems,
    total_weight_g: totals.weight,
    total_calories: totals.cal,
    total_protein_g: totals.protein,
    total_carbs_g: totals.carbs,
    total_fat_g: totals.fat,
  });

  if (error) {
    showToast('Error: ' + error.message);
    return;
  }
  showToast('Meal saved!');
  currentFoodItems = [];
  renderFoodItems();
  document.getElementById('meal-name').value = '';
  document.getElementById('meal-totals').classList.add('hidden');
  loadMealEntries();
}

async function loadMealEntries() {
  const container = document.getElementById('meal-entries');
  const { data, error } = await supabaseClient
    .from('meal_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    container.innerHTML = '<div class="empty-state">Error loading data</div>';
    return;
  }

  renderEntries(container, data || [], entry => `
    <div class="entry-card">
      <div class="entry-info">
        <div class="entry-main">${entry.meal_type === 'snack' ? '' : ''} ${entry.name}</div>
        <div class="entry-detail">
          ${Math.round(entry.total_calories)} kcal &middot;
          P: ${Math.round(entry.total_protein_g)}g &middot;
          C: ${Math.round(entry.total_carbs_g)}g &middot;
          F: ${Math.round(entry.total_fat_g)}g
        </div>
      </div>
      <button class="entry-delete" data-id="${entry.id}" data-type="meal">&times;</button>
    </div>
  `);

  container.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry('meal_entries', btn.dataset.id));
  });
}

// ============================================================
// EXERCISES TAB
// ============================================================
function initExercises() {
  document.getElementById('exercise-date').value = todayStr();
  document.getElementById('exercise-form').addEventListener('submit', saveExercise);
  loadExerciseEntries();
}

async function saveExercise(e) {
  e.preventDefault();
  const date = document.getElementById('exercise-date').value;
  const exercise_name = document.getElementById('exercise-name').value.trim();
  const sets = parseInt(document.getElementById('exercise-sets').value) || 1;
  const reps = parseInt(document.getElementById('exercise-reps').value) || 1;
  const weight_kg = parseFloat(document.getElementById('exercise-weight').value) || 0;
  const duration_min = parseInt(document.getElementById('exercise-duration').value) || 0;
  const notes = document.getElementById('exercise-notes').value.trim();

  const { error } = await supabaseClient.from('exercise_entries').insert({
    date,
    exercise_name,
    sets,
    reps,
    weight_kg,
    duration_min,
    notes,
  });

  if (error) {
    showToast('Error: ' + error.message);
    return;
  }
  showToast('Exercise saved!');
  document.getElementById('exercise-name').value = '';
  document.getElementById('exercise-notes').value = '';
  document.getElementById('exercise-weight').value = '0';
  document.getElementById('exercise-duration').value = '0';
  loadExerciseEntries();
}

async function loadExerciseEntries() {
  const container = document.getElementById('exercise-entries');
  const { data, error } = await supabaseClient
    .from('exercise_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    container.innerHTML = '<div class="empty-state">Error loading data</div>';
    return;
  }

  renderEntries(container, data || [], entry => {
    const detail = [];
    if (entry.sets > 1 || entry.reps > 1) detail.push(`${entry.sets}x${entry.reps}`);
    if (entry.weight_kg > 0) detail.push(`${entry.weight_kg} kg`);
    if (entry.duration_min > 0) detail.push(`${entry.duration_min} min`);
    if (entry.notes) detail.push(entry.notes);
    return `
      <div class="entry-card">
        <div class="entry-info">
          <div class="entry-main">${entry.exercise_name}</div>
          <div class="entry-detail">${detail.join(' &middot; ')}</div>
        </div>
        <button class="entry-delete" data-id="${entry.id}" data-type="exercise">&times;</button>
      </div>
    `;
  });

  container.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry('exercise_entries', btn.dataset.id));
  });
}

// ============================================================
// DELETE
// ============================================================
async function deleteEntry(table, id) {
  if (!confirm('Delete this entry?')) return;
  const { error } = await supabaseClient.from(table).delete().eq('id', id);
  if (error) {
    showToast('Error deleting');
    return;
  }
  showToast('Deleted');
  loadEntries(activeTab);
}
