'use strict';

/*
  Sistema de Gestión Veterinaria.
  Prototipo local con HTML, CSS y JavaScript.
  Las cuentas, códigos y permisos son simulados.
  Abrir index.html junto a styles.css y script.js.
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
  schedules: ['Horarios', 'clock'],
  services: ['Servicios', 'medical'],
  products: ['Catálogo', 'bag'],
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
  menu: 'M3 6h18M3 12h18M3 18h18'
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
        id: uid(),
        name: 'Alimento adulto balanceado',
        category: 'Nutrición',
        description: 'Bolsa de 3 kg. Consultá la variedad indicada para tu mascota.',
        price: 18500,
        stock: 14,
        active: true,
        photo: ''
      },
      {
        id: uid(),
        name: 'Pipeta para perros',
        category: 'Cuidado',
        description: 'Presentación según peso. Consultá al profesional.',
        price: 7200,
        stock: 8,
        active: true,
        photo: ''
      },
      {
        id: uid(),
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
      ${button('¿No tenés cuenta? Crear cuenta', 'register', '', 'ghost')}
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

      <div>
        ${button('Reiniciar maqueta (pedir registro inicial)', 'reset-demo', '', 'ghost small')}
      </div>
    </div>
  `);
}

function registerScreen() {
  recovery = null;

  authShell(`
    <div class="eyebrow">
      Crear cuenta en ${esc(db.config?.name || 'tu veterinaria')}
    </div>

    <h1>Registrate</h1>
    <p>Creá tu cuenta de propietario para gestionar tus mascotas y turnos.</p>

    <form data-form="register">
      ${field('name', 'Nombre y apellido', '', 'text', 'required autocomplete="name"')}
      ${field('dni', 'DNI (8 números)', '', 'text', 'required pattern="[0-9]{8}" minlength="8" maxlength="8" inputmode="numeric" title="El DNI debe tener exactamente 8 números."')}
      ${field('address', 'Dirección', '', 'text', 'required autocomplete="street-address"')}
      ${field('phone', 'Número de teléfono', '', 'tel', 'required autocomplete="tel"')}
      ${field('email', 'Gmail / correo electrónico', '', 'email', 'required autocomplete="email"')}
      ${field('password', 'Contraseña (mínimo 6 caracteres)', '', 'password', 'minlength="6" required autocomplete="new-password"')}
      ${field('confirm', 'Confirmar contraseña', '', 'password', 'minlength="6" required autocomplete="new-password"')}

      <div id="form-error" class="error" role="alert"></div>

      <button class="primary full" type="submit">
        Crear cuenta →
      </button>
    </form>

    <p class="center">
      ${button('¿Ya tenés cuenta? Iniciar sesión', 'login', '', 'ghost')}
    </p>
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
      : status === 'Atendido'
        ? 'blue'
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
    ]
  ];

  const quickActions = [
    ['Nueva mascota', 'create', 'pets', 'pet'],
    ['Nuevo turno', 'book', '', 'calendar'],

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
      ${stats.map(([title, amount, iconName, subtitle]) => `
        <article class="card stat">
          ${icon(iconName)}
          <span>${title}</span>
          <strong>${amount}</strong>
          <small>${subtitle}</small>
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
      'Duración',
      'Profesionales',
      'Estado',
      'Acciones'
    ];

    values = slice.map(service => [
      esc(service.name),
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
    return ['pets', 'owners', 'reminders'].includes(collection);
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
        'DNI (8 números)',
        item.dni,
        'text',
        'required pattern="[0-9]{8}" minlength="8" maxlength="8" inputmode="numeric" title="El DNI debe tener exactamente 8 números."'
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

    case 'register': {
      const name = (data.name || '').trim();
      const dni = (data.dni || '').trim();
      const address = (data.address || '').trim();
      const phone = (data.phone || '').trim();
      const email = (data.email || '').trim();

      if (!name || !dni || !address || !phone || !email) {
        return fail('Completá todos los datos solicitados.');
      }

      if (!/^[0-9]{8}$/.test(dni)) {
        return fail('El DNI debe tener exactamente 8 números.');
      }

      if ((data.password || '').length < 6) {
        return fail('La contraseña debe tener al menos 6 caracteres.');
      }

      if (data.password !== data.confirm) {
        return fail('Las contraseñas no coinciden.');
      }

      if (db.owners.some(owner => owner.dni === dni)) {
        return fail('Ya existe un propietario con ese DNI.');
      }

      if (db.users.some(account =>
        account.email.toLowerCase() === email.toLowerCase()
      )) {
        return fail('Ese correo ya tiene una cuenta.');
      }

      const ownerId = uid();

      const ok = commit(() => {
        db.owners.push({
          id: ownerId,
          name,
          dni,
          phone,
          email,
          address,
          active: true
        });

        db.users.push({
          id: uid(),
          name,
          email,
          password: data.password,
          role: 'owner',
          ownerId,
          active: true
        });
      });

      if (ok) {
        login();
        toast('Cuenta creada correctamente. Ahora iniciá sesión.');
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
      }
      break;
    }

    case 'inline-owner': {
      if (!mayEdit('owners')) return;

      if (!/^[0-9]{8}$/.test(data.dni?.trim() || '')) {
        return fail('El DNI debe tener exactamente 8 números.');
      }

      const owner = {
        ...data,
        id: uid(),
        active: true
      };

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

    case 'reset-demo':
      try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(KEY + '-email');
      } catch {
        // Si el navegador bloquea el almacenamiento, igual reiniciamos en memoria.
      }
      db = { configured: false };
      user = null;
      draft = {};
      authStep = 0;
      recovery = null;
      close();
      setup();
      break;

    case 'register':
      registerScreen();
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
            'DNI (8 números)',
            '',
            'text',
            'required pattern="[0-9]{8}" minlength="8" maxlength="8" inputmode="numeric" title="El DNI debe tener exactamente 8 números."'
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
  }
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

load();

const forceSetup = ['maqueta', 'demo', 'setup', 'nuevo'].some(key =>
  new URLSearchParams(location.search).has(key)
);

if (forceSetup) {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Sin almacenamiento, igual mostramos el registro inicial.
  }
  db = { configured: false };
  draft = {};
  authStep = 0;
  user = null;
}

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