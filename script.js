const categories = [
  {
    id: 'belief',
    title: 'Belief Framework',
    priority: 'Highest Priority · Requires Application',
    description:
      'Practices that reset your heart and mind—prayer, meditation, and affirmations that reinforce your core identity.',
  },
  {
    id: 'core',
    title: 'Core Skill',
    priority: 'Second Priority · Requires Application',
    description:
      'Your signature competency or craft. Capture intentional reps that sharpen the skill you enjoy practicing.',
  },
  {
    id: 'permissible',
    title: 'Permissible',
    priority: 'Third Priority · Apply if time permits',
    description:
      'Interests and investments that are helpful but not essential. Track ideas that add spiritual or material value.',
  },
];

const initialState = () =>
  categories.reduce((acc, category) => {
    acc[category.id] = [];
    return acc;
  }, {});

const loadState = () => {
  try {
    const raw = localStorage.getItem('simply-path');
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return { ...initialState(), ...parsed };
  } catch (error) {
    console.error('Failed to load state', error);
    return initialState();
  }
};

const saveState = (state) => {
  localStorage.setItem('simply-path', JSON.stringify(state));
};

const state = loadState();

const categoriesContainer = document.querySelector('#categories');
const taskTemplate = document.querySelector('#task-template');
const subtaskTemplate = document.querySelector('#subtask-template');

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createSubtaskInput = (container) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'subtask-input';
  input.placeholder = 'Supporting action or reminder';
  container.appendChild(input);
  return input;
};

const renderTasks = (categoryId) => {
  const tasks = state[categoryId];
  const list = document.querySelector(`#task-list-${categoryId}`);
  list.innerHTML = '';

  if (!tasks.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No priorities added yet—create one to get started!';
    list.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const taskNode = taskTemplate.content.firstElementChild.cloneNode(true);
    taskNode.dataset.taskId = task.id;
    taskNode.querySelector('h3').textContent = task.title;
    const descriptionEl = taskNode.querySelector('.task__description');
    descriptionEl.textContent = task.description || 'No description provided.';
    descriptionEl.style.display = task.description ? 'block' : 'none';

    const taskToggle = taskNode.querySelector('.task-complete');
    taskToggle.checked = Boolean(task.completed);
    taskNode.classList.toggle('task--complete', Boolean(task.completed));
    taskToggle.addEventListener('change', () => {
      task.completed = taskToggle.checked;
      taskNode.classList.toggle('task--complete', task.completed);
      saveState(state);
    });

    taskNode.querySelector('.delete-task').addEventListener('click', () => {
      const confirmed = window.confirm('Remove this priority?');
      if (!confirmed) return;
      state[categoryId] = state[categoryId].filter((t) => t.id !== task.id);
      saveState(state);
      renderTasks(categoryId);
    });

    const subtaskList = taskNode.querySelector('.subtasks');
    subtaskList.innerHTML = '';

    if (!task.subtasks?.length) {
      const empty = document.createElement('li');
      empty.textContent = 'No subtasks yet.';
      empty.className = 'subtask empty';
      subtaskList.appendChild(empty);
    } else {
      task.subtasks.forEach((subtask) => {
        const subtaskNode = subtaskTemplate.content.firstElementChild.cloneNode(true);
        subtaskNode.dataset.subtaskId = subtask.id;
        const toggle = subtaskNode.querySelector('.subtask-toggle');
        toggle.checked = Boolean(subtask.completed);
        toggle.addEventListener('change', () => {
          subtask.completed = toggle.checked;
          saveState(state);
        });
        subtaskNode.querySelector('span').textContent = subtask.text;
        subtaskList.appendChild(subtaskNode);
      });
    }

    list.appendChild(taskNode);
  });
};

const buildCategory = (category) => {
  const section = document.createElement('section');
  section.className = 'category';
  section.dataset.category = category.id;

  section.innerHTML = `
    <header>
      <h2>${category.title}</h2>
      <p>${category.priority}</p>
      <p>${category.description}</p>
    </header>
    <form data-category="${category.id}">
      <div>
        <label for="title-${category.id}">Priority focus</label>
        <input id="title-${category.id}" name="title" placeholder="Name this priority" required />
      </div>
      <div>
        <label for="description-${category.id}">Description</label>
        <textarea id="description-${category.id}" name="description" placeholder="Describe the intent, rhythm, or why it matters."></textarea>
      </div>
      <div>
        <label>Subtasks</label>
        <div class="subtask-inputs"></div>
        <button type="button" class="add-subtask-btn">+ Add another subtask</button>
      </div>
      <button type="submit" class="btn btn--primary">Add to ${category.title}</button>
    </form>
    <div class="task-list" id="task-list-${category.id}"></div>
  `;

  const subtaskInputsContainer = section.querySelector('.subtask-inputs');
  const addSubtaskBtn = section.querySelector('.add-subtask-btn');
  const ensureSubtaskInput = () => {
    if (!subtaskInputsContainer.querySelector('.subtask-input')) {
      createSubtaskInput(subtaskInputsContainer);
    }
  };

  ensureSubtaskInput();

  addSubtaskBtn.addEventListener('click', () => {
    const newInput = createSubtaskInput(subtaskInputsContainer);
    newInput.focus();
  });

  const form = section.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();

    const subtaskInputs = Array.from(
      form.querySelectorAll('.subtask-input')
    ).map((input) => input.value.trim());

    const subtasks = subtaskInputs
      .filter((text) => text.length)
      .map((text) => ({ id: createId(), text, completed: false }));

    if (!title) {
      form.querySelector('input[name="title"]').focus();
      return;
    }

    const task = {
      id: createId(),
      title,
      description,
      subtasks,
      completed: false,
    };

    state[category.id].unshift(task);
    saveState(state);
    form.reset();
    subtaskInputsContainer.innerHTML = '';
    ensureSubtaskInput();
    renderTasks(category.id);
  });

  categoriesContainer.appendChild(section);
  renderTasks(category.id);
};

categories.forEach(buildCategory);
