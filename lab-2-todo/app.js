'use strict';

const STORAGE_KEY = 'todo-list-v1';
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
document.title = 'Список задач';
const charset = el('meta');
charset.setAttribute('charset', 'UTF-8');
const viewport = el('meta');
viewport.name = 'viewport';
viewport.content = 'width=device-width, initial-scale=1';
const stylesheet = el('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = 'styles.css';
document.head.append(charset, viewport, stylesheet);

let tasks = [];
let editingId = null;
let draggedId = null;
let storageWarning = '';
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === Number(value.slice(0, 4)) && parsed.getMonth() + 1 === Number(value.slice(5, 7)) && parsed.getDate() === Number(value.slice(8, 10));
};
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!Array.isArray(saved)) throw new Error('Invalid data');
  const ids = new Set();
  tasks = saved.filter(task => {
    if (!task || typeof task.id !== 'string' || ids.has(task.id) || typeof task.title !== 'string' || !task.title.trim() || !validDate(task.date) || typeof task.completed !== 'boolean') return false;
    ids.add(task.id);
    return true;
  });
} catch {
  storageWarning = 'Не удалось прочитать сохранённые задачи. Можно начать новый список.';
}

const main = el('main', 'app');
const header = el('header', 'header');
header.append(el('h1', '', 'Список задач'));
const summary = el('p', 'summary');
header.append(summary);
const panel = el('section', 'panel');
panel.setAttribute('aria-label', 'Управление задачами');

function field(labelText, type, name) {
  const label = el('label', 'field');
  const input = el('input');
  input.type = type;
  input.name = name;
  label.append(el('span', 'label', labelText), input);
  return { label, input };
}
function button(text, className = 'button', type = 'button') {
  const node = el('button', className, text);
  node.type = type;
  return node;
}
function selectField(labelText, options) {
  const label = el('label', 'field');
  const select = el('select');
  options.forEach(([value, text]) => {
    const option = el('option', '', text);
    option.value = value;
    select.append(option);
  });
  label.append(el('span', 'label', labelText), select);
  return { label, input: select };
}
const form = el('form', 'add-form');
const title = field('Новая задача', 'text', 'title');
title.input.placeholder = 'Что нужно сделать?';
title.input.required = true;
title.input.maxLength = 200;
const date = field('Срок', 'date', 'date');
date.input.required = true;
const now = new Date();
date.input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
form.append(title.label, date.label, button('Добавить', 'button primary', 'submit'));
const toolbar = el('div', 'toolbar');
const search = field('Поиск', 'search', 'search');
search.input.placeholder = 'Название задачи';
const status = selectField('Показать', [['all', 'Все задачи'], ['active', 'Активные'], ['done', 'Выполненные']]);
const sort = selectField('Порядок', [['manual', 'Свой порядок'], ['asc', 'Сначала ближайшие'], ['desc', 'Сначала поздние']]);
const dateFilter = field('Дата задачи', 'date', 'date-filter');
const reset = button('Сбросить', 'button subtle');
toolbar.append(search.label, status.label, sort.label, dateFilter.label, reset);
const hint = el('p', 'hint');
panel.append(form, toolbar, hint);
const listSection = el('section', 'tasks-section');
const listHeading = el('h2', '', 'Ваши задачи');
const visibleCount = el('span', 'count');
const listHeader = el('div', 'list-header');
listHeader.append(listHeading, visibleCount);
const list = el('ul', 'task-list');
const empty = el('p', 'empty');
listSection.append(listHeader, list, empty);
const notice = el('p', 'notice');
notice.setAttribute('role', 'status');
notice.setAttribute('aria-live', 'polite');
notice.textContent = storageWarning;
const footer = el('footer', 'footer', 'Ваш список сохраняется в этом браузере автоматически.');
main.append(header, panel, listSection, notice, footer);
document.body.append(main);

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    notice.textContent = '';
  } catch {
    notice.textContent = 'Изменения действуют до закрытия страницы: браузер не разрешил сохранение.';
  }
}
function manualAllowed() {
  return sort.input.value === 'manual' && status.input.value === 'all' && !search.input.value.trim() && !dateFilter.input.value;
}
function commit() { save(); render(); }
function move(id, offset) {
  const index = tasks.findIndex(task => task.id === id);
  const target = index + offset;
  if (!manualAllowed() || index < 0 || target < 0 || target >= tasks.length) return;
  [tasks[index], tasks[target]] = [tasks[target], tasks[index]];
  commit();
  list.querySelector(`[data-id="${id}"] .move-${offset < 0 ? 'up' : 'down'}`)?.focus();
}
function render() {
  const query = search.input.value.trim().toLocaleLowerCase('ru');
  const visible = tasks.filter(task => (!query || task.title.toLocaleLowerCase('ru').includes(query)) && (status.input.value === 'all' || task.completed === (status.input.value === 'done')) && (!dateFilter.input.value || task.date === dateFilter.input.value));
  if (sort.input.value !== 'manual') visible.sort((a, b) => sort.input.value === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  list.replaceChildren();
  const done = tasks.filter(task => task.completed).length;
  summary.textContent = `Всего: ${tasks.length} · Активных: ${tasks.length - done} · Выполнено: ${done}`;
  visibleCount.textContent = String(visible.length);
  hint.textContent = manualAllowed() ? 'Перетаскивайте задачи за ⋮⋮ или меняйте порядок стрелками.' : 'Для изменения порядка выберите «Свой порядок» и сбросьте поиск и фильтры.';
  empty.hidden = visible.length > 0;
  empty.textContent = tasks.length ? 'Задачи не найдены.' : 'Задач пока нет.';
  visible.forEach(task => {
    const row = el('li', `task${task.completed ? ' completed' : ''}`);
    row.dataset.id = task.id;
    if (editingId === task.id) {
      const editForm = el('form', 'edit-form');
      const editTitle = field('Название', 'text', 'edit-title');
      editTitle.input.value = task.title;
      editTitle.input.required = true;
      editTitle.input.maxLength = 200;
      const editDate = field('Срок', 'date', 'edit-date');
      editDate.input.value = task.date;
      editDate.input.required = true;
      const cancel = button('Отмена', 'button subtle');
      cancel.addEventListener('click', () => { editingId = null; render(); });
      editForm.append(editTitle.label, editDate.label, button('Сохранить', 'button primary', 'submit'), cancel);
      editTitle.input.addEventListener('input', () => editTitle.input.setCustomValidity(''));
      editForm.addEventListener('submit', event => {
        event.preventDefault();
        if (!editTitle.input.value.trim()) { editTitle.input.setCustomValidity('Введите название задачи'); editTitle.input.reportValidity(); return; }
        if (!validDate(editDate.input.value)) return;
        task.title = editTitle.input.value.trim(); task.date = editDate.input.value;
        editingId = null; commit();
      });
      editForm.addEventListener('keydown', event => { if (event.key === 'Escape') { editingId = null; render(); } });
      row.append(editForm);
    } else {
      const handle = el('span', 'drag-handle', '⋮⋮');
      handle.title = 'Перетащить задачу';
      handle.draggable = manualAllowed();
      handle.setAttribute('aria-hidden', 'true');
      handle.addEventListener('dragstart', event => {
        draggedId = task.id;
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
        row.classList.add('dragging');
      });
      handle.addEventListener('dragend', () => { draggedId = null; list.querySelectorAll('.dragging, .drop-target').forEach(node => node.classList.remove('dragging', 'drop-target')); });
      const checkbox = el('input', 'checkbox');
      checkbox.type = 'checkbox'; checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `Выполнено: ${task.title}`);
      checkbox.addEventListener('change', () => { task.completed = checkbox.checked; commit(); });
      const content = el('div', 'task-content');
      const taskTitle = el('p', 'task-title', task.title);
      const time = el('time', 'task-date');
      time.dateTime = task.date;
      time.textContent = new Date(`${task.date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      content.append(taskTitle, time);
      const actions = el('div', 'actions');
      [['↑', -1, 'up'], ['↓', 1, 'down']].forEach(([text, offset, direction]) => {
        const control = button(text, `button icon move-${direction}`);
        control.setAttribute('aria-label', `${offset < 0 ? 'Выше' : 'Ниже'}: ${task.title}`);
        const index = tasks.indexOf(task);
        control.disabled = !manualAllowed() || (offset < 0 ? index === 0 : index === tasks.length - 1);
        control.addEventListener('click', () => move(task.id, offset)); actions.append(control);
      });
      const edit = button('Изменить', 'button subtle');
      edit.addEventListener('click', () => { editingId = task.id; render(); list.querySelector('[name="edit-title"]')?.focus(); });
      const remove = button('Удалить', 'button danger');
      remove.setAttribute('aria-label', `Удалить: ${task.title}`);
      remove.addEventListener('click', () => { tasks = tasks.filter(item => item.id !== task.id); commit(); });
      actions.append(edit, remove);
      row.append(handle, checkbox, content, actions);
    }
    row.addEventListener('dragover', event => { if (manualAllowed() && draggedId && draggedId !== task.id) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; row.classList.add('drop-target'); } });
    row.addEventListener('dragleave', event => { if (!row.contains(event.relatedTarget)) row.classList.remove('drop-target'); });
    row.addEventListener('drop', event => {
      event.preventDefault();
      if (!manualAllowed() || !draggedId || draggedId === task.id) return;
      const source = tasks.findIndex(item => item.id === draggedId);
      if (source < 0) return;
      const after = event.clientY > row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      const [moved] = tasks.splice(source, 1);
      const destination = tasks.findIndex(item => item.id === task.id);
      tasks.splice(destination + (after ? 1 : 0), 0, moved);
      draggedId = null; commit();
    });
    list.append(row);
  });
}
title.input.addEventListener('input', () => title.input.setCustomValidity(''));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!title.input.value.trim()) { title.input.setCustomValidity('Введите название задачи'); title.input.reportValidity(); return; }
  if (!validDate(date.input.value)) return;
  tasks.push({ id: crypto.randomUUID(), title: title.input.value.trim(), date: date.input.value, completed: false });
  title.input.value = ''; commit(); title.input.focus();
});
[search, status, sort, dateFilter].forEach(control => control.input.addEventListener('input', () => { editingId = null; render(); }));
reset.addEventListener('click', () => { search.input.value = ''; status.input.value = 'all'; sort.input.value = 'manual'; dateFilter.input.value = ''; editingId = null; render(); });
render();
