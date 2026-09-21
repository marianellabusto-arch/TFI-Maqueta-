'use strict';

/*
  Sistema de Gestión Veterinaria.
  Prototipo local con HTML, CSS y JavaScript.
  Las cuentas, códigos y permisos son simulados.
  Abrir index.html junto a styles.css y app.js.
*/

const DEMO_ACCOUNTS = [
  {
    id: 'u-admin',
    name: 'Administrador demo',
    email: 'admin@veterinaria.com',
    password: '123456',
    role: 'admin',
    active: true
  },
  {
    id: 'u-v1',
    name: 'Lucía Martínez',
    email: 'doctor@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v1',
    active: true
  },
  {
    id: 'u-v2',
    name: 'Diego García',
    email: 'garcia@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v2',
    active: true
  },
  {
    id: 'u-v3',
    name: 'Ana López',
    email: 'lopez@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v3',
    active: true
  },
  {
    id: 'u-v4',
    name: 'Pablo Rodríguez',
    email: 'rodriguez@veterinaria.com',
    password: '123456',
    role: 'vet',
    vetId: 'v4',
    active: true
  },
  {
    id: 'u-o1',
    name: 'Benjamín Herrera',
    email: 'cliente@correo.com',
    password: '123456',
    role: 'owner',
    ownerId: 'o1',
    active: true
  }
];

const KEY = 'veterinaria-prototipo-v1';
const CODE = '123456';
const THEME_KEY = KEY + '-theme';

function currentTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Sin almacenamiento: se mantiene solo en la sesión.
  }

  const fab = document.querySelector('.theme-fab');

  if (fab) {
    fab.textContent = theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
  }
}

function toggleTheme() {
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

function ensureThemeFab() {
  if (!document.querySelector('.theme-fab')) {
    const fab = document.createElement('button');

    fab.type = 'button';
    fab.className = 'theme-fab';
    fab.dataset.action = 'theme';
    document.body.appendChild(fab);
  }

  applyTheme(currentTheme());
}

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const esc = value => String(value ?? '').replace(
  /[&<>"']/g,
  character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character])
);

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

const dayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

const localDate = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const today = () => localDate(new Date());

const addDays = (dateString, amount) => {
  const date = new Date(dateString + 'T12:00:00');
  date.setDate(date.getDate() + amount);
  return localDate(date);
};

const pretty = date => date
  ? new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  : '—';

const minutes = time =>
  Number(time.split(':')[0]) * 60 + Number(time.split(':')[1]);

const clock = value =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

const money = value =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });

const roleNames = {
  admin: 'Administrador',
  vet: 'Veterinario',
  owner: 'Propietario'
};

const navs = {
  home: ['Inicio', 'home'],
  pets: ['Mascotas', 'pet'],
  owners: ['Propietarios', 'users'],
  vets: ['Veterinarios', 'medical'],
  agenda: ['Agenda', 'calendar'],
  income: ['Ingresos', 'receipt'],
  schedules: ['Horarios', 'clock'],
  services: ['Servicios', 'medical'],
  products: ['Catálogo', 'bag'],
  tickets: ['Mis tickets', 'receipt'],
  notices: ['Avisos', 'megaphone'],
  notifications: ['Notificaciones', 'bell'],
  reminders: ['Recordatorios', 'clock'],
  users: ['Usuarios', 'users'],
  settings: ['Configuración', 'settings']
};

const allowed = {
  admin: Object.keys(navs),
  vet: [
    'home',
    'pets',
    'owners',
    'agenda',
    'tickets',
    'services',
    'notifications',
    'reminders'
  ],
  owner: [
    'pets',
    'agenda',
    'products',
    'notices',
    'notifications',
    'reminders',
    'ownerProfile'
  ]
};

let db;
let user = null;
let route = 'home';
let selectedPet = null;
let petTab = 'Resumen';
let page = 1;
let query = '';
let filter = '';
let agendaDate = today();
let agendaMode = 'day';
let agendaVet = '';
let draft = {};
let authStep = 0;
let recovery = null;
let toastTimer;
let billingPeriod = 'month';
let billingFrom = today();
let billingTo = today();
let incomeDay = '';
let ticketItemCount = 0;

const paths = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
  pet: 'M8 13c-2 1-5 6-1 7 2 1 3-1 5-1s3 2 5 1c4-1 1-6-1-7-2-2-6-2-8 0M5 7v2M10 4v3M15 4v3M20 7v2',
  users: 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 3a4 4 0 0 1 0 8M22 21v-3a4 4 0 0 0-3-4',
  medical: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  calendar: 'M4 5h16v16H4zM7 3v4M17 3v4M4 10h16M8 14h2M14 14h2M8 18h2',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2',
  bag: 'M4 7h16l1 14H3zM8 7V5a4 4 0 0 1 8 0v2',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  megaphone: 'M3 9h5l12-5v16L8 15H3zM7 15l2 6h3l-2-5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  logout: 'M9 3H3v18h6M8 12h13M17 8l4 4-4 4',
  plus: 'M12 4v16M4 12h16',
  search: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14M15 15l6 6',
  qr: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  receipt: 'M5 3h14v18l-2.5-1.5L14 21l-2-1.2L10 21l-2.5-1.5zM8.5 8h7M8.5 12h7'
};

// COMPONENTES Y UTILIDADES

function icon(name) {
  return `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${paths[name] || paths.medical}"/>
    </svg>
  `;
}

function button(text, actionName, id = '', className = '') {
  return `
    <button
      type="button"
      class="${className}"
      data-action="${actionName}"
      data-id="${esc(id)}"
    >${text}</button>
  `;
}

function field(name, text, value = '', type = 'text', extra = '') {
  return `
    <label class="field">
      ${text}
      <input
        name="${name}"
        type="${type}"
        value="${esc(value)}"
        ${extra}
      >
    </label>
  `;
}

function select(name, text, items, value = '', extra = '') {
  return `
    <label class="field">
      ${text}
      <select name="${name}" ${extra}>
        ${items.map(item => {
          const option = Array.isArray(item) ? item : [item, item];

          return `
            <option
              value="${esc(option[0])}"
              ${String(option[0]) === String(value) ? 'selected' : ''}
            >${esc(option[1])}</option>
          `;
        }).join('')}
      </select>
    </label>
  `;
}

function area(name, text, value = '') {
  return `
    <label class="field full">
      ${text}
      <textarea name="${name}">${esc(value)}</textarea>
    </label>
  `;
}

function checks(name, text, items, values = []) {
  return `
    <div class="field full">
      ${text}
      <div class="checklist">
        ${items.map(([value, labelText]) => `
          <label>
            <input
              type="checkbox"
              name="${name}"
              value="${esc(value)}"
              ${values.map(String).includes(String(value)) ? 'checked' : ''}
            >
            ${esc(labelText)}
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function activeOptions(collection) {
  return db[collection]
    .filter(item => item.active)
    .map(item => [item.id, item.name]);
}

function find(collection, id) {
  return db[collection].find(item => item.id === id);
}

function label(collection, id) {
  return find(collection, id)?.name || 'Registro no disponible';
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  } catch (error) {
    toast(
      'No se pudo guardar. Revisá el espacio disponible o los permisos del navegador.'
    );
    return false;
  }
}

function commit(callback) {
  const before = JSON.stringify(db);
  callback();

  if (persist()) return true;

  db = JSON.parse(before);
  return false;
}

function load() {
  try {
    db = JSON.parse(localStorage.getItem(KEY)) || { configured: false };
  } catch {
    db = { configured: false };
  }

  if (db.configured) {
    db.tickets ||= [];
    db.config ||= {};
    db.config.ticketSeq ||= 0;

    if (Array.isArray(db.services)) {
      db.services.forEach(service => {
        if (typeof service.price !== 'number' || Number.isNaN(service.price)) {
          service.price = 0;
        }
      });
    }
  }
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    () => $('#toast').classList.remove('show'),
    4200
  );
}

function modal(title, html) {
  $('#modal').innerHTML = `
    <div class="modal-head">
      <h2 id="modal-title">${title}</h2>
      ${button('✕', 'close', '', 'ghost')}
    </div>
    ${html}
  `;

  if (!$('#modal').open) {
    $('#modal').showModal();
  }
}

function close() {
  $('#modal').close();
}

function fail(message) {
  const errorElement = $('#form-error');

  if (errorElement) {
    errorElement.textContent = message;
  } else {
    toast(message);
  }

  return false;
}

function formWrap(kind, content, id = '') {
  return `
    <form data-form="${kind}" data-id="${esc(id)}">
      <div class="form-grid">${content}</div>
      <div id="form-error" class="error" role="alert"></div>
      <div class="form-actions">
        ${button('Cancelar', 'close')}
        <button class="primary" type="submit">Guardar</button>
      </div>
    </form>
  `;
}

// DATOS DE DEMOSTRACIÓN

function seed(config, admin) {
  const vets = [
    'Lucía Martínez',
    'Diego García',
    'Ana López',
    'Pablo Rodríguez'
  ].map((name, index) => ({
    id: 'v' + (index + 1),
    name,
    license: 'MP ' + (410 + index),
    specialty: [
      'Diagnóstico por imágenes',
      'Clínica general',
      'Medicina felina',
      'Cirugía'
    ][index],
    serviceIds: index === 0
      ? ['s1', 's2', 's3', 's4', 's5']
      : ['s1', 's3', 's4', 's5'],
    active: true
  }));

  const owners = [
    {
      id: 'o1',
      name: 'Benjamín Herrera',
      dni: '30111222',
      phone: '3815550101',
      email: 'cliente@correo.com',
      address: 'Los Aromos 240',
      active: true
    },
    {
      id: 'o2',
      name: 'Valentina Ruiz',
      dni: '32222333',
      phone: '3815550102',
      email: 'valentina@correo.com',
      address: 'San Martín 812',
      active: true
    },
    {
      id: 'o3',
      name: 'Juan Pérez',
      dni: '29333444',
      phone: '3815550103',
      email: 'juan@correo.com',
      address: 'Belgrano 154',
      active: true
    }
  ];

  const pets = [
    'Lola',
    'Toby',
    'Michi',
    'Max',
    'Luna',
    'Bruno'
  ].map((name, index) => ({
    id: 'p' + (index + 1),
    name,
    species: index === 2 || index === 4 ? 'Gato' : 'Perro',
    breed: [
      'Caniche',
      'Mestizo',
      'Europeo',
      'Labrador',
      'Siamés',
      'Golden'
    ][index],
    sex: index % 2 ? 'Macho' : 'Hembra',
    birth: '2022-04-10',
    weight: [3.9, 12, 4.2, 24, 3.6, 28][index],
    color: 'Marrón y blanco',
    ownerId: index < 3 ? 'o1' : index < 5 ? 'o2' : 'o3',
    observations: 'Paciente de demostración',
    photo: '',
    qr: uid(),
    active: true
  }));

  const services = [
    'Consulta clínica',
    'Ecografía',
    'Vacunación',
    'Control',
    'Desparasitación'
  ].map((name, index) => ({
    id: 's' + (index + 1),
    name,
    duration: 30,
    description: 'Atención con turno previo.',
    price: [15000, 28000, 12000, 9000, 8000][index],
    active: true
  }));

  const schedules = [
    {
      id: uid(),
      vetId: 'v1',
      serviceId: 's2',
      day: 3,
      start: '09:00',
      end: '13:00',
      duration: 30,
      active: true
    }
  ];

  vets.forEach(vet => {
    [1, 2, 3, 4, 5, 6].forEach(day => {
      ['s1', 's3', 's4', 's5'].forEach(serviceId => {
        schedules.push({
          id: uid(),
          vetId: vet.id,
          serviceId,
          day,
          start: '09:00',
          end: '17:00',
          duration: 30,
          active: true
        });
      });
    });
  });

  let wednesday = today();

  while (
    new Date(wednesday + 'T12:00:00').getDay() !== 3
  ) {
    wednesday = addDays(wednesday, 1);
  }

  const appointments = [
    {
      id: uid(),
      petId: 'p1',
      ownerId: 'o1',
      serviceId: 's2',
      vetId: 'v1',
      date: wednesday,
      time: '09:30',
      duration: 30,
      status: 'Confirmado',
      reason: 'Control por imágenes',
      observations: ''
    },
    {
      id: uid(),
      petId: 'p2',
      ownerId: 'o1',
      serviceId: 's2',
      vetId: 'v1',
      date: wednesday,
      time: '11:00',
      duration: 30,
      status: 'Confirmado',
      reason: 'Estudio abdominal',
      observations: ''
    }
  ];

  if (config.days.map(Number).includes(new Date().getDay())) {
    ['09:00', '10:30', '12:00'].forEach((time, index) => {
      appointments.push({
        id: uid(),
        petId: 'p' + (index + 4),
        ownerId: index === 2 ? 'o3' : 'o2',
        serviceId: 's1',
        vetId: 'v2',
        date: today(),
        time,
        duration: 30,
        status: index === 0 ? 'Atendido' : 'Confirmado',
        reason: 'Consulta general',
        observations: ''
      });
    });
  }

  appointments.push(...demoPastAppointments());

  const demoTickets = buildDemoTickets();

  config.ticketSeq = demoTickets.length;

  return {
    configured: true,
    config,

    users: [
      {
        ...admin,
        id: uid(),
        role: 'admin',
        active: true,
        principal: true
      },
      ...DEMO_ACCOUNTS
        .filter(account =>
          account.email.toLowerCase() !== admin.email.toLowerCase()
        )
        .map(account => ({ ...account }))
    ],

    vets,
    owners,
    pets,
    services,
    schedules,
    appointments,
    tickets: demoTickets,

    clinical: pets.map(pet => ({
      id: uid(),
      petId: pet.id,
      date: addDays(today(), -12),
      type: 'Consulta',
      title: 'Control general',
      info: 'Control clínico de rutina. Paciente activo, sin novedades.',
      diagnosis: 'Control preventivo',
      weight: pet.weight,
      vetId: 'v1',
      authorId: 'u-v1',
      authorName: 'Lucía Martínez',
      visible: true
    })),

    products: [
      {
        id: 'pr1',
        name: 'Alimento adulto balanceado',
        category: 'Nutrición',
        description: 'Bolsa de 3 kg. Consultá la variedad indicada para tu mascota.',
        price: 18500,
        stock: 14,
        active: true,
        photo: ''
      },
      {
        id: 'pr2',
        name: 'Pipeta para perros',
        category: 'Cuidado',
        description: 'Presentación según peso. Consultá al profesional.',
        price: 7200,
        stock: 8,
        active: true,
        photo: ''
      },
      {
        id: 'pr3',
        name: 'Transportadora mediana',
        category: 'Accesorios',
        description: 'Base rígida y ventilación lateral.',
        price: 45000,
        stock: 3,
        active: true,
        photo: ''
      }
    ],

    notices: [
      {
        id: uid(),
        title: 'Bienvenidos a nuestro espacio de cuidado',
        message: 'Ya podés consultar la información de tus mascotas y solicitar turnos desde tu cuenta.',
        date: today(),
        expires: '',
        active: true
      }
    ],

    notifications: [
      {
        id: uid(),
        message: 'Tu turno de ecografía fue confirmado.',
        ownerId: 'o1',
        vetId: 'v1',
        date: new Date().toISOString(),
        readBy: []
      }
    ],

    reminders: [
      {
        id: uid(),
        petId: 'p1',
        title: 'Control anual de Lola',
        date: addDays(today(), 7),
        done: false
      },
      {
        id: uid(),
        petId: 'p3',
        title: 'Próxima desparasitación de Michi',
        date: addDays(today(), 12),
        done: false
      }
    ]
  };
}

// CONFIGURACIÓN INICIAL Y AUTENTICACIÓN

function branding() {
  return `
    <div class="brand">
      ${
        db.config?.logo
          ? `<img class="logo" src="${esc(db.config.logo)}" alt="Logo">`
          : '<span class="mark">+</span>'
      }
      <span>${esc(db.config?.name || 'Gestión veterinaria')}</span>
    </div>
  `;
}

function clinicFields(config = {}) {
  return (
    field(
      'name',
      'Nombre de la veterinaria',
      config.name || '',
      'text',
      'required'
    ) +
    field(
      'identifier',
      'DNI / CUIT del responsable',
      config.identifier || '',
      'text',
      'required'
    ) +
    field(
      'address',
      'Dirección',
      config.address || '',
      'text',
      'required'
    ) +
    field(
      'phone',
      'Teléfono',
      config.phone || '',
      'tel',
      'required'
    ) +
    field(
      'email',
      'Correo electrónico',
      config.email || '',
      'email',
      'required'
    ) +
    field(
      'logo',
      'Logo (PNG, JPG o WebP; hasta 1 MB)',
      '',
      'file',
      'accept="image/png,image/jpeg,image/webp"'
    ) +
    checks(
      'days',
      'Días de atención',
      dayNames.map((day, index) => [index, day]),
      config.days || [1, 2, 3, 4, 5, 6]
    ) +
    field(
      'start',
      'Apertura',
      config.start || '08:00',
      'time',
      'required'
    ) +
    field(
      'end',
      'Cierre',
      config.end || '20:00',
      'time',
      'required'
    ) +
    field(
      'duration',
      'Duración predeterminada (minutos)',
      config.duration || 30,
      'number',
      'min="5" max="240" required'
    )
  );
}

function authShell(html) {
  $('#app').innerHTML = `
    <main class="auth">
      <aside class="auth-art">
        ${branding()}

        <section>
          <div class="orbit"><span>+</span></div>
          <div class="eyebrow">Un espacio para cuidar</div>
          <h1>Más cerca de cada paciente.</h1>
          <p>
            La atención, los equipos y la información de tu veterinaria,
            conectados en un solo lugar.
          </p>
        </section>

        <footer>
          Sistema de Gestión Veterinaria · Prototipo académico
        </footer>
      </aside>

      <section class="auth-main">
        <div class="auth-box">${html}</div>
      </section>
    </main>
  `;
}

function setup() {
  const titles = [
    'Configuración inicial',
    'Verificá tu veterinaria',
    'Crear administrador principal',
    'Verificá tu cuenta',
    'Todo listo para comenzar'
  ];

  let html = `
    <div class="steps">
      ${[0, 1, 2, 3].map(index => `
        <span class="${authStep >= index ? 'done' : ''}"></span>
      `).join('')}
    </div>

    <div class="eyebrow">
      Puesta en marcha · Paso ${Math.min(authStep + 1, 4)} de 4
    </div>

    <h1>${titles[authStep]}</h1>
  `;

  if (authStep === 0) {
    html += `
      <p>Configurá los datos de tu veterinaria para comenzar.</p>
      ${formWrap('setup', clinicFields(draft.config))}
    `;
  }

  if (authStep === 1 || authStep === 3) {
    html += `
      <p>
        Ingresá el código para
        ${esc(authStep === 1 ? draft.config.email : draft.admin.email)}.
      </p>

      <div class="hint">
        Verificación simulada. No se envían mensajes.
        Código de prueba: <b>${CODE}</b>.
      </div>

      ${formWrap(
        'verify',
        field(
          'code',
          'Código de verificación',
          '',
          'text',
          'required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code"'
        )
      )}

      ${button('Reenviar código', 'resend')}
    `;
  }

  if (authStep === 2) {
    html += `
      <p>Esta cuenta tendrá acceso completo a la gestión.</p>

      ${formWrap(
        'admin',
        field('first', 'Nombre', '', 'text', 'required') +
        field('last', 'Apellido', '', 'text', 'required') +
        field('email', 'Usuario / correo', '', 'text', 'required') +
        field(
          'password',
          'Contraseña de prueba',
          '',
          'password',
          'minlength="6" required'
        ) +
        field(
          'confirm',
          'Confirmar contraseña',
          '',
          'password',
          'minlength="6" required'
        )
      )}
    `;
  }

  if (authStep === 4) {
    html += `
      <p>Configuración completada correctamente.</p>
      ${button('Ir al inicio de sesión', 'login', '', 'primary')}
    `;
  }

  authShell(html);
  $$('[data-action="close"]').forEach(element => element.remove());
}

function login() {
  recovery = null;

  let remembered = '';

  try {
    remembered = localStorage.getItem(KEY + '-email') || '';
  } catch {
    remembered = '';
  }

  authShell(`
    <div class="eyebrow">
      Bienvenido a ${esc(db.config.name)}
    </div>

    <h1>Iniciá sesión</h1>
    <p>Ingresá a tu espacio de gestión y cuidado.</p>

    <form data-form="login">
      ${field(
        'email',
        'Usuario / correo',
        remembered,
        'text',
        'required autocomplete="username"'
      )}

      <br>

      ${field(
        'password',
        'Contraseña',
        '',
        'password',
        'required autocomplete="current-password"'
      )}

      <div class="row between">
        <label>
          <input
            name="remember"
            type="checkbox"
            ${remembered ? 'checked' : ''}
          >
          Recordarme
        </label>

        ${button(
          'Mostrar contraseña',
          'show-password',
          '',
          'ghost small'
        )}
      </div>

      <div id="form-error" class="error" role="alert"></div>

      <button class="primary full" type="submit">
        Iniciar sesión →
      </button>
    </form>

    <p class="center">
      ${button('¿Olvidaste tu contraseña?', 'recover', '', 'ghost')}
    </p>

    <div class="demo">
      <small>CUENTAS DE DEMOSTRACIÓN · contraseña 123456</small>

      <div>
        ${DEMO_ACCOUNTS
          .filter(account =>
            ['u-admin', 'u-v1', 'u-o1'].includes(account.id)
          )
          .map(account =>
            button(roleNames[account.role], 'demo', account.email)
          )
          .join('')}
      </div>

      <small>
        Los accesos son simulados y los datos se guardan en este navegador.
        Utilizá información ficticia.
      </small>
    </div>
  `);
}

function recoverScreen() {
  authShell(`
    <h1>Recuperar contraseña</h1>

    <p>
      ${
        recovery?.verified
          ? 'Elegí una nueva contraseña de prueba.'
          : recovery
            ? 'Ingresá el código de recuperación.'
            : 'Ingresá el correo, usuario o teléfono de tu cuenta.'
      }
    </p>

    ${
      recovery && !recovery.verified
        ? `
          <div class="hint">
            Código simulado: ${CODE}. No se realiza ningún envío.
          </div>
        `
        : ''
    }

    ${formWrap(
      'recover',
      !recovery
        ? field(
            'contact',
            'Correo, usuario o teléfono',
            '',
            'text',
            'required'
          )
        : !recovery.verified
          ? field('code', 'Código', '', 'text', 'required')
          : field(
              'password',
              'Nueva contraseña',
              '',
              'password',
              'minlength="6" required'
            ) +
            field(
              'confirm',
              'Confirmar contraseña',
              '',
              'password',
              'minlength="6" required'
            )
    )}

    ${button('Volver al inicio de sesión', 'login')}

    ${
      recovery && !recovery.verified
        ? button('Reenviar código', 'resend')
        : ''
    }
  `);

  $$('[data-action="close"]').forEach(element => element.remove());
}

// PERMISOS Y NAVEGACIÓN

function canPet(pet) {
  return pet && user && (
    user.role !== 'owner' ||
    pet.ownerId === user.ownerId
  );
}

function pets() {
  return db.pets.filter(canPet);
}

function appts() {
  return db.appointments.filter(appointment =>
    user.role === 'admin' ||
    (user.role === 'vet' && appointment.vetId === user.vetId) ||
    (user.role === 'owner' && appointment.ownerId === user.ownerId)
  );
}

function notifications() {
  return db.notifications.filter(notification =>
    user.role === 'admin' ||
    (user.role === 'vet' && notification.vetId === user.vetId) ||
    (user.role === 'owner' && notification.ownerId === user.ownerId)
  );
}

function unread() {
  return notifications()
    .filter(notification => !notification.readBy.includes(user.id))
    .length;
}

function shell() {
  if (!user) return login();

  if (
    !allowed[user.role].includes(route) &&
    !['pet', 'owner', 'vet'].includes(route)
  ) {
    route = user.role === 'owner' ? 'pets' : 'home';
  }

  $('#app').innerHTML = `
    <aside class="sidebar">
      ${branding()}

      <div class="eyebrow">Tu espacio de trabajo</div>

      ${['admin', 'vet'].includes(user.role)
        ? `
          <div class="side-ticket">
            ${button(icon('receipt') + ' Generar ticket', 'ticket-create', '', 'primary')}
          </div>
        `
        : ''}

      <nav>
        ${allowed[user.role]
          .filter(key => navs[key])
          .map(key => `
            <button
              class="nav-item ${route === key ? 'active' : ''}"
              data-action="nav"
              data-id="${key}"
            >
              ${icon(navs[key][1])}
              ${
                user.role === 'owner' && key === 'pets'
                  ? 'Mis mascotas'
                  : user.role === 'vet' && key === 'agenda'
                    ? 'Mi agenda'
                    : navs[key][0]
              }
            </button>
          `)
          .join('')}
      </nav>

      <footer>
        <div class="hint">
          ${roleNames[user.role]}
          <br>
          <small>Sesión de demostración</small>
        </div>

        ${button(
          icon('logout') + ' Cerrar sesión',
          'logout',
          '',
          'ghost'
        )}

        <div class="footer-note">
          Gestión veterinaria<br>
          Organización que acompaña.
        </div>
      </footer>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="row">
          ${button(icon('menu'), 'menu', '', 'ghost menu-toggle')}
          ${branding()}

          <span class="role-label muted">
            ${
              user.role === 'admin'
                ? 'Panel administrativo'
                : user.role === 'vet'
                  ? 'Espacio profesional'
                  : 'Portal del propietario'
            }
          </span>
        </div>

        <div class="row">
          ${button(
            icon('bell') + ` <span class="badge">${unread()}</span>`,
            'nav',
            'notifications',
            'ghost'
          )}

          <span class="user-name">${esc(user.name)}</span>

          ${button(
            esc(
              user.name
                .split(' ')
                .map(part => part[0])
                .slice(0, 2)
                .join('')
            ),
            'account',
            '',
            'avatar'
          )}
        </div>
      </header>

      <main id="content" class="content"></main>
    </div>
  `;

  renderContent();
}

function navigate(nextRoute, id) {
  route = nextRoute;
  query = '';
  filter = '';
  page = 1;
  incomeDay = '';

  if (nextRoute === 'pet') {
    selectedPet = id;
    petTab = 'Resumen';
  }

  if (nextRoute === 'owner' || nextRoute === 'vet') {
    selectedPet = id;
  }

  shell();
  window.scrollTo(0, 0);
}

function heading(title, subtitle = '', actions = '') {
  return `
    <div class="heading">
      <div>
        <div class="eyebrow">${esc(db.config.name)}</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="row">${actions}</div>
    </div>
  `;
}

function badge(status) {
  const className = ['Pendiente', 'Inactivo'].includes(status)
    ? 'pending'
    : status === 'Cancelado'
      ? 'cancel'
      : status === 'Anulado'
        ? 'void'
        : status === 'Atendido'
          ? 'blue'
          : status === 'Pagado'
            ? 'paid'
            : '';

  return `<span class="badge ${className}">${esc(status)}</span>`;
}

function table(headers, rows) {
  if (!rows.length) {
    return '<div class="empty">No hay registros para mostrar.</div>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function appointmentTable(list) {
  return table(
    [
      'Hora / fecha',
      'Mascota',
      'Propietario',
      'Servicio',
      'Profesional',
      'Estado',
      ''
    ],
    list.map(appointment => [
      `${esc(appointment.time)}<br><small>${pretty(appointment.date)}</small>`,
      button(
        esc(label('pets', appointment.petId)),
        'pet',
        appointment.petId,
        'ghost small'
      ),
      esc(label('owners', appointment.ownerId)),
      esc(label('services', appointment.serviceId)),
      esc(label('vets', appointment.vetId)),
      badge(appointment.status),
      button('Ver detalle', 'appointment', appointment.id, 'small')
    ])
  );
}

// DASHBOARD

function home() {
  const list = appts()
    .filter(appointment => appointment.date === today())
    .sort((a, b) => a.time.localeCompare(b.time));

  const hour = new Date().getHours();

  const greeting = hour < 12
    ? 'Buenos días'
    : hour < 20
      ? 'Buenas tardes'
      : 'Buenas noches';

  const stats = [
    [
      'Mascotas registradas',
      db.pets.filter(pet => pet.active).length,
      'pet',
      'Pacientes bajo nuestro cuidado'
    ],
    [
      'Turnos de hoy',
      list.filter(appointment => appointment.status !== 'Cancelado').length,
      'calendar',
      'Agenda del día'
    ],
    [
      'Veterinarios',
      db.vets.filter(vet => vet.active).length,
      'medical',
      'Profesionales activos'
    ],
    [
      'Propietarios',
      db.owners.filter(owner => owner.active).length,
      'users',
      'Familias que nos acompañan'
    ],
    ...(user.role === 'admin'
      ? [[
        'Ingresos de hoy',
        money(
          (db.tickets || [])
            .filter(ticket =>
              ticket.status === 'Pagado' && ticket.date === today()
            )
            .reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
        ),
        'receipt',
        'Cobros del día',
        'income'
      ]]
      : [])
  ];

  const quickActions = [
    ['Nueva mascota', 'create', 'pets', 'pet'],
    ['Nuevo turno', 'book', '', 'calendar'],

    ...(['admin', 'vet'].includes(user.role)
      ? [['Nuevo ticket', 'ticket-create', '', 'receipt']]
      : []),

    ...(user.role === 'admin'
      ? [['Nuevo veterinario', 'create', 'vets', 'medical']]
      : []),

    ['Nuevo propietario', 'create', 'owners', 'users'],

    ...(user.role === 'admin'
      ? [['Nuevo aviso', 'create', 'notices', 'megaphone']]
      : []),

    ['Simular escaneo', 'scan', '', 'qr']
  ];

  return heading(
    `${greeting}, ${esc(user.name.split(' ')[0])}`,
    new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    button(icon('plus') + ' Nuevo turno', 'book', '', 'primary')
  ) + `
    <div class="toolbar">
      <input
        id="global-search"
        aria-label="Buscar mascota, propietario, DNI o teléfono"
        placeholder="Buscar mascota, propietario, DNI o teléfono..."
      >
    </div>

    <div id="global-results" class="search-results"></div>

    <section class="stats">
      ${stats.map(([title, amount, iconName, subtitle, navRoute]) => `
        <article class="card stat">
          ${icon(iconName)}
          <span>${title}</span>
          <strong>${amount}</strong>
          <small>${subtitle}</small>
          ${navRoute ? `<p>${button('Ver ingresos →', 'nav', navRoute, 'ghost small')}</p>` : ''}
        </article>
      `).join('')}
    </section>

    <div class="columns">
      <section>
        <article class="card">
          <div class="row between">
            <h2>Turnos de hoy</h2>
            ${button('Ver agenda →', 'nav', 'agenda', 'ghost small')}
          </div>

          ${appointmentTable(list)}
        </article>

        <article class="card">
          <h2>Últimas atenciones</h2>

          ${
            db.clinical
              .filter(record =>
                user.role === 'admin' || record.vetId === user.vetId
              )
              .slice(-3)
              .reverse()
              .map(record => `
                <div class="timeline">
                  <b>${esc(record.title)}</b> ·

                  ${button(
                    esc(label('pets', record.petId)),
                    'pet',
                    record.petId,
                    'ghost small'
                  )}

                  <br>

                  <small>
                    ${pretty(record.date)} · ${esc(record.authorName)}
                  </small>
                </div>
              `)
              .join('') ||
            '<p class="muted">Todavía no registraste atenciones.</p>'
          }
        </article>
      </section>

      <aside>
        <article class="card">
          <h2>Acciones rápidas</h2>

          <div class="quick">
            ${quickActions.map(([text, actionName, id, iconName]) =>
              button(icon(iconName) + text, actionName, id)
            ).join('')}
          </div>
        </article>

        <article class="card reminder">
          <div class="eyebrow">Próximos cuidados</div>
          <h2>Recordatorios</h2>

          ${
            reminderList()
              .slice(0, 3)
              .map(reminder => `
                <p>
                  <b>${esc(reminder.title)}</b>
                  <br>
                  <small>${pretty(reminder.date)}</small>
                </p>
              `)
              .join('') ||
            '<p class="muted">Sin recordatorios pendientes.</p>'
          }

          ${button('Ver todos →', 'nav', 'reminders', 'ghost small')}
        </article>
      </aside>
    </div>
  `;
}

function toolbar(options = []) {
  return `
    <div class="toolbar">
      <input
        id="list-search"
        aria-label="Buscar registros"
        placeholder="Buscar por nombre o datos..."
        value="${esc(query)}"
      >

      ${
        options.length
          ? `
            <select id="list-filter" aria-label="Filtrar">
              ${[
                ['', 'Todos'],
                ...options.map(option => [option, option])
              ].map(([value, text]) => `
                <option
                  value="${esc(value)}"
                  ${value === filter ? 'selected' : ''}
                >${esc(text)}</option>
              `).join('')}
            </select>
          `
          : ''
      }
    </div>
  `;
}

function pageRows(rows) {
  const max = Math.max(1, Math.ceil(rows.length / 8));
  page = Math.min(page, max);

  return [
    rows.slice((page - 1) * 8, page * 8),
    `
      <div class="pagination">
        <small>
          ${rows.length} registros · Página ${page} de ${max}
        </small>

        <div class="row">
          ${button('←', 'page', Math.max(1, page - 1), 'small')}
          ${button('→', 'page', Math.min(max, page + 1), 'small')}
        </div>
      </div>
    `
  ];
}

function matches(item) {
  return JSON.stringify(item)
    .toLocaleLowerCase('es')
    .includes(query.toLocaleLowerCase('es'));
}

// MASCOTAS Y PERFILES

function petPhoto(pet, large = false) {
  return pet.photo
    ? `
      <img
        class="${large ? 'profile-photo' : 'logo'}"
        src="${esc(pet.photo)}"
        alt="${esc(pet.name)}"
      >
    `
    : `
      <span class="${large ? 'profile-photo pet-avatar' : 'pet-avatar'}">
        ${icon('pet')}
      </span>
    `;
}

function petsView() {
  if (user.role === 'owner') {
    return heading(
      '¿Con qué mascota querés ingresar?',
      'Seleccioná un perfil para consultar sus cuidados y próximos turnos.'
    ) + `
      <div class="grid">
        ${
          pets()
            .filter(pet => pet.active)
            .map(pet => `
              <article class="card pet-card">
                ${petPhoto(pet, true)}
                <h2>${esc(pet.name)}</h2>
                <p class="muted">
                  ${esc(pet.species)} · ${esc(pet.breed)}
                </p>
                ${button('Ingresar al perfil →', 'pet', pet.id, 'primary')}
              </article>
            `)
            .join('') ||
          `
            <p class="empty">
              No tenés mascotas activas vinculadas.
              Consultá a la veterinaria.
            </p>
          `
        }
      </div>
    `;
  }

  const rows = pets().filter(pet =>
    matches({
      ...pet,
      owner: find('owners', pet.ownerId)
    }) &&
    (!filter || pet.species === filter)
  );

  const [slice, pager] = pageRows(rows);

  return heading(
    'Mascotas',
    'Todos los pacientes, con su información conectada.',
    button(icon('qr') + ' Simular escaneo', 'scan') +
    button('+ Nueva mascota', 'create', 'pets', 'primary')
  ) + `
    <section class="card">
      ${toolbar(['Perro', 'Gato', 'Otro'])}

      ${table(
        [
          'Mascota',
          'Especie / raza',
          'Sexo',
          'Propietario',
          'Estado',
          'Acciones'
        ],
        slice.map(pet => [
          `
            <div class="row">
              ${petPhoto(pet)}
              <b>${esc(pet.name)}</b>
            </div>
          `,
          `${esc(pet.species)}<br><small>${esc(pet.breed)}</small>`,
          esc(pet.sex),
          button(
            esc(label('owners', pet.ownerId)),
            'owner',
            pet.ownerId,
            'ghost small'
          ),
          badge(pet.active ? 'Activo' : 'Inactivo'),
          button('Ver', 'pet', pet.id, 'small') + ' ' +
          button('Editar', 'edit', 'pets:' + pet.id, 'small') + ' ' +
          button('QR', 'qr', pet.id, 'small') + ' ' +
          button(
            pet.active ? 'Desactivar' : 'Activar',
            'toggle',
            'pets:' + pet.id,
            'small'
          )
        ])
      )}

      ${pager}
    </section>
  `;
}

function petProfile() {
  const pet = find('pets', selectedPet);

  if (!canPet(pet)) {
    return `
      <div class="empty">
        No tenés permiso para consultar esta mascota.
      </div>
    `;
  }

  const owner = find('owners', pet.ownerId);

  const age = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(pet.birth + 'T12:00:00')) / 31557600000
    )
  );

  const tabs = [
    'Resumen',
    'Historia clínica',
    'Vacunas',
    'Tratamientos',
    'Desparasitación',
    'Pipetas',
    'Estudios',
    'Turnos'
  ];

  const category = {
    Vacunas: 'Vacuna',
    Tratamientos: 'Tratamiento',
    Desparasitación: 'Desparasitación',
    Pipetas: 'Pipeta',
    Estudios: 'Estudio'
  };

  const records = db.clinical
    .filter(record =>
      record.petId === pet.id &&
      (user.role !== 'owner' || record.visible)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  let content = '';

  if (petTab === 'Resumen') {
    content = `
      <div class="columns">
        <section class="card">
          <h2>Datos del paciente</h2>

          <div class="form-grid">
            <p>
              <small>Propietario</small><br>
              <b>${esc(owner?.name)}</b>
            </p>

            <p>
              <small>Nacimiento</small><br>
              ${pretty(pet.birth)}
            </p>

            <p>
              <small>Color</small><br>
              ${esc(pet.color)}
            </p>

            <p>
              <small>Estado</small><br>
              ${badge(pet.active ? 'Activo' : 'Inactivo')}
            </p>
          </div>

          <p>${esc(pet.observations)}</p>

          ${button(
            'Ver perfil del propietario →',
            'owner',
            pet.ownerId
          )}

          <h2>Última atención</h2>

          ${
            records.length
              ? clinicalCard(records[0])
              : '<p class="muted">Sin atenciones registradas.</p>'
          }
        </section>

        <aside>
          <article class="card reminder">
            <h2>Próximos cuidados</h2>

            ${
              db.reminders
                .filter(reminder =>
                  reminder.petId === pet.id && !reminder.done
                )
                .map(reminder => `
                  <p>
                    ${esc(reminder.title)}<br>
                    <small>${pretty(reminder.date)}</small>
                  </p>
                `)
                .join('') ||
              '<p class="muted">Sin recordatorios.</p>'
            }
          </article>

          <article class="card notice">
            <h2>Avisos de la veterinaria</h2>

            ${visibleNotices()
              .slice(0, 2)
              .map(notice => `
                <p>
                  <b>${esc(notice.title)}</b><br>
                  <small>${esc(notice.message)}</small>
                </p>
              `)
              .join('')}
          </article>
        </aside>
      </div>
    `;
  } else if (petTab === 'Turnos') {
    content = `
      <section class="card">
        ${appointmentTable(
          appts().filter(appointment => appointment.petId === pet.id)
        )}
      </section>
    `;
  } else {
    content = `
      <section class="card">
        <div class="row between">
          <h2>${petTab}</h2>

          ${
            user.role !== 'owner'
              ? button(
                  '+ Registrar atención',
                  'clinical',
                  pet.id,
                  'primary'
                )
              : ''
          }
        </div>

        ${
          records
            .filter(record =>
              !category[petTab] ||
              record.type === category[petTab]
            )
            .map(clinicalCard)
            .join('') ||
          '<div class="empty">Sin registros en esta sección.</div>'
        }
      </section>
    `;
  }

  return heading(
    esc(pet.name),
    `${esc(pet.species)} · ${esc(pet.breed)} · ${esc(pet.sex)} · ${age} años · ${esc(pet.weight)} kg`,
    button('Cambiar mascota', 'nav', 'pets') +
    (canCreateTicket() ? button('Nuevo ticket', 'ticket-pet', pet.id) : '') +
    button('Solicitar turno', 'book', pet.id, 'primary')
  ) + `
    <section class="card">
      <div class="row between">
        <div class="row">
          ${petPhoto(pet, true)}

          <div>
            <h2>${esc(pet.name)}</h2>
            <p class="muted">
              ${esc(owner?.name)} · Paciente ${esc(pet.id.slice(0, 8))}
            </p>
          </div>
        </div>

        <div class="row">
          ${
            user.role !== 'owner'
              ? button('Editar mascota', 'edit', 'pets:' + pet.id)
              : ''
          }

          ${button('Ver QR', 'qr', pet.id)}
          ${button('Imprimir QR', 'print-qr', pet.id)}
        </div>
      </div>
    </section>

    <nav class="tabs" aria-label="Información clínica">
      ${tabs.map(tab =>
        button(tab, 'tab', tab, tab === petTab ? 'active' : '')
      ).join('')}
    </nav>

    ${content}
  `;
}

function clinicalCard(record) {
  return `
    <article class="timeline">
      <div class="row between">
        <b>${esc(record.title)}</b>
        ${badge(record.type)}
      </div>

      <p>${esc(record.info)}</p>

      ${
        record.diagnosis
          ? `
            <p>
              <small>Diagnóstico:</small>
              ${esc(record.diagnosis)}
            </p>
          `
          : ''
      }

      <small>
        ${pretty(record.date)} ·
        ${esc(record.authorName || label('vets', record.vetId))}
        ${record.weight ? ' · ' + esc(record.weight) + ' kg' : ''}
        ${!record.visible ? ' · Nota interna' : ''}
      </small>
    </article>
  `;
}

function ownerProfile(id) {
  const owner = find('owners', id);

  if (
    !owner ||
    (user.role === 'owner' && owner.id !== user.ownerId)
  ) {
    return '<div class="empty">Perfil no disponible.</div>';
  }

  return heading(
    esc(owner.name),
    'Perfil del propietario',
    user.role === 'owner'
      ? button('Editar mis datos', 'edit', 'owners:' + owner.id)
      : button('Editar propietario', 'edit', 'owners:' + owner.id) +
        (canCreateTicket() ? button('Nuevo ticket', 'ticket-owner', owner.id) : '') +
        button('+ Agregar mascota', 'pet-owner', owner.id, 'primary')
  ) + `
    <section class="card">
      <div class="form-grid">
        <p><small>DNI</small><br>${esc(owner.dni)}</p>
        <p><small>Teléfono</small><br>${esc(owner.phone)}</p>
        <p><small>Correo</small><br>${esc(owner.email)}</p>
        <p><small>Dirección</small><br>${esc(owner.address)}</p>
      </div>
    </section>

    <h2>Mascotas vinculadas</h2>

    <div class="grid">
      ${
        db.pets
          .filter(pet => pet.ownerId === owner.id)
          .map(pet => `
            <article class="card">
              ${petPhoto(pet)}
              <h2>${esc(pet.name)}</h2>
              <p>${esc(pet.species)} · ${esc(pet.breed)}</p>
              ${button('Ver perfil', 'pet', pet.id, 'primary')}
            </article>
          `)
          .join('') ||
        '<p class="muted">Todavía no hay mascotas vinculadas.</p>'
      }
    </div>

    ${ownerTicketsHTML(owner.id)}
  `;
}

// LISTADOS ADMINISTRATIVOS

function genericView(collection) {
  const editable =
    user.role === 'admin' ||
    (collection === 'owners' && user.role === 'vet');

  let rows = db[collection]
    .filter(matches)
    .filter(item =>
      !filter ||
      (item.active ? 'Activo' : 'Inactivo') === filter
    );

  if (collection === 'services' && user.role === 'vet') {
    rows = rows.filter(service =>
      find('vets', user.vetId)?.serviceIds.includes(service.id)
    );
  }

  const [slice, pager] = pageRows(rows);

  let headers;
  let values;

  if (collection === 'owners') {
    headers = [
      'Nombre',
      'DNI',
      'Contacto',
      'Mascotas',
      'Estado',
      'Acciones'
    ];

    values = slice.map(owner => [
      esc(owner.name),
      esc(owner.dni),
      `${esc(owner.phone)}<br><small>${esc(owner.email)}</small>`,
      db.pets.filter(pet => pet.ownerId === owner.id).length,
      badge(owner.active ? 'Activo' : 'Inactivo'),
      button('Ver perfil', 'owner', owner.id, 'small') + ' ' +
      button('Editar', 'edit', 'owners:' + owner.id, 'small') +
      (
        user.role === 'admin'
          ? ' ' + button(
              owner.active ? 'Desactivar' : 'Activar',
              'toggle',
              'owners:' + owner.id,
              'small'
            )
          : ''
      )
    ]);
  }

  if (collection === 'vets') {
    headers = [
      'Profesional',
      'Matrícula / especialidad',
      'Servicios',
      'Estado',
      'Acciones'
    ];

    values = slice.map(vet => [
      esc(vet.name),
      `${esc(vet.license)}<br><small>${esc(vet.specialty)}</small>`,
      `
        <div class="wrap">
          ${vet.serviceIds
            .map(serviceId => esc(label('services', serviceId)))
            .join(', ')}
        </div>
      `,
      badge(vet.active ? 'Activo' : 'Inactivo'),
      button('Perfil', 'vet', vet.id, 'small') + ' ' +
      button('Editar', 'edit', 'vets:' + vet.id, 'small') + ' ' +
      button(
        vet.active ? 'Desactivar' : 'Activar',
        'toggle',
        'vets:' + vet.id,
        'small'
      )
    ]);
  }

  if (collection === 'services') {
    headers = [
      'Servicio',
      'Precio',
      'Duración',
      'Profesionales',
      'Estado',
      'Acciones'
    ];

    values = slice.map(service => [
      esc(service.name),
      money(service.price || 0),
      esc(service.duration) + ' min',
      `
        <div class="wrap">
          ${
            db.vets
              .filter(vet => vet.serviceIds.includes(service.id))
              .map(vet => esc(vet.name))
              .join(', ') ||
            'Sin asignar'
          }
        </div>
      `,
      badge(service.active ? 'Activo' : 'Inactivo'),
      editable
        ? button(
            'Editar / asignar',
            'edit',
            'services:' + service.id,
            'small'
          ) + ' ' +
          button(
            service.active ? 'Desactivar' : 'Activar',
            'toggle',
            'services:' + service.id,
            'small'
          )
        : esc(service.description)
    ]);
  }

  if (collection === 'users') {
    headers = [
      'Nombre',
      'Usuario / correo',
      'Rol',
      'Último acceso',
      'Estado',
      'Acciones'
    ];

    values = slice.map(account => [
      esc(account.name),
      esc(account.email),
      roleNames[account.role],
      account.lastAccess
        ? new Date(account.lastAccess).toLocaleString('es-AR')
        : 'Sin acceso',
      badge(account.active ? 'Activo' : 'Inactivo'),
      button('Editar', 'edit', 'users:' + account.id, 'small') + ' ' +
      button('Restablecer', 'reset-password', account.id, 'small') +
      (
        account.id !== user.id
          ? ' ' + button(
              account.active ? 'Desactivar' : 'Activar',
              'toggle',
              'users:' + account.id,
              'small'
            )
          : ''
      )
    ]);
  }

  return heading(
    navs[collection][0],
    'Consultá y administrá los registros de la veterinaria.',
    editable
      ? button('+ Agregar', 'create', collection, 'primary')
      : ''
  ) + `
    <section class="card">
      ${toolbar(['Activo', 'Inactivo'])}
      ${table(headers, values)}
      ${pager}
    </section>
  `;
}

function vetProfile() {
  if (user.role !== 'admin') {
    return '<p>Acceso restringido.</p>';
  }

  const vet = find('vets', selectedPet);

  if (!vet) {
    return '<p>Profesional no disponible.</p>';
  }

  return heading(
    esc(vet.name),
    `${esc(vet.license)} · ${esc(vet.specialty)}`,
    button('Editar / asignar servicios', 'edit', 'vets:' + vet.id) +
    button('Ver agenda', 'vet-agenda', vet.id, 'primary')
  ) + `
    <section class="card">
      <h2>Servicios y disponibilidad</h2>

      <p>
        ${vet.serviceIds
          .map(serviceId => esc(label('services', serviceId)))
          .join(' · ')}
      </p>

      ${button('Configurar horarios', 'nav', 'schedules')}

      ${scheduleTable(
        db.schedules.filter(schedule => schedule.vetId === vet.id)
      )}
    </section>
  `;
}

// HORARIOS Y AGENDA

function scheduleTable(rows) {
  return table(
    [
      'Profesional',
      'Servicio',
      'Día',
      'Franja',
      'Duración',
      'Estado',
      ''
    ],
    rows.map(schedule => [
      esc(label('vets', schedule.vetId)),
      esc(label('services', schedule.serviceId)),
      dayNames[schedule.day],
      `${schedule.start} – ${schedule.end}`,
      schedule.duration + ' min',
      badge(schedule.active ? 'Activo' : 'Inactivo'),
      button(
        'Editar',
        'edit',
        'schedules:' + schedule.id,
        'small'
      ) + ' ' +
      button(
        schedule.active ? 'Desactivar' : 'Activar',
        'toggle',
        'schedules:' + schedule.id,
        'small'
      )
    ])
  );
}

function schedulesView() {
  const [rows, pager] = pageRows(
    db.schedules.filter(schedule =>
      matches({
        ...schedule,
        vet: label('vets', schedule.vetId),
        service: label('services', schedule.serviceId),
        weekday: dayNames[schedule.day]
      })
    )
  );

  return heading(
    'Horarios de atención',
    'Disponibilidad habitual por profesional, servicio y día.',
    button('+ Nueva franja', 'create', 'schedules', 'primary')
  ) + `
    <div class="hint">
      La agenda calcula los turnos usando estas franjas,
      los días de apertura y las reservas existentes.
      Ecografía demo: miércoles de 09:00 a 13:00 con Lucía Martínez.
    </div>

    <section class="card">
      ${toolbar()}
      ${scheduleTable(rows)}
      ${pager}
    </section>
  `;
}

/*
  Disponibilidad mediante intervalos [inicio, fin).
  Una reserva bloquea al profesional en todos sus servicios.
  También se evitan superposiciones de turnos de la misma mascota.
*/
function slots(serviceId, vetId, date, petId = '', exclude = '') {
  const service = find('services', serviceId);
  const vet = find('vets', vetId);

  if (
    !service?.active ||
    !vet?.active ||
    !vet.serviceIds.includes(serviceId) ||
    date < today()
  ) {
    return [];
  }

  const day = new Date(date + 'T12:00:00').getDay();

  if (!db.config.days.map(Number).includes(day)) {
    return [];
  }

  const result = [];

  db.schedules
    .filter(schedule =>
      schedule.active &&
      schedule.vetId === vetId &&
      schedule.serviceId === serviceId &&
      Number(schedule.day) === day
    )
    .forEach(schedule => {
      const duration =
        Number(schedule.duration) ||
        Number(service.duration) ||
        Number(db.config.duration);

      const start = Math.max(
        minutes(schedule.start),
        minutes(db.config.start)
      );

      const end = Math.min(
        minutes(schedule.end),
        minutes(db.config.end)
      );

      for (
        let time = start;
        time + duration <= end;
        time += duration
      ) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (date === today() && time <= currentMinutes) {
          continue;
        }

        const busy = db.appointments.some(appointment =>
          appointment.id !== exclude &&
          appointment.date === date &&
          appointment.status !== 'Cancelado' &&
          (
            appointment.vetId === vetId ||
            (petId && appointment.petId === petId)
          ) &&
          time < minutes(appointment.time) + Number(appointment.duration) &&
          time + duration > minutes(appointment.time)
        );

        if (
          !busy &&
          !result.some(slot => slot.time === clock(time))
        ) {
          result.push({
            time: clock(time),
            duration
          });
        }
      }
    });

  return result.sort((a, b) => a.time.localeCompare(b.time));
}

function agendaView() {
  const list = appts().filter(appointment =>
    !agendaVet || appointment.vetId === agendaVet
  );

  let body;

  if (agendaMode === 'day') {
    body = appointmentTable(
      list
        .filter(appointment => appointment.date === agendaDate)
        .sort((a, b) => a.time.localeCompare(b.time))
    );
  } else {
    const day = new Date(agendaDate + 'T12:00:00').getDay();
    const monday = addDays(agendaDate, -((day + 6) % 7));

    body = `
      <div class="week">
        ${Array.from({ length: 7 }, (_, index) => {
          const date = addDays(monday, index);

          return `
            <section class="day">
              <h3>
                ${dayNames[new Date(date + 'T12:00:00').getDay()]}
                <br>
                ${pretty(date)}
              </h3>

              ${
                list
                  .filter(appointment => appointment.date === date)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(appointment =>
                    button(
                      `
                        ${esc(appointment.time)} ·
                        ${esc(label('pets', appointment.petId))}
                        <br>
                        <small>
                          ${esc(label('services', appointment.serviceId))}
                          <br>
                          ${esc(label('vets', appointment.vetId))}
                        </small>
                        <br>
                        ${badge(appointment.status)}
                      `,
                      'appointment',
                      appointment.id
                    )
                  )
                  .join('') ||
                '<small>Sin turnos</small>'
              }
            </section>
          `;
        }).join('')}
      </div>
    `;
  }

  return heading(
    user.role === 'vet' ? 'Mi agenda' : 'Agenda',
    'Organizá la atención y consultá las reservas.',
    button('+ Nuevo turno', 'book', '', 'primary')
  ) + `
    <section class="card">
      <div class="toolbar">
        <input
          type="date"
          id="agenda-date"
          aria-label="Fecha de agenda"
          value="${agendaDate}"
        >

        <select id="agenda-mode" aria-label="Vista de agenda">
          <option value="day" ${agendaMode === 'day' ? 'selected' : ''}>
            Vista diaria
          </option>
          <option value="week" ${agendaMode === 'week' ? 'selected' : ''}>
            Vista semanal
          </option>
        </select>

        ${
          user.role === 'admin'
            ? `
              <select id="agenda-vet" aria-label="Veterinario">
                <option value="">Todos los profesionales</option>

                ${db.vets.map(vet => `
                  <option
                    value="${vet.id}"
                    ${agendaVet === vet.id ? 'selected' : ''}
                  >${esc(vet.name)}</option>
                `).join('')}
              </select>
            `
            : ''
        }
      </div>

      ${body}
    </section>

    <section class="card">
      <h2>Buscar un horario disponible</h2>
      <p class="muted">
        Elegí una mascota, servicio y profesional para consultar
        las fechas y horas libres.
      </p>
      ${button('Consultar disponibilidad', 'book')}
    </section>
  `;
}

function book(petId = '', appointmentId = '') {
  const appointment = appointmentId
    ? find('appointments', appointmentId)
    : null;

  if (appointment && !appts().includes(appointment)) {
    return;
  }

  const list = pets().filter(pet =>
    pet.active && find('owners', pet.ownerId)?.active
  );

  if (!list.length) {
    return toast('Registrá primero una mascota con propietario activo.');
  }

  modal(
    appointment ? 'Reprogramar turno' : 'Solicitar un turno',
    `
      <div class="hint">
        Se muestran fechas y horarios libres dentro de los próximos
        90 días. Las reservas ocupadas se excluyen automáticamente.
      </div>

      <br>

      ${formWrap(
        'booking',
        select(
          'petId',
          'Mascota',
          list.map(pet => [pet.id, pet.name]),
          appointment?.petId || petId || list[0].id,
          'required'
        ) +
        select(
          'serviceId',
          'Servicio',
          activeOptions('services'),
          appointment?.serviceId || '',
          'required'
        ) +
        select('vetId', 'Profesional', [], '', 'required') +
        select('date', 'Fechas disponibles', [], '', 'required') +
        select('time', 'Horarios disponibles', [], '', 'required') +
        field(
          'reason',
          'Motivo',
          appointment?.reason || '',
          'text',
          'required'
        ) +
        area(
          'observations',
          'Observaciones',
          appointment?.observations || ''
        ),
        appointmentId
      )}
    `
  );

  updateBooking('service', appointment?.vetId);
}

function setOptions(name, items) {
  const element = $(`#modal [name="${name}"]`);

  element.innerHTML = items.length
    ? items.map(([value, text]) => `
        <option value="${esc(value)}">${esc(text)}</option>
      `).join('')
    : '<option value="">Sin disponibilidad</option>';
}

function updateBooking(stage, preferred = '') {
  const form = $('#modal form');
  const service = form.elements.serviceId.value;
  const pet = form.elements.petId.value;

  if (stage === 'service') {
    let vets = db.vets.filter(vet =>
      vet.active && vet.serviceIds.includes(service)
    );

    if (user.role === 'vet') {
      vets = vets.filter(vet => vet.id === user.vetId);
    }

    setOptions('vetId', vets.map(vet => [vet.id, vet.name]));

    if (
      preferred &&
      vets.some(vet => vet.id === preferred)
    ) {
      form.elements.vetId.value = preferred;
    }
  }

  const vet = form.elements.vetId.value;

  if (stage !== 'date') {
    const dates = [];

    for (let index = 0; index < 90; index++) {
      const date = addDays(today(), index);

      if (slots(service, vet, date, pet, form.dataset.id).length) {
        dates.push([
          date,
          `${dayNames[new Date(date + 'T12:00:00').getDay()]} ${pretty(date)}`
        ]);
      }
    }

    setOptions('date', dates);
  }

  setOptions(
    'time',
    slots(
      service,
      vet,
      form.elements.date.value,
      pet,
      form.dataset.id
    ).map(slot => [
      slot.time,
      `${slot.time} · ${slot.duration} min`
    ])
  );

  form.querySelector('button[type=submit]').disabled =
    !form.elements.time.value;
}

function appointmentDetails(id) {
  const appointment = appts().find(item => item.id === id);

  if (!appointment) {
    return toast('Turno no disponible.');
  }

  modal(
    'Detalle del turno',
    `
      <div class="row between">
        <h2>${esc(label('pets', appointment.petId))}</h2>
        ${badge(appointment.status)}
      </div>

      <p>
        ${pretty(appointment.date)} ·
        <b>${esc(appointment.time)}</b> ·
        ${appointment.duration} minutos
      </p>

      <p>
        ${esc(label('services', appointment.serviceId))}<br>
        ${esc(label('vets', appointment.vetId))}<br>
        Propietario: ${esc(label('owners', appointment.ownerId))}
      </p>

      <p>
        Motivo: ${esc(appointment.reason)}<br>
        ${esc(appointment.observations)}
      </p>

      <div class="row">
        ${button('Abrir mascota', 'pet', appointment.petId)}

        ${
          !['Cancelado', 'Atendido'].includes(appointment.status)
            ? button('Reprogramar', 'reschedule', appointment.id) +
              button(
                'Cancelar turno',
                'cancel-appointment',
                appointment.id,
                'danger'
              )
            : ''
        }

        ${
          user.role !== 'owner' && appointment.status === 'Pendiente'
            ? button(
                'Confirmar',
                'confirm-appointment',
                appointment.id,
                'primary'
              )
            : ''
        }

        ${
          user.role !== 'owner' && appointment.status === 'Confirmado'
            ? button(
                'Registrar atención',
                'attend',
                appointment.id,
                'primary'
              )
            : ''
        }

        ${appointmentTicketButtons(appointment)}
      </div>
    `
  );
}

// CATÁLOGO, AVISOS, RECORDATORIOS Y NOTIFICACIONES

function visibleNotices() {
  return db.notices.filter(notice =>
    notice.active &&
    notice.date <= today() &&
    (!notice.expires || notice.expires >= today())
  );
}

function catalog() {
  const rows = db.products
    .filter(product => user.role === 'admin' || product.active)
    .filter(matches)
    .filter(product => !filter || product.category === filter);

  return heading(
    'Catálogo',
    `Productos disponibles en ${esc(db.config.name)}. Consultas: ${esc(db.config.phone)}.`,
    user.role === 'admin'
      ? button('+ Nuevo producto', 'create', 'products', 'primary')
      : ''
  ) +
  toolbar([...new Set(db.products.map(product => product.category))]) +
  `
    <div class="grid">
      ${
        rows.map(product => `
          <article class="card">
            ${
              product.photo
                ? `
                  <img
                    class="product-img"
                    src="${esc(product.photo)}"
                    alt="${esc(product.name)}"
                  >
                `
                : `<div class="product-img">${icon('bag')}</div>`
            }

            <small>${esc(product.category)}</small>
            <h2>${esc(product.name)}</h2>
            <p class="muted">${esc(product.description)}</p>

            <div class="row between">
              <b>${money(product.price)}</b>
              ${badge(product.stock > 0 ? 'Disponible' : 'Sin stock')}
            </div>

            <p>
              <small>
                ${product.stock} unidades ·
                ${product.active ? 'Publicado' : 'Inactivo'}
              </small>
            </p>

            ${
              user.role === 'admin'
                ? button(
                    'Editar',
                    'edit',
                    'products:' + product.id,
                    'small'
                  ) + ' ' +
                  button(
                    product.active ? 'Desactivar' : 'Activar',
                    'toggle',
                    'products:' + product.id,
                    'small'
                  )
                : ''
            }
          </article>
        `).join('') ||
        '<p class="empty">No se encontraron productos.</p>'
      }
    </div>
  `;
}

function noticesView() {
  const rows = (
    user.role === 'admin' ? db.notices : visibleNotices()
  ).filter(matches);

  return heading(
    'Avisos',
    'Información publicada por la veterinaria.',
    user.role === 'admin'
      ? button('+ Nuevo aviso', 'create', 'notices', 'primary')
      : ''
  ) +
  toolbar() +
  rows.map(notice => `
    <article class="card notice">
      <div class="row between">
        <h2>${esc(notice.title)}</h2>
        ${badge(notice.active ? 'Publicado' : 'Borrador')}
      </div>

      <p>${esc(notice.message)}</p>

      <small>
        ${esc(db.config.name)} · ${pretty(notice.date)}
        ${notice.expires ? ' · Hasta ' + pretty(notice.expires) : ''}
      </small>

      ${
        user.role === 'admin'
          ? `
            <div class="form-actions">
              ${button('Editar', 'edit', 'notices:' + notice.id)}

              ${button(
                notice.active ? 'Desactivar' : 'Publicar',
                'toggle',
                'notices:' + notice.id
              )}

              ${button(
                'Eliminar',
                'delete-notice',
                notice.id,
                'danger'
              )}
            </div>
          `
          : ''
      }
    </article>
  `).join('');
}

function reminderList() {
  return db.reminders
    .filter(reminder => canPet(find('pets', reminder.petId)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function remindersView() {
  return heading(
    'Recordatorios',
    'Próximas vacunas, controles y cuidados.',
    user.role !== 'owner'
      ? button('+ Nuevo recordatorio', 'create', 'reminders', 'primary')
      : ''
  ) +
  reminderList().map(reminder => `
    <article class="card reminder">
      <div class="row between">
        <div>
          <h2>${esc(reminder.title)}</h2>

          <p>
            ${esc(label('pets', reminder.petId))} ·
            ${pretty(reminder.date)}
          </p>

          ${badge(
            reminder.done
              ? 'Completado'
              : reminder.date < today()
                ? 'Pendiente'
                : 'Próximo'
          )}
        </div>

        <div class="row">
          ${button('Ver mascota', 'pet', reminder.petId)}

          ${
            user.role !== 'owner'
              ? button('Editar', 'edit', 'reminders:' + reminder.id) +
                button(
                  reminder.done ? 'Reabrir' : 'Completar',
                  'reminder-done',
                  reminder.id
                )
              : ''
          }
        </div>
      </div>
    </article>
  `).join('') || '<p>Sin recordatorios.</p>';
}

function notificationsView() {
  return heading(
    'Notificaciones',
    'Eventos y actualizaciones de tu actividad.',
    button('Marcar todas como leídas', 'read-all')
  ) +
  notifications()
    .slice()
    .reverse()
    .map(notification => `
      <article class="card notification">
        <div class="row between">
          <div>
            <p>${esc(notification.message)}</p>
            <small>
              ${new Date(notification.date).toLocaleString('es-AR')}
            </small>
          </div>

          ${
            notification.readBy.includes(user.id)
              ? badge('Leída')
              : button(
                  'Marcar como leída',
                  'read',
                  notification.id,
                  'small'
                )
          }
        </div>
      </article>
    `)
    .join('');
}

function renderContent() {
  let html;

  switch (route) {
    case 'home':
      html = home();
      break;

    case 'pets':
      html = petsView();
      break;

    case 'pet':
      html = petProfile();
      break;

    case 'owner':
      html = ownerProfile(selectedPet);
      break;

    case 'ownerProfile':
      html = ownerProfile(user.ownerId);
      break;

    case 'vet':
      html = vetProfile();
      break;

    case 'agenda':
      html = agendaView();
      break;

    case 'schedules':
      html = schedulesView();
      break;

    case 'products':
      html = catalog();
      break;

    case 'notices':
      html = noticesView();
      break;

    case 'notifications':
      html = notificationsView();
      break;

    case 'reminders':
      html = remindersView();
      break;

    case 'income':
      html = incomeView();
      break;

    case 'tickets':
      html = myTicketsView();
      break;

    case 'billing':
      html = user.role === 'admin' ? incomeView() : myTicketsView();
      break;

    case 'settings':
      html = heading(
        'Configuración',
        'Los datos de tu veterinaria se reutilizan en todo el sistema.'
      ) + `
        <section class="card">
          ${formWrap('settings', clinicFields(db.config))}
        </section>
      `;
      break;

    default:
      html = genericView(route);
  }

  $('#content').innerHTML = html;
}

// FORMULARIOS DE ALTA Y EDICIÓN

function mayEdit(collection, id = '') {
  if (!user) return false;

  if (user.role === 'admin') return true;

  if (user.role === 'vet') {
    return ['pets', 'owners', 'reminders', 'tickets'].includes(collection);
  }

  return collection === 'owners' && id === user.ownerId;
}

function editForm(collection, id = '', preset = {}) {
  if (!mayEdit(collection, id)) {
    return toast('No tenés permisos para realizar esta acción.');
  }

  const item = id ? find(collection, id) : preset;

  if (!item) return;

  let content = '';

  if (collection === 'pets') {
    content =
      field('name', 'Nombre', item.name, 'text', 'required') +
      select(
        'species',
        'Especie',
        ['Perro', 'Gato', 'Otro'],
        item.species
      ) +
      field('breed', 'Raza', item.breed) +
      select('sex', 'Sexo', ['Hembra', 'Macho'], item.sex) +
      field(
        'birth',
        'Fecha de nacimiento',
        item.birth,
        'date',
        `required max="${today()}"`
      ) +
      field(
        'weight',
        'Peso (kg)',
        item.weight,
        'number',
        'required min="0.01" step="0.01"'
      ) +
      field('color', 'Color', item.color) +
      field(
        'photo',
        'Foto (hasta 1 MB)',
        '',
        'file',
        'accept="image/png,image/jpeg,image/webp"'
      ) +
      select(
        'ownerId',
        'Propietario',
        activeOptions('owners'),
        item.ownerId,
        'required'
      ) +
      `
        <div class="field">
          ¿Es un nuevo propietario?
          ${button('+ Registrar propietario', 'inline-owner')}
        </div>
      ` +
      area('observations', 'Observaciones', item.observations);
  }

  if (collection === 'owners') {
    content =
      field('name', 'Nombre y apellido', item.name, 'text', 'required') +
      field(
        'dni',
        'DNI',
        item.dni,
        'text',
        'required pattern="[0-9]{8}" minlength="8" maxlength="8" inputmode="numeric" title="El DNI debe tener 8 números" oninput="this.value=this.value.replace(/[^0-9]/g,\'\').slice(0,8)"'
      ) +
      field('phone', 'Teléfono', item.phone, 'tel', 'required') +
      field('email', 'Correo', item.email, 'email', 'required') +
      field('address', 'Dirección', item.address, 'text', 'required');
  }

  if (collection === 'vets') {
    content =
      field('name', 'Nombre y apellido', item.name, 'text', 'required') +
      field('license', 'Matrícula', item.license, 'text', 'required') +
      field(
        'specialty',
        'Especialidad',
        item.specialty,
        'text',
        'required'
      ) +
      checks(
        'serviceIds',
        'Servicios asignados',
        activeOptions('services'),
        item.serviceIds || []
      ) +
      (
        !id
          ? field(
              'email',
              'Correo de la cuenta individual',
              '',
              'email',
              'required'
            ) +
            field(
              'password',
              'Contraseña inicial de prueba',
              '',
              'password',
              'required minlength="6"'
            )
          : ''
      );
  }

  if (collection === 'services') {
    content =
      field(
        'name',
        'Nombre del servicio',
        item.name,
        'text',
        'required'
      ) +
      field(
        'price',
        'Precio ($)',
        item.price ?? 0,
        'number',
        'required min="0" step="0.01"'
      ) +
      field(
        'duration',
        'Duración predeterminada (minutos)',
        item.duration || db.config.duration,
        'number',
        'required min="5" max="240"'
      ) +
      area('description', 'Descripción', item.description) +
      checks(
        'vetIds',
        'Profesionales habilitados',
        activeOptions('vets'),
        db.vets
          .filter(vet => vet.serviceIds.includes(id))
          .map(vet => vet.id)
      );
  }

  if (collection === 'schedules') {
    content =
      select(
        'vetId',
        'Veterinario',
        activeOptions('vets'),
        item.vetId,
        'required'
      ) +
      select(
        'serviceId',
        'Servicio',
        activeOptions('services'),
        item.serviceId,
        'required'
      ) +
      select(
        'day',
        'Día',
        dayNames.map((name, index) => [index, name]),
        item.day ?? 1
      ) +
      field(
        'start',
        'Hora de inicio',
        item.start || '09:00',
        'time',
        'required'
      ) +
      field(
        'end',
        'Hora de finalización',
        item.end || '13:00',
        'time',
        'required'
      ) +
      field(
        'duration',
        'Duración del turno',
        item.duration || db.config.duration,
        'number',
        'required min="5" max="240"'
      );
  }

  if (collection === 'products') {
    content =
      field('name', 'Nombre', item.name, 'text', 'required') +
      field('category', 'Categoría', item.category, 'text', 'required') +
      area('description', 'Descripción', item.description) +
      field(
        'price',
        'Precio ($)',
        item.price,
        'number',
        'required min="0" step="0.01"'
      ) +
      field(
        'stock',
        'Stock',
        item.stock,
        'number',
        'required min="0" step="1"'
      ) +
      field(
        'photo',
        'Imagen (hasta 1 MB)',
        '',
        'file',
        'accept="image/png,image/jpeg,image/webp"'
      );
  }

  if (collection === 'notices') {
    content =
      field('title', 'Título', item.title, 'text', 'required') +
      field(
        'date',
        'Fecha de publicación',
        item.date || today(),
        'date',
        'required'
      ) +
      area('message', 'Mensaje', item.message) +
      field('expires', 'Expiración (opcional)', item.expires, 'date') +
      select(
        'active',
        'Estado',
        [
          [true, 'Publicado'],
          [false, 'Borrador']
        ],
        item.active ?? true
      );
  }

  if (collection === 'users') {
    content =
      field('name', 'Nombre', item.name, 'text', 'required') +
      field('email', 'Usuario / correo', item.email, 'text', 'required') +
      select(
        'role',
        'Rol',
        Object.entries(roleNames),
        item.role || 'owner',
        item.principal ? 'disabled' : ''
      ) +
      select(
        'vetId',
        'Perfil veterinario (para ese rol)',
        [
          ['', 'Sin vincular'],
          ...activeOptions('vets')
        ],
        item.vetId
      ) +
      select(
        'ownerId',
        'Perfil propietario (para ese rol)',
        [
          ['', 'Sin vincular'],
          ...activeOptions('owners')
        ],
        item.ownerId
      ) +
      field(
        'password',
        id
          ? 'Nueva contraseña (vacío conserva la actual)'
          : 'Contraseña de prueba',
        '',
        'password',
        `minlength="6" ${id ? '' : 'required'}`
      );
  }

  if (collection === 'reminders') {
    content =
      select(
        'petId',
        'Mascota',
        pets().map(pet => [pet.id, pet.name]),
        item.petId,
        'required'
      ) +
      field(
        'title',
        'Cuidado / recordatorio',
        item.title,
        'text',
        'required'
      ) +
      field(
        'date',
        'Próxima fecha',
        item.date || today(),
        'date',
        'required'
      );
  }

  const names = {
    pets: 'mascota',
    owners: 'propietario',
    vets: 'veterinario',
    services: 'servicio',
    schedules: 'horario',
    products: 'producto',
    notices: 'aviso',
    users: 'usuario',
    reminders: 'recordatorio'
  };

  modal(
    `${id ? 'Editar' : 'Crear'} ${names[collection]}`,
    formWrap('entity', content, collection + ':' + id)
  );
}

function clinicalForm(petId, appointmentId = '') {
  if (
    user.role === 'owner' ||
    !canPet(find('pets', petId))
  ) {
    return;
  }

  modal(
    'Registrar atención clínica',
    `
      <div class="hint">
        Responsable: <b>${esc(user.name)}</b>.
        Se registra automáticamente con tu cuenta
        ${user.role === 'admin' ? ' administrativa' : ''}.
      </div>

      <br>

      ${formWrap(
        'clinical',
        select(
          'type',
          'Tipo de registro',
          [
            'Consulta',
            'Vacuna',
            'Tratamiento',
            'Desparasitación',
            'Pipeta',
            'Estudio'
          ]
        ) +
        field(
          'date',
          'Fecha',
          today(),
          'date',
          `required max="${today()}"`
        ) +
        field(
          'title',
          'Título / procedimiento',
          '',
          'text',
          'required'
        ) +
        field(
          'weight',
          'Peso (kg)',
          find('pets', petId).weight,
          'number',
          'min="0.01" step="0.01"'
        ) +
        field('diagnosis', 'Diagnóstico / resultado') +
        area('info', 'Información clínica y observaciones') +
        field(
          'nextDate',
          'Próximo cuidado (genera recordatorio)',
          '',
          'date',
          `min="${today()}"`
        ) +
        select(
          'visible',
          'Visibilidad',
          [
            [true, 'Compartir con propietario'],
            [false, 'Nota interna']
          ],
          true
        ),
        petId + '|' + appointmentId
      )}
    `
  );
}

// IDENTIFICACIÓN QR SIMULADA

function qrSvg(pet) {
  let state = 2166136261;

  for (const character of pet.qr) {
    state = Math.imul(
      state ^ character.charCodeAt(0),
      16777619
    );
  }

  const bit = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state & 1;
  };

  let rectangles = '';

  for (let y = 0; y < 29; y++) {
    for (let x = 0; x < 29; x++) {
      const origins = [
        [0, 0],
        [22, 0],
        [0, 22]
      ];

      const finder = origins.find(([a, b]) =>
        x >= a &&
        x < a + 7 &&
        y >= b &&
        y < b + 7
      );

      let on;

      if (finder) {
        const dx = x - finder[0];
        const dy = y - finder[1];

        on =
          dx === 0 ||
          dx === 6 ||
          dy === 0 ||
          dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      } else {
        on = bit();
      }

      if (on) {
        rectangles += `
          <rect x="${x + 4}" y="${y + 4}" width="1" height="1"/>
        `;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37">
      <rect width="37" height="37" fill="white"/>
      <g fill="#174f4a">${rectangles}</g>
    </svg>
  `;
}

function showQR(id, print = false) {
  const pet = find('pets', id);

  if (!canPet(pet)) return;

  modal(
    'Identificación de mascota',
    `
      <div class="center">
        <h2>${esc(pet.name)}</h2>
        <div class="qr">${qrSvg(pet)}</div>

        <p>
          <b>QR simulado · No escaneable con cámara</b><br>
          <small>Identificador único: ${esc(pet.qr)}</small>
        </p>

        <p class="muted">
          La imagen representa únicamente el identificador.
          No contiene la historia clínica.
        </p>

        <div class="row">
          ${button('Simular escaneo', 'scan', pet.id, 'primary')}
          ${button('Vista pública', 'public', pet.id)}
          ${button('Descargar QR simulado', 'download-qr', pet.id)}
          ${button('Imprimir', 'print')}
        </div>
      </div>
    `
  );

  if (print) window.print();
}

function publicProfile(id) {
  const pet = find('pets', id);

  if (!pet) return;

  modal(
    'Identificación pública',
    `
      <div class="center">
        ${petPhoto(pet, true)}
        <h2>${esc(pet.name)}</h2>
        <p>${esc(pet.breed)}</p>
        <p>Esta mascota pertenece a una cuenta registrada.</p>
        ${button('Iniciar sesión', 'public-login', pet.qr, 'primary')}
      </div>
    `
  );
}

// PERSISTENCIA DE FORMULARIOS

function pushNotification(appointment, message) {
  db.notifications.push({
    id: uid(),
    message,
    ownerId: appointment.ownerId,
    vetId: appointment.vetId,
    date: new Date().toISOString(),
    readBy: []
  });
}

async function imageData(file) {
  if (!file || !file.size) return '';

  if (file.size > 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 1 MB.');
  }

  if (![
    'image/png',
    'image/jpeg',
    'image/webp'
  ].includes(file.type)) {
    throw new Error('Usá una imagen PNG, JPG o WebP.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error('No se pudo leer la imagen.'));

    reader.readAsDataURL(file);
  });
}

async function clinicData(form) {
  const data = Object.fromEntries(new FormData(form));

  data.days = new FormData(form)
    .getAll('days')
    .map(Number);

  if (!data.days.length) {
    throw new Error('Seleccioná al menos un día de atención.');
  }

  if (data.start >= data.end) {
    throw new Error('El cierre debe ser posterior a la apertura.');
  }

  data.duration = Number(data.duration);

  data.logo =
    await imageData(form.elements.logo.files[0]) ||
    db.config?.logo ||
    draft.config?.logo ||
    '';

  return data;
}

async function saveEntity(form) {
  const [collection, id] = form.dataset.id.split(':');

  if (!mayEdit(collection, id)) {
    return fail('No tenés permiso.');
  }

  const old = id ? find(collection, id) : null;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim();
    }
  });

  if (form.elements.photo) {
    data.photo =
      await imageData(form.elements.photo.files[0]) ||
      old?.photo ||
      '';
  }

  if (collection === 'pets') {
    data.weight = Number(data.weight);

    if (!find('owners', data.ownerId)?.active) {
      return fail('Seleccioná un propietario activo.');
    }

    data.qr = old?.qr || uid();
  }

  if (collection === 'owners') {
    if (!/^[0-9]{8}$/.test(data.dni || '')) {
      return fail('El DNI debe tener exactamente 8 números.');
    }

    if (
      db.owners.some(owner =>
        owner.dni === data.dni && owner.id !== id
      )
    ) {
      return fail('Ya existe un propietario con ese DNI.');
    }
  }

  if (collection === 'vets') {
    data.serviceIds = formData.getAll('serviceIds');

    if (db.vets.some(vet =>
      vet.license === data.license && vet.id !== id
    )) {
      return fail('La matrícula ya está registrada.');
    }

    if (
      !id &&
      db.users.some(account =>
        account.email.toLowerCase() === data.email.toLowerCase()
      )
    ) {
      return fail('Ese correo ya tiene una cuenta.');
    }
  }

  if (collection === 'services') {
    data.duration = Number(data.duration);
    data.price = Number(data.price);

    if (!Number.isFinite(data.price) || data.price < 0) {
      return fail('El precio debe ser un número mayor o igual a 0.');
    }

    data.price = Math.round(data.price * 100) / 100;
  }

  if (collection === 'schedules') {
    data.day = Number(data.day);
    data.duration = Number(data.duration);

    if (
      !find('vets', data.vetId)?.serviceIds.includes(data.serviceId)
    ) {
      return fail(
        'Asigná primero ese servicio al veterinario desde Servicios o Veterinarios.'
      );
    }

    if (
      data.start >= data.end ||
      minutes(data.end) - minutes(data.start) < data.duration
    ) {
      return fail('La franja debe permitir al menos un turno completo.');
    }

    if (
      !db.config.days.map(Number).includes(data.day) ||
      data.start < db.config.start ||
      data.end > db.config.end
    ) {
      return fail(
        'La franja debe estar dentro de los días y horarios generales de atención.'
      );
    }

    if (db.schedules.some(schedule =>
      schedule.id !== id &&
      schedule.active &&
      schedule.vetId === data.vetId &&
      schedule.serviceId === data.serviceId &&
      Number(schedule.day) === data.day &&
      data.start < schedule.end &&
      data.end > schedule.start
    )) {
      return fail(
        'Ya existe una franja superpuesta para este profesional y servicio.'
      );
    }
  }

  if (collection === 'products') {
    data.price = Number(data.price);
    data.stock = Number(data.stock);
  }

  if (collection === 'notices') {
    data.active = data.active === 'true';

    if (!data.message) {
      return fail('Escribí el mensaje del aviso.');
    }

    if (data.expires && data.expires < data.date) {
      return fail(
        'La expiración debe ser posterior a la publicación.'
      );
    }
  }

  if (collection === 'users') {
    data.role = old?.principal ? 'admin' : data.role;

    if (db.users.some(account =>
      account.id !== id &&
      account.email.toLowerCase() === data.email.toLowerCase()
    )) {
      return fail('Ese usuario ya existe.');
    }

    if (
      (data.role === 'vet' && !data.vetId) ||
      (data.role === 'owner' && !data.ownerId)
    ) {
      return fail('Vinculá la cuenta al perfil correspondiente.');
    }

    if (
      data.role === 'vet' &&
      db.users.some(account =>
        account.id !== id &&
        account.role === 'vet' &&
        account.vetId === data.vetId
      )
    ) {
      return fail('Este veterinario ya tiene una cuenta individual.');
    }

    if (id === user.id && data.role !== user.role) {
      return fail('No podés cambiar tu propio rol durante la sesión.');
    }

    if (!data.password) {
      delete data.password;
    }
  }

  const newId = id || uid();

  const ok = commit(() => {
    const row = {
      active: true,
      ...old,
      ...data,
      id: newId
    };

    if (collection === 'vets') {
      delete row.email;
      delete row.password;
    }

    if (old) {
      Object.assign(old, row);
    } else {
      db[collection].push(row);
    }

    if (collection === 'vets' && !id) {
      db.users.push({
        id: uid(),
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'vet',
        vetId: newId,
        active: true
      });
    }

    if (collection === 'services') {
      const assigned = formData.getAll('vetIds');

      db.vets.forEach(vet => {
        vet.serviceIds = vet.serviceIds.filter(
          serviceId => serviceId !== newId
        );

        if (assigned.includes(vet.id)) {
          vet.serviceIds.push(newId);
        }
      });
    }

    if (collection === 'users' && id === user.id) {
      user = find('users', id);
    }
  });

  if (ok) {
    close();
    shell();
    toast('Registro guardado correctamente.');
  }
}

// ENVÍO DE FORMULARIOS

async function submitForm(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  switch (form.dataset.form) {
    case 'setup':
      draft.config = await clinicData(form);
      authStep = 1;
      setup();
      break;

    case 'verify':
      if (data.code !== CODE) {
        return fail('El código de verificación es incorrecto.');
      }

      if (authStep === 1) {
        authStep = 2;
        setup();
      } else if (authStep === 3) {
        db = seed(draft.config, draft.admin);

        if (persist()) {
          authStep = 4;
          setup();
        }
      }
      break;

    case 'admin':
      if (data.password !== data.confirm) {
        return fail('Las contraseñas no coinciden.');
      }

      draft.admin = {
        name: data.first.trim() + ' ' + data.last.trim(),
        email: data.email.trim(),
        password: data.password
      };

      authStep = 3;
      setup();
      break;

    case 'login': {
      const account = db.users.find(item =>
        item.active &&
        item.email.toLowerCase() === data.email.trim().toLowerCase() &&
        item.password === data.password
      );

      if (
        !account ||
        (
          account.role === 'vet' &&
          !find('vets', account.vetId)?.active
        ) ||
        (
          account.role === 'owner' &&
          !find('owners', account.ownerId)?.active
        )
      ) {
        return fail(
          'Las credenciales son incorrectas o la cuenta está inactiva.'
        );
      }

      user = account;

      commit(() => {
        account.lastAccess = new Date().toISOString();
      });

      try {
        if (data.remember) {
          localStorage.setItem(KEY + '-email', account.email);
        } else {
          localStorage.removeItem(KEY + '-email');
        }
      } catch {
        // El inicio de sesión puede continuar sin recordar el usuario.
      }

      const qr = new URLSearchParams(
        location.hash.slice(1)
      ).get('qr');

      const pet = db.pets.find(item => item.qr === qr);

      if (pet && canPet(pet)) {
        navigate('pet', pet.id);
      } else {
        navigate(user.role === 'owner' ? 'pets' : 'home');
      }
      break;
    }

    case 'recover':
      if (!recovery) {
        const account = db.users.find(item =>
          item.email.toLowerCase() === data.contact.trim().toLowerCase() ||
          (
            item.ownerId &&
            find('owners', item.ownerId)?.phone === data.contact.trim()
          )
        );

        if (!account) {
          return fail('No se encontró una cuenta para ese contacto.');
        }

        recovery = {
          id: account.id,
          verified: false
        };

        recoverScreen();
      } else if (!recovery.verified) {
        if (data.code !== CODE) {
          return fail('El código de verificación es incorrecto.');
        }

        recovery.verified = true;
        recoverScreen();
      } else {
        if (data.password !== data.confirm) {
          return fail('Las contraseñas no coinciden.');
        }

        if (commit(() => {
          find('users', recovery.id).password = data.password;
        })) {
          login();
          toast('Contraseña actualizada correctamente.');
        }
      }
      break;

    case 'settings':
      if (user.role !== 'admin') return;

      if (commit(() => {
        db.config = draft.nextConfig;
      })) {
        shell();
        toast('Configuración actualizada.');
      }
      break;

    case 'entity':
      await saveEntity(form);
      break;

    case 'booking': {
      const appointment = form.dataset.id
        ? appts().find(item => item.id === form.dataset.id)
        : null;

      if (form.dataset.id && !appointment) {
        return fail('Turno no disponible.');
      }

      if (
        appointment &&
        ['Atendido', 'Cancelado'].includes(appointment.status)
      ) {
        return fail('Este turno no admite reprogramación.');
      }

      const pet = find('pets', data.petId);

      if (
        !canPet(pet) ||
        !pet.active ||
        !find('owners', pet.ownerId)?.active
      ) {
        return fail('Mascota no disponible.');
      }

      if (user.role === 'vet' && data.vetId !== user.vetId) {
        return fail('Elegí tu agenda profesional.');
      }

      const slot = slots(
        data.serviceId,
        data.vetId,
        data.date,
        data.petId,
        appointment?.id
      ).find(item => item.time === data.time);

      if (!slot) {
        return fail(
          'El horario seleccionado ya está ocupado o no está disponible.'
        );
      }

      const row = {
        ...data,
        id: appointment?.id || uid(),
        ownerId: pet.ownerId,
        duration: slot.duration,
        status: user.role === 'owner' ? 'Pendiente' : 'Confirmado'
      };

      if (commit(() => {
        if (appointment) {
          Object.assign(appointment, row);
        } else {
          db.appointments.push(row);
        }

        pushNotification(
          row,
          `${appointment ? 'Turno reprogramado' : 'Nuevo turno'} de ${pet.name}: ${pretty(row.date)} a las ${row.time}. Estado: ${row.status}.`
        );
      })) {
        close();
        navigate('agenda');
        agendaDate = row.date;
        renderContent();

        toast(
          row.status === 'Pendiente'
            ? 'Solicitud de turno registrada.'
            : 'Turno confirmado.'
        );
      }
      break;
    }

    case 'clinical': {
      if (user.role === 'owner') return;

      const [petId, appointmentId] = form.dataset.id.split('|');
      const pet = find('pets', petId);

      if (!canPet(pet)) return;

      const appointment = appointmentId
        ? appts().find(item => item.id === appointmentId)
        : null;

      if (
        appointmentId &&
        (!appointment || appointment.status !== 'Confirmado')
      ) {
        return fail('El turno ya no está confirmado.');
      }

      if (!data.info.trim()) {
        return fail('Ingresá la información clínica.');
      }

      if (commit(() => {
        db.clinical.push({
          ...data,
          id: uid(),
          petId,
          weight: Number(data.weight) || pet.weight,
          visible: data.visible === 'true',
          authorId: user.id,
          authorName: user.name,
          vetId: user.vetId || null
        });

        if (data.weight) {
          pet.weight = Number(data.weight);
        }

        if (data.nextDate) {
          db.reminders.push({
            id: uid(),
            petId,
            title: data.title + ' · ' + pet.name,
            date: data.nextDate,
            done: false
          });
        }

        if (appointment) {
          appointment.status = 'Atendido';

          pushNotification(
            appointment,
            `La atención de ${pet.name} fue registrada.`
          );
        }
      })) {
        close();
        navigate('pet', petId);
        petTab = 'Historia clínica';
        renderContent();
        toast('Atención registrada correctamente.');

        if (
          appointment &&
          canCreateTicket() &&
          (user.role !== 'vet' || appointment.vetId === user.vetId) &&
          !activeTicketForAppointment(appointment.id)
        ) {
          modal(
            'Atención registrada',
            `
              <p>
                La atención de <b>${esc(pet.name)}</b> quedó registrada.
                ¿Querés generar el ticket de cobro ahora?
              </p>
              <div class="form-actions">
                ${button('Ahora no', 'close')}
                ${button('Generar ticket', 'ticket-new', appointment.id, 'primary')}
              </div>
            `
          );
        }
      }
      break;
    }

    case 'ticket':
      await saveTicket(form);
      break;

    case 'ticket-void': {
      const ticket = (db.tickets || []).find(
        item => item.id === form.dataset.id
      );

      if (!ticket || user.role !== 'admin') {
        return fail('No tenés permisos para anular tickets.');
      }

      const reason = String(data.reason || '').trim();

      if (!reason) {
        return fail('El motivo de anulación es obligatorio.');
      }

      draft.voidTicket = { id: ticket.id, reason };
      voidTicketConfirm(ticket.id);
      break;
    }

    case 'inline-owner': {
      if (!mayEdit('owners')) return;

      const owner = {
        ...data,
        id: uid(),
        active: true
      };

      if (typeof owner.dni === 'string') {
        owner.dni = owner.dni.trim();
      }

      if (!/^[0-9]{8}$/.test(owner.dni || '')) {
        return fail('El DNI debe tener exactamente 8 números.');
      }

      if (db.owners.some(item => item.dni === owner.dni)) {
        return fail('Ya existe un propietario con ese DNI.');
      }

      if (commit(() => db.owners.push(owner))) {
        editForm('pets', '', {
          ...draft.pet,
          ownerId: owner.id
        });

        toast('Propietario creado. Completá la mascota.');
      }
      break;
    }

    case 'reset-password':
      if (user.role !== 'admin') return;

      if (data.password !== data.confirm) {
        return fail('Las contraseñas no coinciden.');
      }

      if (commit(() => {
        find('users', form.dataset.id).password = data.password;
      })) {
        close();
        toast('Contraseña restablecida.');
      }
      break;
  }
}

// ACCIONES DE BOTONES

async function action(actionName, id, element) {
  switch (actionName) {
    case 'close':
      close();
      break;

    case 'resend':
      toast('Código simulado reenviado: ' + CODE);
      break;

    case 'login':
      login();
      break;

    case 'recover':
      recovery = null;
      recoverScreen();
      break;

    case 'show-password': {
      const input = $('input[name=password]');

      input.type = input.type === 'password'
        ? 'text'
        : 'password';

      element.textContent = input.type === 'password'
        ? 'Mostrar contraseña'
        : 'Ocultar contraseña';
      break;
    }

    case 'demo': {
      const form = $('form[data-form=login]');
      form.elements.email.value = id;
      form.elements.password.value = '123456';
      break;
    }

    case 'logout':
      user = null;
      selectedPet = null;
      agendaVet = '';
      close();

      history.replaceState(
        null,
        '',
        location.pathname + location.search
      );

      login();
      break;

    case 'menu':
      $('.sidebar').classList.toggle('open');
      break;

    case 'theme':
      toggleTheme();
      break;

    case 'account': {
      if ($('.account-menu')) {
        return $('.account-menu').remove();
      }

      const menu = document.createElement('div');
      menu.className = 'account-menu';

      menu.innerHTML = `
        <b>${esc(user.name)}</b>
        <p><small>${roleNames[user.role]}</small></p>

        ${
          user.role === 'owner'
            ? button('Mi perfil', 'nav', 'ownerProfile')
            : ''
        }

        ${button('Cerrar sesión', 'logout')}
      `;

      $('.topbar').append(menu);
      break;
    }

    case 'nav':
      if (allowed[user.role].includes(id)) {
        navigate(id);
      }
      break;

    case 'pet':
    case 'owner':
    case 'vet':
      close();
      navigate(actionName, id);
      break;

    case 'tab':
      petTab = id;
      renderContent();
      break;

    case 'page':
      page = Number(id);
      renderContent();
      break;

    case 'create':
      editForm(id);
      break;

    case 'edit': {
      const [collection, recordId] = id.split(':');
      editForm(collection, recordId);
      break;
    }

    case 'pet-owner':
      editForm('pets', '', { ownerId: id });
      break;

    case 'inline-owner':
      draft.pet = Object.fromEntries(
        new FormData($('#modal form'))
      );

      delete draft.pet.photo;

      modal(
        'Registrar propietario',
        formWrap(
          'inline-owner',
          field('name', 'Nombre y apellido', '', 'text', 'required') +
          field(
            'dni',
            'DNI',
            '',
            'text',
            'required pattern="[0-9]{8}" minlength="8" maxlength="8" inputmode="numeric" title="El DNI debe tener 8 números" oninput="this.value=this.value.replace(/[^0-9]/g,\'\').slice(0,8)"'
          ) +
          field('phone', 'Teléfono', '', 'tel', 'required') +
          field('email', 'Correo', '', 'email', 'required') +
          field('address', 'Dirección', '', 'text', 'required')
        )
      );
      break;

    case 'toggle': {
      const [collection, recordId] = id.split(':');

      if (!mayEdit(collection, recordId)) return;

      const row = find(collection, recordId);

      if (!row) return;

      if (
        collection === 'users' &&
        (row.id === user.id || row.principal)
      ) {
        return toast(
          'No se puede desactivar al administrador principal ni tu propia cuenta.'
        );
      }

      modal(
        row.active ? 'Desactivar registro' : 'Activar registro',
        `
          <p>
            ¿Querés ${row.active ? 'desactivar' : 'activar'}
            ${esc(row.name || row.title || 'este horario')}?
          </p>

          <p class="muted">
            Se conservará el historial de los registros vinculados.
          </p>

          <div class="form-actions">
            ${button('Volver', 'close')}
            ${button('Confirmar', 'toggle-confirm', id, 'primary')}
          </div>
        `
      );
      break;
    }

    case 'toggle-confirm': {
      const [collection, recordId] = id.split(':');

      if (!mayEdit(collection, recordId)) return;

      const row = find(collection, recordId);

      if (
        !row ||
        (
          collection === 'users' &&
          (row.principal || row.id === user.id)
        )
      ) {
        return;
      }

      if (commit(() => {
        row.active = !row.active;
      })) {
        close();
        shell();
        toast('Estado actualizado.');
      }
      break;
    }

    case 'delete-notice':
      if (user.role === 'admin') {
        modal(
          'Eliminar aviso',
          `
            <p>¿Querés eliminar este aviso?</p>

            <div class="form-actions">
              ${button('Volver', 'close')}
              ${button(
                'Eliminar',
                'delete-notice-confirm',
                id,
                'danger'
              )}
            </div>
          `
        );
      }
      break;

    case 'delete-notice-confirm':
      if (
        user.role === 'admin' &&
        commit(() => {
          db.notices = db.notices.filter(notice => notice.id !== id);
        })
      ) {
        close();
        shell();
        toast('Aviso eliminado.');
      }
      break;

    case 'book':
      book(id);
      break;

    case 'appointment':
      appointmentDetails(id);
      break;

    case 'reschedule':
      book('', id);
      break;

    case 'vet-agenda':
      if (user.role === 'admin') {
        agendaVet = id;
        navigate('agenda');
      }
      break;

    case 'cancel-appointment':
      modal(
        'Cancelar turno',
        `
          <p>
            ¿Querés cancelar este turno?
            El horario quedará disponible.
          </p>

          <div class="form-actions">
            ${button('Volver', 'close')}
            ${button('Cancelar turno', 'cancel-confirm', id, 'danger')}
          </div>
        `
      );
      break;

    case 'cancel-confirm':
    case 'confirm-appointment': {
      const appointment = appts().find(item => item.id === id);

      if (
        !appointment ||
        ['Atendido', 'Cancelado'].includes(appointment.status) ||
        (
          actionName === 'confirm-appointment' &&
          user.role === 'owner'
        )
      ) {
        return;
      }

      const status = actionName === 'cancel-confirm'
        ? 'Cancelado'
        : 'Confirmado';

      if (commit(() => {
        appointment.status = status;

        pushNotification(
          appointment,
          `Tu turno de ${label('pets', appointment.petId)} del ${pretty(appointment.date)} a las ${appointment.time} fue ${status.toLowerCase()}.`
        );
      })) {
        close();
        shell();
        toast('Turno ' + status.toLowerCase() + '.');
      }
      break;
    }

    case 'attend': {
      const appointment = appts().find(item => item.id === id);

      if (appointment && user.role !== 'owner') {
        clinicalForm(appointment.petId, id);
      }
      break;
    }

    case 'clinical':
      clinicalForm(id);
      break;

    case 'read':
      if (commit(() => {
        const notification = notifications().find(item => item.id === id);

        if (
          notification &&
          !notification.readBy.includes(user.id)
        ) {
          notification.readBy.push(user.id);
        }
      })) {
        shell();
      }
      break;

    case 'read-all':
      if (commit(() => {
        notifications().forEach(notification => {
          if (!notification.readBy.includes(user.id)) {
            notification.readBy.push(user.id);
          }
        });
      })) {
        shell();
      }
      break;

    case 'reminder-done':
      if (
        user.role !== 'owner' &&
        commit(() => {
          const reminder = reminderList().find(item => item.id === id);

          if (reminder) {
            reminder.done = !reminder.done;
          }
        })
      ) {
        shell();
      }
      break;

    case 'qr':
      showQR(id);
      break;

    case 'print-qr':
      showQR(id, true);
      break;

    case 'print':
      window.print();
      break;

    case 'download-qr': {
      const pet = find('pets', id);

      if (!canPet(pet)) return;

      const url = URL.createObjectURL(
        new Blob([qrSvg(pet)], { type: 'image/svg+xml' })
      );

      const link = document.createElement('a');

      link.href = url;
      link.download =
        'QR-simulado-' +
        pet.name.replace(/[^a-z0-9]/gi, '-') +
        '.svg';

      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
      break;
    }

    case 'scan': {
      const pet = id
        ? find('pets', id)
        : pets().find(item => item.active);

      if (!pet) {
        return toast(
          'No hay una mascota disponible para el escaneo.'
        );
      }

      close();

      if (canPet(pet)) {
        navigate('pet', pet.id);
      } else {
        publicProfile(pet.id);
      }
      break;
    }

    case 'public':
      publicProfile(id);
      break;

    case 'public-login':
      user = null;
      close();

      history.replaceState(
        null,
        '',
        location.pathname +
        location.search +
        '#qr=' +
        encodeURIComponent(id)
      );

      login();
      break;

    case 'reset-password':
      if (user.role === 'admin') {
        modal(
          'Restablecer contraseña (simulado)',
          formWrap(
            'reset-password',
            field(
              'password',
              'Nueva contraseña',
              '',
              'password',
              'required minlength="6"'
            ) +
            field(
              'confirm',
              'Confirmar contraseña',
              '',
              'password',
              'required minlength="6"'
            ),
            id
          )
        );
      }
      break;

    case 'ticket-new':
      ticketForm(id);
      break;

    case 'ticket-create':
      ticketForm('');
      break;

    case 'ticket-pet': {
      const pet = find('pets', id);

      if (!pet || !canCreateTicket() || !canPet(pet)) {
        return toast('No se puede generar el ticket.');
      }

      ticketForm('', { ownerId: pet.ownerId, petId: pet.id });
      break;
    }

    case 'ticket-owner': {
      const owner = find('owners', id);

      if (!owner || !canCreateTicket()) {
        return toast('No se puede generar el ticket.');
      }

      ticketForm('', { ownerId: owner.id });
      break;
    }

    case 'ticket-view':
      ticketView(id);
      break;

    case 'ticket-print':
      ticketPrint(id);
      break;

    case 'ticket-void':
      voidTicketForm(id);
      break;

    case 'ticket-void-confirm':
      voidTicketConfirm(id);
      break;

    case 'void-confirm':
      doVoidTicket(id);
      break;

    case 'ticket-add':
      ticketAddRow(id);
      break;

    case 'ticket-remove': {
      const row = element?.closest('.ticket-row');

      if (row) {
        row.remove();
        ticketRecalc();
      }
      break;
    }

    case 'billing-export':
      billingExport();
      break;

    case 'income-day':
      incomeDay = incomeDay === id ? '' : id;
      renderContent();
      break;
  }
}

// CAJA, TICKETS E INGRESOS

const PAYMENT_METHODS = [
  'Efectivo',
  'Transferencia',
  'Débito',
  'Crédito',
  'Mercado Pago'
];

function demoPastAppointments() {
  return [
    {
      id: 'appt-demo-a',
      petId: 'p1',
      ownerId: 'o1',
      serviceId: 's1',
      vetId: 'v1',
      date: addDays(today(), -4),
      time: '10:00',
      duration: 30,
      status: 'Atendido',
      reason: 'Control general',
      observations: ''
    },
    {
      id: 'appt-demo-b',
      petId: 'p4',
      ownerId: 'o2',
      serviceId: 's3',
      vetId: 'v2',
      date: addDays(today(), -8),
      time: '11:00',
      duration: 30,
      status: 'Atendido',
      reason: 'Vacunación anual',
      observations: ''
    },
    {
      id: 'appt-demo-c',
      petId: 'p6',
      ownerId: 'o3',
      serviceId: 's1',
      vetId: 'v4',
      date: addDays(today(), -12),
      time: '09:30',
      duration: 30,
      status: 'Atendido',
      reason: 'Consulta general',
      observations: ''
    },
    {
      id: 'appt-demo-d',
      petId: 'p2',
      ownerId: 'o1',
      serviceId: 's1',
      vetId: 'v1',
      date: addDays(today(), -18),
      time: '10:30',
      duration: 30,
      status: 'Atendido',
      reason: 'Consulta general',
      observations: ''
    }
  ];
}

function buildDemoTickets() {
  const at = (daysAgo, time) =>
    new Date(addDays(today(), daysAgo) + 'T' + time + ':00').toISOString();

  const rows = [
    {
      daysAgo: 28,
      time: '10:15',
      appointmentId: '',
      ownerId: 'o2',
      petId: 'p4',
      vetId: 'v2',
      items: [
        { type: 'service', refId: 's3', name: 'Vacunación', qty: 1, unitPrice: 12000 },
        { type: 'product', refId: 'pr2', name: 'Pipeta para perros', qty: 1, unitPrice: 7200 }
      ],
      discount: 0,
      paymentMethod: 'Efectivo',
      status: 'Pagado',
      notes: '',
      createdBy: 'u-v2',
      createdByName: 'Diego García'
    },
    {
      daysAgo: 18,
      time: '10:30',
      appointmentId: 'appt-demo-d',
      ownerId: 'o1',
      petId: 'p2',
      vetId: 'v1',
      items: [
        { type: 'service', refId: 's1', name: 'Consulta clínica', qty: 1, unitPrice: 15000 }
      ],
      discount: 0,
      paymentMethod: 'Transferencia',
      status: 'Pagado',
      notes: '',
      createdBy: 'u-v1',
      createdByName: 'Lucía Martínez'
    },
    {
      daysAgo: 21,
      time: '11:00',
      appointmentId: '',
      ownerId: 'o2',
      petId: 'p5',
      vetId: 'v2',
      items: [
        { type: 'service', refId: 's5', name: 'Desparasitación', qty: 1, unitPrice: 8000 }
      ],
      discount: 0,
      paymentMethod: 'Mercado Pago',
      status: 'Pendiente',
      notes: '',
      createdBy: 'u-v2',
      createdByName: 'Diego García'
    },
    {
      daysAgo: 12,
      time: '09:30',
      appointmentId: 'appt-demo-c',
      ownerId: 'o3',
      petId: 'p6',
      vetId: 'v4',
      items: [
        { type: 'service', refId: 's1', name: 'Consulta clínica', qty: 1, unitPrice: 15000 },
        { type: 'custom', refId: '', name: 'Certificado de salud', qty: 1, unitPrice: 5000 }
      ],
      discount: 0,
      paymentMethod: 'Efectivo',
      status: 'Pagado',
      notes: '',
      createdBy: 'u-v4',
      createdByName: 'Pablo Rodríguez'
    },
    {
      daysAgo: 15,
      time: '12:30',
      appointmentId: '',
      ownerId: 'o1',
      petId: 'p3',
      vetId: 'v3',
      items: [
        { type: 'service', refId: 's2', name: 'Ecografía', qty: 1, unitPrice: 28000 }
      ],
      discount: 0,
      paymentMethod: 'Crédito',
      status: 'Anulado',
      notes: 'Ticket anulado de demostración.',
      createdBy: 'u-v3',
      createdByName: 'Ana López',
      voidReason: 'Error en el medio de pago.'
    },
    {
      daysAgo: 8,
      time: '16:20',
      appointmentId: 'appt-demo-b',
      ownerId: 'o2',
      petId: 'p4',
      vetId: 'v2',
      items: [
        { type: 'service', refId: 's3', name: 'Vacunación', qty: 1, unitPrice: 12000 },
        { type: 'product', refId: 'pr1', name: 'Alimento adulto balanceado', qty: 1, unitPrice: 18500 }
      ],
      discount: 1500,
      paymentMethod: 'Transferencia',
      status: 'Pagado',
      notes: '',
      createdBy: 'u-v2',
      createdByName: 'Diego García'
    },
    {
      daysAgo: 5,
      time: '10:00',
      appointmentId: '',
      ownerId: 'o1',
      petId: 'p3',
      vetId: 'v1',
      items: [
        { type: 'service', refId: 's2', name: 'Ecografía', qty: 1, unitPrice: 28000 }
      ],
      discount: 0,
      paymentMethod: 'Débito',
      status: 'Pagado',
      notes: '',
      createdBy: 'u-v1',
      createdByName: 'Lucía Martínez'
    },
    {
      daysAgo: 0,
      time: null,
      appointmentId: '',
      ownerId: 'o1',
      petId: 'p1',
      vetId: 'v1',
      items: [
        { type: 'service', refId: 's1', name: 'Consulta clínica', qty: 1, unitPrice: 15000 },
        { type: 'product', refId: 'pr2', name: 'Pipeta para perros', qty: 1, unitPrice: 7200 }
      ],
      discount: 0,
      paymentMethod: 'Efectivo',
      status: 'Pagado',
      notes: '',
      createdBy: 'u-v1',
      createdByName: 'Lucía Martínez'
    },
    {
      daysAgo: 0,
      time: null,
      appointmentId: '',
      ownerId: 'o2',
      petId: 'p5',
      vetId: 'v2',
      items: [
        { type: 'service', refId: 's4', name: 'Control', qty: 1, unitPrice: 9000 },
        { type: 'product', refId: 'pr2', name: 'Pipeta para perros', qty: 1, unitPrice: 7200 }
      ],
      discount: 0,
      paymentMethod: 'Débito',
      status: 'Pagado',
      notes: '',
      createdBy: 'u-v2',
      createdByName: 'Diego García'
    },
    {
      daysAgo: 0,
      time: null,
      appointmentId: '',
      ownerId: '',
      petId: '',
      vetId: 'v4',
      items: [
        { type: 'service', refId: 's4', name: 'Control', qty: 1, unitPrice: 9000 },
        { type: 'custom', refId: '', name: 'Collar isabelino', qty: 1, unitPrice: 3500 }
      ],
      discount: 0,
      paymentMethod: 'Efectivo',
      status: 'Pagado',
      notes: 'Venta de mostrador.',
      createdBy: 'u-v4',
      createdByName: 'Pablo Rodríguez'
    }
  ];

  return rows.map((row, index) => {
    const subtotal = round2(
      row.items.reduce(
        (sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
        0
      )
    );

    return {
      id: uid(),
      number: ticketNumber(index + 1),
      date: addDays(today(), -row.daysAgo),
      createdAt: row.time ? at(row.daysAgo, row.time) : new Date().toISOString(),
      appointmentId: row.appointmentId,
      ownerId: row.ownerId,
      petId: row.petId,
      vetId: row.vetId,
      items: row.items,
      subtotal,
      discount: row.discount,
      total: round2(subtotal - row.discount),
      paymentMethod: row.paymentMethod,
      status: row.status,
      notes: row.notes,
      createdBy: row.createdBy,
      createdByName: row.createdByName,
      voidReason: row.voidReason || '',
      voidedAt: row.status === 'Anulado'
        ? at(Math.max(0, row.daysAgo - 1), row.time || '09:00')
        : ''
    };
  });
}

function resetDemoTickets() {
  if (!db?.configured) {
    return 'No hay datos iniciales. Completá el setup primero.';
  }

  const demoTickets = buildDemoTickets();

  const ok = commit(() => {
    db.tickets = demoTickets;
    db.config.ticketSeq = demoTickets.length;

    demoPastAppointments().forEach(demo => {
      if (!find('appointments', demo.id)) {
        db.appointments.push({ ...demo });
      }
    });
  });

  if (ok && user) {
    shell();
  }

  return ok
    ? 'Tickets de demo regenerados: ' + demoTickets.length + ' tickets.'
    : 'No se pudo regenerar.';
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function ticketNumber(seq) {
  return '0001-' + String(seq).padStart(8, '0');
}

function activeTicketForAppointment(appointmentId) {
  if (!appointmentId) return null;

  return (db.tickets || []).find(ticket =>
    ticket.appointmentId === appointmentId && ticket.status !== 'Anulado'
  ) || null;
}

function canSeeTicket(ticket) {
  if (!user || !ticket) return false;
  if (user.role === 'admin') return true;

  if (user.role === 'vet') {
    return ticket.vetId === user.vetId || ticket.createdBy === user.id;
  }

  if (user.role === 'owner') {
    return Boolean(ticket.ownerId) && ticket.ownerId === user.ownerId;
  }

  return false;
}

function visibleTickets() {
  return (db.tickets || []).filter(canSeeTicket);
}

function canCreateTicket() {
  return Boolean(user) && ['admin', 'vet'].includes(user.role);
}

function appointmentTicketButtons(appointment) {
  if (
    !appointment ||
    !['Confirmado', 'Atendido'].includes(appointment.status) ||
    user.role === 'owner' ||
    !canCreateTicket()
  ) {
    return '';
  }

  if (user.role === 'vet' && appointment.vetId !== user.vetId) {
    return '';
  }

  const existing = activeTicketForAppointment(appointment.id);

  if (existing && canSeeTicket(existing)) {
    return button('Ver ticket', 'ticket-view', existing.id);
  }

  if (!existing) {
    return button('Generar ticket', 'ticket-new', appointment.id, 'primary');
  }

  return '';
}

function ticketOwnerPets(ownerId) {
  return db.pets.filter(pet =>
    pet.active && (!ownerId || pet.ownerId === ownerId)
  );
}

function ticketRowHTML(type = 'service', presetRef = '') {
  const index = ++ticketItemCount;
  const services = db.services.filter(service => service.active);
  const products = db.products.filter(
    product => product.active && Number(product.stock) > 0
  );
  const firstService = presetRef || services[0]?.id || '';
  const firstProduct = products[0]?.id || '';
  const refValue = type === 'product' ? firstProduct : firstService;
  const refService = find('services', refValue);
  const refProduct = find('products', refValue);
  const startPrice = type === 'product'
    ? refProduct?.price ?? 0
    : refService?.price ?? 0;
  const priceReadonly = type === 'service' && user.role !== 'admin';

  return `
    <div class="ticket-row" data-idx="${index}">
      <label class="field">
        Tipo
        <select name="itemType" class="ticket-type" aria-label="Tipo de ítem">
          <option value="service" ${type === 'service' ? 'selected' : ''}>Servicio</option>
          <option value="product" ${type === 'product' ? 'selected' : ''}>Producto</option>
          <option value="custom" ${type === 'custom' ? 'selected' : ''}>Ítem libre</option>
        </select>
      </label>
      <label class="field ticket-ref-wrap" ${type === 'custom' ? 'hidden' : ''}>
        Detalle
        <select name="itemRef" class="ticket-ref" aria-label="Detalle del ítem">
          ${type === 'product'
            ? products.map(product => `
              <option value="${esc(product.id)}" ${product.id === refValue ? 'selected' : ''}>
                ${esc(product.name)} · ${money(product.price)} (${Number(product.stock)} disp.)
              </option>
            `).join('')
            : services.map(service => `
              <option value="${esc(service.id)}" ${service.id === refValue ? 'selected' : ''}>
                ${esc(service.name)} · ${money(service.price || 0)}
              </option>
            `).join('')}
        </select>
      </label>
      <label class="field ticket-name-wrap" ${type === 'custom' ? '' : 'hidden'}>
        Nombre del ítem
        <input name="itemName" type="text" value="" maxlength="80" aria-label="Nombre del ítem libre">
      </label>
      <label class="field">
        Cant.
        <input name="itemQty" class="ticket-qty" type="number" value="1" min="1" step="1" required aria-label="Cantidad">
      </label>
      <label class="field">
        Precio ($)
        <input
          name="itemPrice"
          class="ticket-price"
          type="number"
          value="${esc(startPrice)}"
          min="0"
          step="0.01"
          required
          ${priceReadonly ? 'readonly' : ''}
          aria-label="Precio unitario"
        >
      </label>
      <div class="field">
        <span aria-hidden="true">&nbsp;</span>
        ${button('Quitar', 'ticket-remove', String(index), 'small danger')}
      </div>
    </div>
  `;
}

function ticketForm(appointmentId = '', preset = {}) {
  if (!canCreateTicket()) {
    return toast('No tenés permisos para generar tickets.');
  }

  const appointment = appointmentId
    ? db.appointments.find(item => item.id === appointmentId)
    : null;

  if (appointmentId && !appointment) {
    return toast('Turno no disponible.');
  }

  if (appointment) {
    if (
      user.role === 'vet' &&
      appointment.vetId !== user.vetId
    ) {
      return toast('No tenés permisos para facturar este turno.');
    }

    if (!['Confirmado', 'Atendido'].includes(appointment.status)) {
      return toast('Solo se puede facturar un turno confirmado o atendido.');
    }

    if (activeTicketForAppointment(appointment.id)) {
      return toast('Este turno ya tiene un ticket activo.');
    }
  }

  ticketItemCount = 0;

  const ownerId = appointment?.ownerId || preset.ownerId || '';
  const petId = appointment?.petId || preset.petId || '';
  const vetId = user.role === 'vet'
    ? user.vetId
    : appointment?.vetId || preset.vetId || '';
  const owner = ownerId ? find('owners', ownerId) : null;
  const pet = petId ? find('pets', petId) : null;
  const vet = vetId ? find('vets', vetId) : null;
  const owners = db.owners.filter(item => item.active);
  const petOptions = appointment
    ? (pet ? [[pet.id, pet.name]] : [])
    : [['', 'Sin mascota'], ...ticketOwnerPets(ownerId).map(item => [item.id, item.name + ' · ' + label('owners', item.ownerId)])];
  const vetOptions = [['', 'Sin asignar'], ...db.vets.filter(item => item.active).map(item => [item.id, item.name])];

  const head = appointment
    ? `
      <div class="hint">
        Turno ${esc(appointment.status.toLowerCase())}: <b>${esc(pet?.name || '')}</b> ·
        ${esc(label('services', appointment.serviceId))} ·
        ${pretty(appointment.date)} ${esc(appointment.time)}
      </div>
      <br>
      <input type="hidden" name="ownerId" value="${esc(ownerId)}">
      <input type="hidden" name="petId" value="${esc(petId)}">
      <input type="hidden" name="vetId" value="${esc(vetId)}">
      <p>
        <small>Propietario</small><br>
        <b>${esc(owner?.name || 'Cliente mostrador')}</b>
      </p>
      <p>
        <small>Mascota</small><br>
        <b>${esc(pet?.name || '—')}</b>
      </p>
      <p>
        <small>Profesional</small><br>
        <b>${esc(vet?.name || '—')}</b>
      </p>
    `
    : select(
      'ownerId',
      'Propietario',
      [['', 'Cliente mostrador'], ...owners.map(item => [item.id, item.name])],
      ownerId
    ) +
    select(
      'petId',
      'Mascota (opcional)',
      petOptions,
      pet && petOptions.some(([value]) => String(value) === String(pet.id)) ? pet.id : ''
    ) +
    select('vetId', 'Profesional (opcional)', vetOptions, vetId);

  modal(
    appointment ? 'Generar ticket del turno' : 'Nuevo ticket de mostrador',
    formWrap(
      'ticket',
      head +
      `
        <div class="full">
          <h3>Ítems</h3>
          <div id="ticket-items">
            ${ticketRowHTML('service', appointment?.serviceId || '')}
          </div>
          <div class="row">
            ${button('+ Servicio', 'ticket-add', 'service', 'small')}
            ${button('+ Producto', 'ticket-add', 'product', 'small')}
            ${button('+ Ítem libre', 'ticket-add', 'custom', 'small')}
          </div>
        </div>
      ` +
      field('discount', 'Descuento ($)', '0', 'number', 'min="0" step="0.01"') +
      select('paymentMethod', 'Medio de pago', PAYMENT_METHODS, 'Efectivo', 'required') +
      select('status', 'Estado', ['Pagado', 'Pendiente'], 'Pagado', 'required') +
      area('notes', 'Notas (opcional)', '') +
      `
        <div class="full">
          <div class="hint" id="ticket-total" role="status" aria-live="polite">Total: $0</div>
        </div>
      `,
      appointmentId
    )
  );

  ticketRecalc();
}

function ticketAddRow(type) {
  const container = $('#ticket-items');

  if (!container) return;

  container.insertAdjacentHTML(
    'beforeend',
    ticketRowHTML(['service', 'product', 'custom'].includes(type) ? type : 'service')
  );

  ticketRecalc();
}

function ticketUpdateRow(row) {
  const type = row.querySelector('.ticket-type').value;
  const refWrap = row.querySelector('.ticket-ref-wrap');
  const ref = row.querySelector('.ticket-ref');
  const nameWrap = row.querySelector('.ticket-name-wrap');
  const price = row.querySelector('.ticket-price');

  if (type === 'custom') {
    refWrap.hidden = true;
    nameWrap.hidden = false;
    price.readOnly = false;
    price.value = '0';
  } else {
    refWrap.hidden = false;
    nameWrap.hidden = true;

    if (type === 'product') {
      ref.innerHTML = db.products
        .filter(product => product.active && Number(product.stock) > 0)
        .map(product => `
          <option value="${esc(product.id)}">
            ${esc(product.name)} · ${money(product.price)} (${Number(product.stock)} disp.)
          </option>
        `).join('');

      const first = db.products.find(
        product => product.active && Number(product.stock) > 0
      );

      price.value = first?.price ?? 0;
      price.readOnly = true;
    } else {
      ref.innerHTML = db.services
        .filter(service => service.active)
        .map(service => `
          <option value="${esc(service.id)}">
            ${esc(service.name)} · ${money(service.price || 0)}
          </option>
        `).join('');

      const first = db.services.find(service => service.active);

      price.value = first?.price ?? 0;
      price.readOnly = user.role !== 'admin';
    }
  }
}

function ticketRecalc() {
  const form = $('#modal form[data-form=ticket]');
  const totalBox = $('#ticket-total');

  if (!form || !totalBox) return;

  let subtotal = 0;

  form.querySelectorAll('.ticket-row').forEach(row => {
    const qty = Number(row.querySelector('.ticket-qty')?.value || 0);
    const price = Number(row.querySelector('.ticket-price')?.value || 0);

    if (Number.isFinite(qty) && Number.isFinite(price) && qty > 0 && price >= 0) {
      subtotal += qty * price;
    }
  });

  const discount = Number(form.elements.discount?.value || 0);
  const total = Math.max(0, round2(subtotal) - (Number.isFinite(discount) ? discount : 0));

  totalBox.textContent = 'Subtotal: ' + money(round2(subtotal)) +
    ' · Descuento: ' + money(Number.isFinite(discount) ? discount : 0) +
    ' · Total: ' + money(total);
}

async function saveTicket(form) {
  if (!canCreateTicket()) {
    return fail('No tenés permisos para generar tickets.');
  }

  const appointmentId = form.dataset.id || '';
  const appointment = appointmentId
    ? db.appointments.find(item => item.id === appointmentId)
    : null;

  let ownerId = String(form.elements.ownerId?.value || '');
  let petId = String(form.elements.petId?.value || '');
  let vetId = String(form.elements.vetId?.value || '');

  if (appointment) {
    if (!['Confirmado', 'Atendido'].includes(appointment.status)) {
      return fail('Solo se puede facturar un turno confirmado o atendido.');
    }

    if (
      user.role === 'vet' &&
      appointment.vetId !== user.vetId
    ) {
      return fail('No tenés permisos para facturar este turno.');
    }

    if (activeTicketForAppointment(appointment.id)) {
      return fail('Este turno ya tiene un ticket activo.');
    }

    ownerId = appointment.ownerId;
    petId = appointment.petId;
    vetId = appointment.vetId;
  }

  if (user.role === 'vet') {
    vetId = user.vetId;
  }

  if (ownerId && !find('owners', ownerId)?.active) {
    return fail('Seleccioná un propietario activo o Cliente mostrador.');
  }

  if (petId) {
    const pet = find('pets', petId);

    if (!pet) {
      return fail('Mascota no disponible.');
    }

    if (ownerId && pet.ownerId !== ownerId) {
      return fail('La mascota no pertenece al propietario seleccionado.');
    }
  }

  if (vetId && !find('vets', vetId)) {
    return fail('Profesional no disponible.');
  }

  const rows = [...form.querySelectorAll('.ticket-row')];

  if (!rows.length) {
    return fail('Agregá al menos un ítem al ticket.');
  }

  const items = [];
  const needed = {};

  for (const row of rows) {
    const type = row.querySelector('.ticket-type')?.value;
    const refId = row.querySelector('.ticket-ref')?.value || '';
    const customName = String(
      row.querySelector('.ticket-name')?.value ||
      row.querySelector('[name=itemName]')?.value ||
      ''
    ).trim();
    const qty = Number(row.querySelector('.ticket-qty')?.value);
    const rawPrice = Number(row.querySelector('.ticket-price')?.value);

    if (!['service', 'product', 'custom'].includes(type)) {
      return fail('Tipo de ítem no válido.');
    }

    if (!Number.isInteger(qty) || qty < 1) {
      return fail('Las cantidades deben ser enteros mayores o iguales a 1.');
    }

    if (type === 'service') {
      const service = find('services', refId);

      if (!service) {
        return fail('Seleccioná un servicio válido.');
      }

      const unitPrice = user.role === 'admin' ? rawPrice : Number(service.price || 0);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return fail('Los precios deben ser mayores o iguales a 0.');
      }

      items.push({
        type: 'service',
        refId: service.id,
        name: service.name,
        qty,
        unitPrice: round2(unitPrice)
      });
    }

    if (type === 'product') {
      const product = find('products', refId);

      if (!product || !product.active) {
        return fail('Seleccioná un producto activo con stock.');
      }

      if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
        return fail('El producto tiene un precio no válido.');
      }

      needed[product.id] = (needed[product.id] || 0) + qty;

      items.push({
        type: 'product',
        refId: product.id,
        name: product.name,
        qty,
        unitPrice: round2(product.price)
      });
    }

    if (type === 'custom') {
      if (!customName) {
        return fail('El ítem libre necesita un nombre.');
      }

      if (!Number.isFinite(rawPrice) || rawPrice < 0) {
        return fail('Los precios deben ser mayores o iguales a 0.');
      }

      items.push({
        type: 'custom',
        refId: '',
        name: customName.slice(0, 80),
        qty,
        unitPrice: round2(rawPrice)
      });
    }
  }

  for (const [productId, qty] of Object.entries(needed)) {
    const product = find('products', productId);

    if (Number(product.stock) < qty) {
      return fail(
        'Stock insuficiente de "' + product.name +
        '". Disponible: ' + Number(product.stock) + '.'
      );
    }
  }

  const subtotal = round2(
    items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  );
  const discount = Number(form.elements.discount?.value || 0);

  if (!Number.isFinite(discount) || discount < 0) {
    return fail('El descuento debe ser mayor o igual a 0.');
  }

  if (round2(discount) > subtotal) {
    return fail('El descuento no puede superar el subtotal.');
  }

  const total = round2(subtotal - round2(discount));

  if (!Number.isFinite(total) || total < 0) {
    return fail('El total no es válido.');
  }

  const paymentMethod = String(form.elements.paymentMethod?.value || '');
  const status = String(form.elements.status?.value || '');
  const notes = String(form.elements.notes?.value || '').trim().slice(0, 500);

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return fail('Seleccioná un medio de pago válido.');
  }

  if (!['Pagado', 'Pendiente'].includes(status)) {
    return fail('Estado no válido.');
  }

  const ticketId = uid();
  let ticketSeq = 0;

  const ok = commit(() => {
    if (
      appointmentId &&
      activeTicketForAppointment(appointmentId)
    ) {
      throw new Error('Este turno ya tiene un ticket activo.');
    }

    for (const [productId, qty] of Object.entries(needed)) {
      const product = find('products', productId);

      if (Number(product.stock) < qty) {
        throw new Error('Stock insuficiente de "' + product.name + '".');
      }
    }

    db.config.ticketSeq = Number(db.config.ticketSeq || 0) + 1;
    ticketSeq = db.config.ticketSeq;

    db.tickets.push({
      id: ticketId,
      number: ticketNumber(ticketSeq),
      date: today(),
      createdAt: new Date().toISOString(),
      appointmentId,
      ownerId,
      petId,
      vetId,
      items,
      subtotal,
      discount: round2(discount),
      total,
      paymentMethod,
      status,
      notes,
      createdBy: user.id,
      createdByName: user.name,
      voidReason: '',
      voidedAt: ''
    });

    for (const [productId, qty] of Object.entries(needed)) {
      find('products', productId).stock = Number(
        find('products', productId).stock
      ) - qty;
    }
  });

  if (ok) {
    close();
    shell();
    toast('Ticket N° ' + ticketNumber(ticketSeq) + ' generado.');
    ticketView(ticketId);
  }
}

function ticketView(id) {
  const ticket = (db.tickets || []).find(item => item.id === id);

  if (!ticket || !canSeeTicket(ticket)) {
    return toast('Comprobante no disponible.');
  }

  const owner = ticket.ownerId ? find('owners', ticket.ownerId) : null;
  const pet = ticket.petId ? find('pets', ticket.petId) : null;
  const vet = ticket.vetId ? find('vets', ticket.vetId) : null;

  modal(
    'Ticket ' + ticket.number,
    `
      <div class="ticket">
        <p class="center">
          <b>${esc(db.config.name)}</b><br>
          <small>
            ${esc(db.config.address || '')} ·
            ${esc(db.config.phone || '')}
          </small>
        </p>
        <p>
          <small>N°</small><br>
          <b>${esc(ticket.number)}</b><br>
          <small>${pretty(ticket.date)} · ${esc(ticket.paymentMethod)} · ${badge(ticket.status)}</small>
        </p>
        <p>
          <small>Cliente</small><br>
          ${esc(owner?.name || 'Cliente mostrador')}
          ${pet ? '<br><small>Mascota: ' + esc(pet.name) + '</small>' : ''}
          ${vet ? '<br><small>Profesional: ' + esc(vet.name) + '</small>' : ''}
        </p>
        ${table(
          ['Ítem', 'Cant.', 'Precio', 'Total'],
          ticket.items.map(item => [
            esc(item.name),
            esc(item.qty),
            money(item.unitPrice),
            money(round2(item.qty * item.unitPrice))
          ])
        )}
        <p>
          Subtotal: <b>${money(ticket.subtotal)}</b><br>
          Descuento: <b>${money(ticket.discount)}</b><br>
          Total: <b>${money(ticket.total)}</b>
        </p>
        ${ticket.notes ? '<p><small>Notas: ' + esc(ticket.notes) + '</small></p>' : ''}
        ${ticket.status === 'Anulado'
          ? '<p><small>Anulado: ' + esc(ticket.voidReason || '') + ' · ' + esc(ticket.voidedAt || '') + '</small></p>'
          : ''}
        <p class="center muted">
          <small>Comprobante interno. No válido como factura.</small>
        </p>
        <div class="row">
          ${button('Imprimir', 'ticket-print', ticket.id)}
          ${user.role === 'admin' && ticket.status !== 'Anulado'
            ? button('Anular', 'ticket-void', ticket.id, 'danger')
            : ''}
          ${button('Cerrar', 'close', '', 'primary')}
        </div>
      </div>
    `
  );
}

function ticketPrint(id) {
  const ticket = (db.tickets || []).find(item => item.id === id);

  if (!ticket || !canSeeTicket(ticket)) {
    return toast('Comprobante no disponible.');
  }

  const owner = ticket.ownerId ? find('owners', ticket.ownerId) : null;
  const pet = ticket.petId ? find('pets', ticket.petId) : null;
  const vet = ticket.vetId ? find('vets', ticket.vetId) : null;
  const win = window.open('', '_blank', 'width=320,height=600');

  if (!win) {
    return toast('El navegador bloqueó la ventana de impresión.');
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ticket ${esc(ticket.number)}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: monospace, Arial, sans-serif; font-size: 12px; color: #111; max-width: 72mm; margin: 0 auto; }
        h1 { font-size: 14px; text-align: center; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        td, th { border-bottom: 1px dashed #999; padding: 3px 2px; text-align: left; }
        .center { text-align: center; }
        .total { font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>${esc(db.config.name)}</h1>
      <p class="center">${esc(db.config.address || '')}<br>${esc(db.config.phone || '')}</p>
      <p>Ticket: <b>${esc(ticket.number)}</b><br>Fecha: ${esc(ticket.date)}<br>Cliente: ${esc(owner?.name || 'Cliente mostrador')}${pet ? '<br>Mascota: ' + esc(pet.name) : ''}${vet ? '<br>Profesional: ' + esc(vet.name) : ''}</p>
      <table>
        <tr><th>Ítem</th><th>Cant.</th><th>Total</th></tr>
        ${ticket.items.map(item => `
          <tr>
            <td>${esc(item.name)}<br><small>${money(item.unitPrice)} c/u</small></td>
            <td>${esc(item.qty)}</td>
            <td>${money(round2(item.qty * item.unitPrice))}</td>
          </tr>
        `).join('')}
      </table>
      <p>Subtotal: ${money(ticket.subtotal)}<br>Descuento: ${money(ticket.discount)}<br><span class="total">Total: ${money(ticket.total)}</span><br>Pago: ${esc(ticket.paymentMethod)} · ${esc(ticket.status)}</p>
      <p class="center">Comprobante interno. No válido como factura.</p>
    </body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
}

function voidTicketForm(id) {
  const ticket = (db.tickets || []).find(item => item.id === id);

  if (!ticket || user.role !== 'admin') {
    return toast('No tenés permisos para anular tickets.');
  }

  if (ticket.status === 'Anulado') return;

  modal(
    'Anular ticket ' + ticket.number,
    formWrap(
      'ticket-void',
      area('reason', 'Motivo de anulación (obligatorio)', ''),
      ticket.id
    )
  );
}

function voidTicketConfirm(id) {
  const ticket = (db.tickets || []).find(item => item.id === id);
  const reason = String(draft.voidTicket?.reason || '').trim();

  if (
    !ticket ||
    user.role !== 'admin' ||
    !draft.voidTicket ||
    draft.voidTicket.id !== id
  ) {
    return;
  }

  modal(
    'Confirmar anulación',
    `
      <p>
        ¿Querés anular el ticket <b>${esc(ticket.number)}</b>
        por <b>${money(ticket.total)}</b>?
      </p>
      <p class="muted">Motivo: ${esc(reason)}</p>
      <p class="muted">Se repondrá el stock de los productos.</p>
      <div class="form-actions">
        ${button('Volver', 'close')}
        ${button('Confirmar anulación', 'void-confirm', id, 'danger')}
      </div>
    `
  );
}

function doVoidTicket(id) {
  const ticket = (db.tickets || []).find(item => item.id === id);
  const reason = String(draft.voidTicket?.reason || '').trim();

  if (!ticket || user.role !== 'admin' || !reason) return;

  if (ticket.status === 'Anulado') {
    draft.voidTicket = null;
    return;
  }

  if (commit(() => {
    ticket.status = 'Anulado';
    ticket.voidReason = reason.slice(0, 300);
    ticket.voidedAt = new Date().toISOString();

    ticket.items
      .filter(item => item.type === 'product' && item.refId)
      .forEach(item => {
        const product = find('products', item.refId);

        if (product) {
          product.stock = Number(product.stock || 0) + Number(item.qty || 0);
        }
      });
  })) {
    draft.voidTicket = null;
    close();
    shell();
    toast('Ticket ' + ticket.number + ' anulado.');
  }
}

function billingRange() {
  const now = new Date();
  const firstOfMonth = localDate(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const firstOfPrev = localDate(
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );
  const lastOfPrev = localDate(new Date(now.getFullYear(), now.getMonth(), 0));

  if (billingPeriod === 'week') {
    return [addDays(today(), -6), today()];
  }

  if (billingPeriod === 'month') {
    return [firstOfMonth, today()];
  }

  if (billingPeriod === 'prev') {
    return [firstOfPrev, lastOfPrev];
  }

  if (billingPeriod === 'custom') {
    const from = billingFrom || today();
    const to = billingTo || today();

    return from <= to ? [from, to] : [to, from];
  }

  return [today(), today()];
}

function propBar(pct) {
  const safe = Math.max(0, Math.min(100, Number(pct) || 0));

  return `
    <div class="bar" role="presentation">
      <span style="width:${safe.toFixed(1)}%"></span>
    </div>
  `;
}

function ticketHour(ticket) {
  const time = new Date(ticket.createdAt);

  if (Number.isNaN(time.getTime())) return '—';

  return time.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ticketActions(ticket, withVoid) {
  return button('Ver', 'ticket-view', ticket.id, 'small') + ' ' +
    button('Imprimir', 'ticket-print', ticket.id, 'small') +
    (
      withVoid && user.role === 'admin' && ticket.status !== 'Anulado'
        ? ' ' + button('Anular', 'ticket-void', ticket.id, 'small danger')
        : ''
    );
}

function myTicketsView() {
  if (!canCreateTicket()) {
    return '<div class="empty">Acceso restringido.</div>';
  }

  const q = query.trim().toLowerCase();
  const rows = visibleTickets()
    .filter(ticket => {
      if (!q) return true;

      const owner = ticket.ownerId
        ? label('owners', ticket.ownerId)
        : 'Cliente mostrador';
      const pet = ticket.petId ? label('pets', ticket.petId) : '';

      return (ticket.number + ' ' + owner + ' ' + pet)
        .toLowerCase()
        .includes(q);
    })
    .filter(ticket => !filter || ticket.status === filter)
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
  const [slice, pager] = pageRows(rows);

  return heading(
    'Mis tickets',
    'Tus tickets de cobro.',
    button('+ Nuevo ticket', 'ticket-create', '', 'primary')
  ) + `
    <section class="card">
      ${toolbar(['Pagado', 'Pendiente', 'Anulado'])}
      ${table(
        ['N°', 'Fecha', 'Cliente / mascota', 'Total', 'Medio de pago', 'Estado', 'Acciones'],
        slice.map(ticket => {
          const owner = ticket.ownerId ? find('owners', ticket.ownerId) : null;
          const pet = ticket.petId ? find('pets', ticket.petId) : null;

          return [
            esc(ticket.number),
            pretty(ticket.date),
            esc(owner?.name || 'Cliente mostrador') +
              (pet ? '<br><small>' + esc(pet.name) + '</small>' : ''),
            money(ticket.total),
            esc(ticket.paymentMethod),
            badge(ticket.status),
            ticketActions(ticket, false)
          ];
        })
      )}
      ${pager}
    </section>
  `;
}

function incomeView() {
  if (user.role !== 'admin') {
    return '<div class="empty">Acceso restringido.</div>';
  }

  return heading(
    'Ingresos',
    'Registro central de cobros de la veterinaria.',
    button('+ Nuevo ticket', 'ticket-create', '', 'primary')
  ) + incomeToday() + incomeHistory() + incomeSummaryBlock();
}

function incomeToday() {
  const day = today();
  const rows = visibleTickets()
    .filter(ticket => ticket.date === day)
    .sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
  const paid = rows.filter(ticket => ticket.status === 'Pagado');
  const pendingToday = rows.filter(ticket => ticket.status === 'Pendiente');
  const pendingAll = visibleTickets()
    .filter(ticket => ticket.status === 'Pendiente');
  const total = round2(
    paid.reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
  );
  const pendingTotal = round2(
    pendingAll.reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
  );
  const avg = paid.length ? round2(total / paid.length) : 0;

  return `
    <h2>Hoy</h2>

    <section class="stats">
      <article class="card stat">
        ${icon('receipt')}
        <span>Monto de hoy</span>
        <strong>${money(total)}</strong>
        <small>${paid.length} tickets pagados</small>
      </article>
      <article class="card stat">
        ${icon('receipt')}
        <span>Tickets de hoy</span>
        <strong>${paid.length + pendingToday.length}</strong>
        <small>${paid.length} pagados · ${pendingToday.length} pendientes</small>
      </article>
      <article class="card stat">
        ${icon('receipt')}
        <span>Ticket promedio de hoy</span>
        <strong>${money(avg)}</strong>
        <small>Promedio por cobro</small>
      </article>
      <article class="card stat">
        ${icon('receipt')}
        <span>Por cobrar</span>
        <strong>${money(pendingTotal)}</strong>
        <small>${pendingAll.length} pendientes en total</small>
      </article>
    </section>

    ${rows.length
      ? `
        <section class="card">
          <h2>Tickets de hoy</h2>
          ${table(
            ['N°', 'Hora', 'Cliente / mascota', 'Profesional', 'Total', 'Medio de pago', 'Estado', 'Acciones'],
            rows.map(ticket => {
              const owner = ticket.ownerId ? find('owners', ticket.ownerId) : null;
              const pet = ticket.petId ? find('pets', ticket.petId) : null;

              return [
                ticket.status === 'Anulado'
                  ? '<s>' + esc(ticket.number) + '</s>'
                  : esc(ticket.number),
                esc(ticketHour(ticket)),
                esc(owner?.name || 'Cliente mostrador') +
                  (pet ? '<br><small>' + esc(pet.name) + '</small>' : ''),
                esc(ticket.vetId ? label('vets', ticket.vetId) : '—'),
                money(ticket.total),
                esc(ticket.paymentMethod),
                badge(ticket.status),
                ticketActions(ticket, true)
              ];
            })
          )}
        </section>
      `
      : `
        <div class="empty">
          Todavía no hay tickets hoy.
          <br><br>
          ${button('+ Generar ticket', 'ticket-create', '', 'primary')}
        </div>
      `}
  `;
}

function incomePeriodTickets(from, to) {
  const q = query.trim().toLowerCase();

  return visibleTickets()
    .filter(ticket => ticket.date >= from && ticket.date <= to)
    .filter(ticket => !filter || ticket.status === filter)
    .filter(ticket => {
      if (!q) return true;

      const owner = ticket.ownerId
        ? label('owners', ticket.ownerId)
        : 'Cliente mostrador';
      const pet = ticket.petId ? label('pets', ticket.petId) : '';

      return (ticket.number + ' ' + owner + ' ' + pet)
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
}

function incomeHistory() {
  const [from, to] = billingRange();
  const rows = incomePeriodTickets(from, to);
  const paid = rows.filter(ticket => ticket.status === 'Pagado');
  const pending = rows.filter(ticket => ticket.status === 'Pendiente');
  const periodTotal = round2(
    paid.reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
  );
  const pendingTotal = round2(
    pending.reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
  );

  const groups = {};

  rows.forEach(ticket => {
    (groups[ticket.date] ||= []).push(ticket);
  });

  const days = Object.keys(groups).sort().reverse();

  const dayList = days.length
    ? days.map(day => {
      const items = groups[day];
      const dayPaid = items.filter(ticket => ticket.status === 'Pagado');
      const dayTotal = round2(
        dayPaid.reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
      );
      const byMethod = {};

      dayPaid.forEach(ticket => {
        byMethod[ticket.paymentMethod] =
          (byMethod[ticket.paymentMethod] || 0) + Number(ticket.total || 0);
      });

      const breakdown = Object.entries(byMethod).length
        ? Object.entries(byMethod)
          .map(([name, value]) => esc(name) + ' ' + money(value))
          .join(' · ')
        : 'Sin cobros';
      const open = incomeDay === day;

      return `
        <article class="card">
          <div class="row between">
            <div>
              <b>${pretty(day)}</b>
              <br>
              <small>
                ${items.length} tickets · Total: ${money(dayTotal)}
                <br>${breakdown}
              </small>
            </div>
            ${button(open ? 'Ocultar' : 'Ver tickets', 'income-day', day, 'small')}
          </div>
          ${open
            ? table(
              ['N°', 'Hora', 'Cliente / mascota', 'Total', 'Medio de pago', 'Estado', 'Acciones'],
              items.map(ticket => {
                const owner = ticket.ownerId ? find('owners', ticket.ownerId) : null;
                const pet = ticket.petId ? find('pets', ticket.petId) : null;

                return [
                  ticket.status === 'Anulado'
                    ? '<s>' + esc(ticket.number) + '</s>'
                    : esc(ticket.number),
                  esc(ticketHour(ticket)),
                  esc(owner?.name || 'Cliente mostrador') +
                    (pet ? '<br><small>' + esc(pet.name) + '</small>' : ''),
                  money(ticket.total),
                  esc(ticket.paymentMethod),
                  badge(ticket.status),
                  ticketActions(ticket, true)
                ];
              })
            )
            : ''}
        </article>
      `;
    }).join('')
    : `
      <div class="empty">
        No hay tickets en el período ${pretty(from)} – ${pretty(to)}.
      </div>
    `;

  const [slice, pager] = pageRows(rows);

  return `
    <h2>Registro por día</h2>

    <section class="card">
      <div class="toolbar">
        <select id="billing-period" aria-label="Período del registro">
          <option value="week" ${billingPeriod === 'week' ? 'selected' : ''}>Últimos 7 días</option>
          <option value="month" ${billingPeriod === 'month' ? 'selected' : ''}>Este mes</option>
          <option value="prev" ${billingPeriod === 'prev' ? 'selected' : ''}>Mes anterior</option>
          <option value="custom" ${billingPeriod === 'custom' ? 'selected' : ''}>Rango personalizado</option>
        </select>
        ${billingPeriod === 'custom'
          ? `
            <input type="date" id="billing-from" value="${esc(from)}" aria-label="Desde">
            <input type="date" id="billing-to" value="${esc(to)}" aria-label="Hasta">
          `
          : ''}
      </div>
      <p class="muted">
        Período: ${pretty(from)} – ${pretty(to)}.
        Agrupado por fecha del ticket. Solo suma lo Pagado.
      </p>
    </section>

    ${dayList}

    <section class="card">
      <h2>Detalle del período</h2>
      ${toolbar(['Pagado', 'Pendiente', 'Anulado'])}
      ${table(
        ['N°', 'Fecha', 'Cliente / mascota', 'Total', 'Medio de pago', 'Estado', 'Acciones'],
        slice.map(ticket => {
          const owner = ticket.ownerId ? find('owners', ticket.ownerId) : null;
          const pet = ticket.petId ? find('pets', ticket.petId) : null;

          return [
            ticket.status === 'Anulado'
              ? '<s>' + esc(ticket.number) + '</s>'
              : esc(ticket.number),
            pretty(ticket.date),
            esc(owner?.name || 'Cliente mostrador') +
              (pet ? '<br><small>' + esc(pet.name) + '</small>' : ''),
            money(ticket.total),
            esc(ticket.paymentMethod),
            badge(ticket.status),
            ticketActions(ticket, true)
          ];
        })
      )}
      ${pager}
      <p>
        <b>Total del período: ${money(periodTotal)}</b>
        <small>
          · ${paid.length} pagados · Por cobrar: ${money(pendingTotal)}
        </small>
      </p>
    </section>
  `;
}

function incomeSummaryBlock() {
  const [from, to] = billingRange();
  const inRange = visibleTickets().filter(
    ticket => ticket.date >= from && ticket.date <= to
  );
  const paid = inRange
    .filter(ticket => ticket.status === 'Pagado')
    .sort((a, b) => a.date.localeCompare(b.date));
  const pending = inRange.filter(ticket => ticket.status === 'Pendiente');
  const total = round2(
    paid.reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
  );
  const pendingTotal = round2(
    pending.reduce((sum, ticket) => sum + Number(ticket.total || 0), 0)
  );
  const avg = paid.length ? round2(total / paid.length) : 0;

  let detail = '';

  if (!paid.length && !pending.length) {
    detail = `
      <div class="empty">
        No hay ingresos en el período ${pretty(from)} – ${pretty(to)}.
        Probá con otro rango de fechas.
      </div>
    `;
  } else {
    const byMethod = {};
    const byVet = {};
    const byService = {};
    let servicesTotal = 0;
    let productsTotal = 0;
    let customTotal = 0;

    paid.forEach(ticket => {
      byMethod[ticket.paymentMethod] =
        (byMethod[ticket.paymentMethod] || 0) + Number(ticket.total || 0);

      const vetName = ticket.vetId
        ? label('vets', ticket.vetId)
        : 'Sin asignar';

      byVet[vetName] = (byVet[vetName] || 0) + Number(ticket.total || 0);

      ticket.items.forEach(item => {
        const line = Number(item.qty || 0) * Number(item.unitPrice || 0);

        if (item.type === 'service') servicesTotal += line;
        if (item.type === 'product') productsTotal += line;
        if (item.type === 'custom') customTotal += line;

        if (item.type === 'service') {
          byService[item.name] = byService[item.name] || { qty: 0, total: 0 };
          byService[item.name].qty += Number(item.qty || 0);
          byService[item.name].total += line;
        }
      });
    });

    const methodRows = Object.entries(byMethod)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => [
        esc(name),
        money(value),
        propBar(total ? (value / total) * 100 : 0)
      ]);
    const itemsTotal = servicesTotal + productsTotal + customTotal;
    const kindRows = [
      ['Servicios', money(round2(servicesTotal)), propBar(itemsTotal ? (servicesTotal / itemsTotal) * 100 : 0)],
      ['Productos', money(round2(productsTotal)), propBar(itemsTotal ? (productsTotal / itemsTotal) * 100 : 0)],
      ['Ítems libres', money(round2(customTotal)), propBar(itemsTotal ? (customTotal / itemsTotal) * 100 : 0)]
    ];
    const vetRows = Object.entries(byVet)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => [
        esc(name),
        money(value),
        propBar(total ? (value / total) * 100 : 0)
      ]);
    const topRows = Object.entries(byService)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5)
      .map(([name, info]) => [
        esc(name),
        esc(info.qty) + ' vendidos',
        money(round2(info.total))
      ]);

    detail = `
      <div class="income-grid">
        <section class="card">
          <h2>Por medio de pago</h2>
          ${table(['Medio', 'Total', 'Proporción'], methodRows)}
        </section>
        <section class="card">
          <h2>Servicios vs. productos</h2>
          ${table(['Rubro', 'Total', 'Proporción'], kindRows)}
        </section>
        <section class="card">
          <h2>Por profesional</h2>
          ${table(['Profesional', 'Total', 'Proporción'], vetRows)}
        </section>
        <section class="card">
          <h2>Top servicios</h2>
          ${table(['Servicio', 'Cantidad', 'Total'], topRows)}
        </section>
      </div>
      <section class="card">
        <h2>Ingresos por día</h2>
        ${billingChart(paid, from, to)}
      </section>
    `;
  }

  return `
    <h2>Resumen del período</h2>

    <section class="card">
      <div class="toolbar">
        ${button('Exportar CSV', 'billing-export')}
      </div>
      <p class="muted">
        Período: ${pretty(from)} – ${pretty(to)}.
        ${paid.length} tickets pagados por ${money(total)}.
        Solo se cuentan tickets Pagado. Los Anulado se excluyen.
      </p>
    </section>

    ${detail}
  `;
}

function billingChart(paid, from, to) {
  const days = [];
  let cursor = from;
  let guard = 0;

  while (cursor <= to && guard < 93) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
    guard++;
  }

  const totals = Object.fromEntries(days.map(day => [day, 0]));

  paid.forEach(ticket => {
    if (totals[ticket.date] !== undefined) {
      totals[ticket.date] += Number(ticket.total || 0);
    }
  });

  const max = Math.max(1, ...Object.values(totals));
  const width = 600;
  const height = 220;
  const pad = 30;
  const gap = 6;
  const barWidth = Math.max(
    4,
    (width - pad * 2) / Math.max(1, days.length) - gap
  );

  return `
    <div class="chart-wrap">
      <svg
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label="Gráfico de ingresos por día entre ${esc(from)} y ${esc(to)}"
        preserveAspectRatio="xMidYMid meet"
      >
        ${days.map((day, index) => {
          const value = totals[day];
          const barHeight = Math.max(
            value > 0 ? 4 : 0,
            ((height - pad * 2) * value) / max
          );
          const x = pad + index * (barWidth + gap);
          const y = height - pad - barHeight;

          return `
            <rect
              x="${x.toFixed(1)}"
              y="${y.toFixed(1)}"
              width="${barWidth.toFixed(1)}"
              height="${barHeight.toFixed(1)}"
              rx="3"
              fill="var(--primary)"
            >
              <title>${pretty(day)}: ${money(value)}</title>
            </rect>
          `;
        }).join('')}
        <line
          x1="${pad}"
          y1="${height - pad}"
          x2="${width - pad}"
          y2="${height - pad}"
          stroke="currentColor"
          stroke-opacity="0.3"
        />
        <text x="${pad}" y="${height - 8}" font-size="10" fill="currentColor">
          ${pretty(days[0] || from)}
        </text>
        <text
          x="${width - pad}"
          y="${height - 8}"
          font-size="10"
          fill="currentColor"
          text-anchor="end"
        >
          ${pretty(days[days.length - 1] || to)}
        </text>
      </svg>
    </div>
  `;
}

function billingExport() {
  if (user.role !== 'admin') {
    return toast('No tenés permisos para exportar.');
  }

  const [from, to] = billingRange();
  const rows = visibleTickets()
    .filter(ticket => ticket.date >= from && ticket.date <= to)
    .sort((a, b) =>
      a.date.localeCompare(b.date) ||
      String(a.number).localeCompare(String(b.number))
    );

  if (!rows.length) {
    return toast('No hay tickets para exportar en el período.');
  }

  const cell = value =>
    '"' + String(value ?? '').replace(/"/g, '""') + '"';
  const lines = [
    ['Numero', 'Fecha', 'Propietario', 'Mascota', 'Veterinario', 'Detalle', 'Subtotal', 'Descuento', 'Total', 'Medio de pago', 'Estado', 'Notas']
      .map(cell).join(';'),
    ...rows.map(ticket => [
      ticket.number,
      ticket.date,
      ticket.ownerId ? label('owners', ticket.ownerId) : 'Cliente mostrador',
      ticket.petId ? label('pets', ticket.petId) : '',
      ticket.vetId ? label('vets', ticket.vetId) : '',
      ticket.items.map(
        item => item.qty + 'x ' + item.name + ' ($' + item.unitPrice + ')'
      ).join(' | '),
      ticket.subtotal,
      ticket.discount,
      ticket.total,
      ticket.paymentMethod,
      ticket.status,
      ticket.notes || ''
    ].map(cell).join(';'))
  ];

  const blob = new Blob(['\ufeff' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'ingresos_' + from + '_' + to + '.csv';
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ownerTicketsHTML(ownerId) {
  const rows = (db.tickets || [])
    .filter(ticket =>
      ticket.ownerId === ownerId && canSeeTicket(ticket)
    )
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      String(b.createdAt).localeCompare(String(a.createdAt))
    );

  if (!rows.length) return '';

  return `
    <h2>Mis comprobantes</h2>
    <section class="card">
      ${table(
        ['N°', 'Fecha', 'Mascota', 'Total', 'Estado', ''],
        rows.map(ticket => [
          esc(ticket.number),
          pretty(ticket.date),
          esc(ticket.petId ? label('pets', ticket.petId) : '—'),
          money(ticket.total),
          badge(ticket.status),
          button('Ver', 'ticket-view', ticket.id, 'small') + ' ' +
          button('Imprimir', 'ticket-print', ticket.id, 'small')
        ])
      )}
    </section>
  `;
}

// EVENTOS GENERALES

document.addEventListener('click', event => {
  const element = event.target.closest('[data-action]');

  if (!element) return;

  action(
    element.dataset.action,
    element.dataset.id,
    element
  ).catch(error => toast(error.message));
});

document.addEventListener('submit', async event => {
  const form = event.target;

  if (!form.matches('form[data-form]')) return;

  event.preventDefault();

  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;

  try {
    if (form.dataset.form === 'settings') {
      draft.nextConfig = await clinicData(form);
    }

    await submitForm(form);
  } catch (error) {
    fail(error.message || 'No se pudo completar la operación.');
  } finally {
    if (submit.isConnected) {
      submit.disabled = false;
    }
  }
});

document.addEventListener('input', event => {
  if (event.target.closest('form[data-form=ticket]')) {
    ticketRecalc();
  }

  if (event.target.id === 'list-search') {
    query = event.target.value;
    page = 1;

    const position = event.target.selectionStart;

    renderContent();

    $('#list-search').focus();
    $('#list-search').setSelectionRange(position, position);
  }

  if (event.target.id === 'global-search') {
    const search = event.target.value.trim().toLowerCase();

    $('#global-results').innerHTML = search
      ? `
        <section class="card">
          <h2>Resultados</h2>

          ${db.owners
            .filter(owner =>
              JSON.stringify(owner).toLowerCase().includes(search)
            )
            .map(owner => `
              <p>
                ${button(
                  esc(owner.name) + ' · ' + esc(owner.dni),
                  'owner',
                  owner.id,
                  'ghost'
                )}
              </p>
            `)
            .join('')}

          ${
            db.pets
              .filter(pet =>
                JSON.stringify({
                  ...pet,
                  owner: find('owners', pet.ownerId)
                }).toLowerCase().includes(search)
              )
              .map(pet =>
                button(
                  esc(pet.name) + ' · ' + esc(label('owners', pet.ownerId)),
                  'pet',
                  pet.id,
                  'small'
                )
              )
              .join(' ') ||
            '<p class="muted">Sin mascotas coincidentes.</p>'
          }
        </section>
      `
      : '';
  }
});

document.addEventListener('change', event => {
  const element = event.target;

  if (element.id === 'list-filter') {
    filter = element.value;
    page = 1;
    renderContent();
  }

  if (element.id === 'agenda-date') {
    agendaDate = element.value || today();
    renderContent();
  }

  if (element.id === 'agenda-mode') {
    agendaMode = element.value;
    renderContent();
  }

  if (element.id === 'agenda-vet') {
    agendaVet = element.value;
    renderContent();
  }

  if (element.id === 'billing-period') {
    billingPeriod = element.value;

    if (billingPeriod === 'custom') {
      billingFrom = billingFrom && billingFrom !== today()
        ? billingFrom
        : addDays(today(), -30);
      billingTo = today();
    } else {
      const [from, to] = billingRange();
      billingFrom = from;
      billingTo = to;
    }

    page = 1;
    renderContent();
  }

  if (element.id === 'billing-from') {
    billingFrom = element.value || today();
    renderContent();
  }

  if (element.id === 'billing-to') {
    billingTo = element.value || today();
    renderContent();
  }

  const ticketFormEl = element.closest('form[data-form=ticket]');

  if (ticketFormEl) {
    const row = element.closest('.ticket-row');

    if (row && element.classList.contains('ticket-type')) {
      ticketUpdateRow(row);
      ticketRecalc();
    }

    if (row && element.classList.contains('ticket-ref')) {
      const type = row.querySelector('.ticket-type').value;
      const price = row.querySelector('.ticket-price');

      if (type === 'service') {
        price.value = find('services', element.value)?.price ?? 0;
      }

      if (type === 'product') {
        price.value = find('products', element.value)?.price ?? 0;
      }

      ticketRecalc();
    }

    if (element.name === 'ownerId') {
      const petSelect = ticketFormEl.elements.petId;

      if (petSelect) {
        const current = petSelect.value;

        petSelect.innerHTML =
          '<option value="">Sin mascota</option>' +
          ticketOwnerPets(element.value)
            .map(pet => `
              <option value="${esc(pet.id)}">
                ${esc(pet.name)}
              </option>
            `).join('');

        if (
          [...petSelect.options].some(option => option.value === current)
        ) {
          petSelect.value = current;
        }
      }
    }
  }

  if (element.closest('form[data-form=booking]')) {
    if (element.name === 'serviceId') {
      updateBooking('service');
    }

    if (
      element.name === 'vetId' ||
      element.name === 'petId'
    ) {
      updateBooking('vet');
    }

    if (element.name === 'date') {
      updateBooking('date');
    }
  }
});

window.addEventListener('storage', event => {
  if (event.key !== KEY) return;

  load();

  if (user) {
    const current = find('users', user.id);

    if (!current?.active) {
      user = null;
      login();
      toast('La sesión ya no está habilitada.');
    } else {
      user = current;
      close();
      shell();
      toast('Datos actualizados desde otra pestaña.');
    }
  }
});

// INICIO DE LA APLICACIÓN

ensureThemeFab();
load();

if (db.configured) {
  login();

  const qr = new URLSearchParams(
    location.hash.slice(1)
  ).get('qr');

  if (qr) {
    const pet = db.pets.find(item => item.qr === qr);

    if (pet) {
      publicProfile(pet.id);
    }
  }
} else {
  setup();
}