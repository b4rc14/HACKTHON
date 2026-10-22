// ---------------------------------------------------------------------------
// THE SHOW MUST MUTATE — datos narrativos y contratos de contenido
// Este archivo es la "biblioteca" del juego. Añadir aquí contenido no debería
// requerir tocar React ni el motor de reglas.
// ---------------------------------------------------------------------------

export const GENRES = {
  romance: {
    id: 'romance',
    label: 'Romance',
    upper: 'ROMANCE',
    short: 'ROM',
    color: '#ff6f91',
    soft: '#ffc2d1',
    dark: '#651a33',
    icon: '♥',
    tagline: 'Corazones, promesas y un decorado a punto de arder.',
  },
  comedy: {
    id: 'comedy',
    label: 'Comedia',
    upper: 'COMEDIA',
    short: 'COM',
    color: '#ffd166',
    soft: '#ffe9a8',
    dark: '#61400c',
    icon: '✶',
    tagline: 'Si no puedes arreglarlo, haz que el público se ría.',
  },
  scifi: {
    id: 'scifi',
    label: 'Ciencia ficción',
    upper: 'CIENCIA FICCIÓN',
    short: 'SCI',
    color: '#69f0bd',
    soft: '#b8ffe2',
    dark: '#0b4b42',
    icon: '◉',
    tagline: 'El amor también es una fuerza extraterrestre.',
  },
};

export const CONTROL_GROUPS = [
  {
    id: 'lighting',
    label: 'Iluminación',
    short: 'LUZ',
    hint: 'Tiñe el escenario y cambia lo que el público cree estar viendo.',
    icon: '☀',
  },
  {
    id: 'sound',
    label: 'Sonido',
    short: 'SONIDO',
    hint: 'La música decide si una explosión es una tragedia o un chiste.',
    icon: '♫',
  },
  {
    id: 'object',
    label: 'Objetos',
    short: 'OBJETO',
    hint: 'Un objeto fuera de lugar puede ser un error... o una prueba de amor.',
    icon: '✧',
  },
];

export const CONTROLS = {
  lighting: [
    {
      id: 'warm',
      label: 'Cálida',
      sublabel: 'Melancolía de terciopelo',
      icon: '☀',
      genre: 'romance',
      genres: { romance: 4 },
      tags: ['warm', 'intimate', 'sincere'],
      description: 'Reflectores dorados. Hace que hasta una viga caída parezca poesía.',
    },
    {
      id: 'scifi',
      label: 'Verde alien',
      sublabel: 'Frío de laboratorio',
      icon: '◉',
      genre: 'scifi',
      genres: { scifi: 4, comedy: 1 },
      tags: ['alien', 'tech', 'weird'],
      description: 'Luz de sala de autopsias. Muy útil si decides que todo era un experimento.',
    },
    {
      id: 'comic',
      label: 'Rosa payaso',
      sublabel: 'Fucsia de emergencia',
      icon: '✶',
      genre: 'comedy',
      genres: { comedy: 4, scifi: 1 },
      tags: ['silly', 'pink', 'slapstick'],
      description: 'Un foco rosa que convierte cualquier desgracia en número cómico.',
    },
  ],
  sound: [
    {
      id: 'romantic',
      label: 'Violines',
      sublabel: 'Cuerdas y suspiros',
      icon: '♫',
      genre: 'romance',
      genres: { romance: 4 },
      tags: ['music', 'sincere', 'strings'],
      description: 'Una melodía que subraya cada mirada. Aunque haya fuego.',
    },
    {
      id: 'space',
      label: 'Zumbido espacial',
      sublabel: 'Theremin orbital',
      icon: '≋',
      genre: 'scifi',
      genres: { scifi: 4, comedy: 1 },
      tags: ['space', 'alien', 'weird'],
      description: 'Un pitido de nave averiada. Sugiere que el gazebo no es de este planeta.',
    },
    {
      id: 'comic',
      label: 'Tuba cómica',
      sublabel: 'Bofetada musical',
      icon: '♬',
      genre: 'comedy',
      genres: { comedy: 4, scifi: 1 },
      tags: ['slapstick', 'noise', 'silly'],
      description: 'Un par de notas de tuba que convierten el pánico en vodevil.',
    },
  ],
  object: [
    {
      id: 'flowers',
      label: 'Ramo de flores',
      sublabel: 'Amor caducado en 24 h',
      icon: '❀',
      genre: 'romance',
      genres: { romance: 5, comedy: 1 },
      tags: ['romantic-token', 'organic', 'sincere'],
      description: 'Flores de plástico con olor a pasillo de hospital. Funcionan.',
    },
    {
      id: 'ufo',
      label: 'Platillo volante',
      sublabel: 'Objeto no identificado de atrezo',
      icon: '◒',
      genre: 'scifi',
      genres: { scifi: 5, comedy: 1 },
      tags: ['alien', 'space', 'tech', 'weird'],
      description: 'Una nave de cartón piedra que baja del telar con luces de feria.',
    },
    {
      id: 'chicken',
      label: 'Gallina',
      sublabel: 'Actriz no sindicada',
      icon: '❋',
      genre: 'comedy',
      genres: { comedy: 5, scifi: 1 },
      tags: ['absurd', 'animal', 'slapstick'],
      description: 'No está en el guion. Está en el escenario. Y tiene más presencia que Bruno.',
    },
  ],
};

export const ALL_CONTROL_DEFS = [
  ...CONTROLS.lighting,
  ...CONTROLS.sound,
  ...CONTROLS.object,
];

export const getControlDef = (kind, id) => CONTROLS[kind]?.find((control) => control.id === id) || null;

export const INCIDENTS = [
  {
    id: 'explosion',
    act: 1,
    roman: 'I',
    playTitle: 'El jardín de los susurros',
    location: 'El gazebo del jardín',
    timer: 20,
    memoryPrompt: 'La obra acaba de empezar. Todavía puedes elegir qué clase de desastre será.',
    briefing:
      'Una historia romántica de época. Lía y Bruno se reencuentran en el gazebo donde prometieron amarse para siempre. El decorado, sin embargo, huele a pólvora.',
    openingLines: [
      { speaker: 'LÍA', text: 'Bruno... este jardín guarda todos nuestros secretos.' },
      { speaker: 'BRUNO', text: 'Y también un bidón de gasolina que nadie recuerda haber traído.' },
    ],
    incidentTitle: '¡EXPLOSIÓN EN EL GAZEBO!',
    incidentText:
      'Un estruendo sacude el escenario. El gazebo escupe humo, una viga cae y el público contiene la respiración. Tienes 20 segundos para convertir el desastre en una escena.',
    baseTags: ['explosion', 'gazebo'],
    affinity: { romance: 2, comedy: 3, scifi: 3 },
    bridges: {
      romance: ['warm', 'intimate', 'sincere', 'music', 'romantic-token', 'organic'],
      comedy: ['silly', 'slapstick', 'absurd', 'animal', 'noise', 'pink'],
      scifi: ['alien', 'space', 'tech', 'weird'],
    },
    variants: {
      romance: {
        headline: 'UNA EXPLOSIÓN DE AMOR',
        summary:
          'La pólvora se convierte en fuegos artificiales. Bruno declara que su corazón estalla por Lía y el gazebo, técnicamente, también. El público romántico suspira; los críticos toman notas sobre la licencia de obras.',
        dialogue: [
          { speaker: 'LÍA', text: 'Bruno... ¿acabas de hacer explotar el gazebo por mí?' },
          { speaker: 'BRUNO', text: 'Solo la parte que no era imprescindible.' },
          { speaker: 'NARRADOR', text: 'El humo dibuja un corazón. Nadie sabe quién pagará los daños.' },
        ],
      },
      comedy: {
        headline: 'EL GAZEBO SE DIVORCIA',
        summary:
          'La explosión resulta ser parte del número de variedades. El gazebo sale volando con dignidad ofendida, Bruno improvisa un baile y Lía descubre que el decorado tiene mejores chistes que su prometido.',
        dialogue: [
          { speaker: 'BRUNO', text: 'No es una explosión, cariño. Es una entrada con carácter.' },
          { speaker: 'LÍA', text: 'El gazebo se ha ido. Se ha llevado las sillas y mi dignidad.' },
          { speaker: 'NARRADOR', text: 'El público ríe. El regidor llora. La taquilla respira.' },
        ],
      },
      scifi: {
        headline: 'PRIMER CONTACTO EN EL JARDÍN',
        summary:
          'La explosión no era pólvora: era una apertura dimensional. El gazebo es una cápsula de embarque y Bruno, al parecer, un embajador del amor interplanetario. La historia acaba de abandonar el siglo XIX.',
        dialogue: [
          { speaker: 'LÍA', text: 'Bruno, tu declaración viene con una firma de radiofrecuencia.' },
          { speaker: 'BRUNO', text: 'Mi amor siempre ha sido... de otra dimensión.' },
          { speaker: 'NARRADOR', text: 'Una nave de luces verdes espera entre los rosales.' },
        ],
      },
    },
  },
  {
    id: 'dinosaur',
    act: 2,
    roman: 'II',
    playTitle: 'El jardín de los susurros (segunda parte)',
    location: 'El invernadero de los recuerdos',
    timer: 20,
    memoryPrompt:
      'El sistema recuerda el género que has construido. Si el dinosaurio encaja con lo anterior, el público lo aceptará. Si no, necesitarás una justificación brillante.',
    briefing:
      'La función continúa. El escenario se ha convertido en lo que tú hayas decidido: un drama, un circo o una embajada alienígena. Entonces, del telar, baja un dinosaurio de cartón.',
    openingLines: [
      { speaker: 'LÍA', text: 'Bruno, prometiste que este jardín no tenía más sorpresas.' },
      { speaker: 'BRUNO', text: 'Técnicamente, el dinosaurio ya estaba aquí cuando lo compramos.' },
    ],
    incidentTitle: 'UN DINOSAURIO DE CARTÓN CAE DEL TELAR',
    incidentText:
      'El dinosaurio mide cuatro metros, está pintado a mano y tiene una mirada de no haber pagado entrada. El público espera. La historia que has construido decide ahora si es un monstruo, un invitado o una metáfora.',
    baseTags: ['dinosaur', 'cardboard'],
    affinity: { romance: 1, comedy: 3, scifi: 2 },
    bridges: {
      romance: ['warm', 'intimate', 'sincere', 'music', 'romantic-token', 'organic'],
      comedy: ['silly', 'slapstick', 'absurd', 'animal', 'noise', 'pink'],
      scifi: ['alien', 'space', 'tech', 'weird'],
    },
    variants: {
      romance: {
        headline: 'AMOR DE OTRAS ERAS',
        summary:
          'El dinosaurio se arrodilla. Lía reconoce en él a un amor de la infancia, de hace sesenta y cinco millones de años. Bruno siente celos de un fósil y el público romántico celebra la tragedia.',
        dialogue: [
          { speaker: 'LÍA', text: 'Ese rugido... lo he oído en mis sueños más antiguos.' },
          { speaker: 'BRUNO', text: '¿Estás coqueteando con un decorado?' },
          { speaker: 'DINOSAURIO', text: '(Cruje de forma profundamente emotiva.)' },
        ],
      },
      comedy: {
        headline: 'BODA PREHISTÓRICA',
        summary:
          'El dinosaurio es el padrino del enlace. Trae el anillo en la boca, se come el ramo y firma el registro con una garra. El público del caos aplaude con la boca llena de palomitas.',
        dialogue: [
          { speaker: 'BRUNO', text: '¿Este gigante viene con nosotros al banquete?' },
          { speaker: 'LÍA', text: 'Solo si deja algo para los invitados.' },
          { speaker: 'DINOSAURIO', text: '(Se come el centro de mesa.)' },
        ],
      },
      scifi: {
        headline: 'EMBAJADOR DEL CRETÁCICO EXTERIOR',
        summary:
          'El dinosaurio no es cartón: es la coraza de un embajador saurio llegado por el portal de la escena anterior. Exige matrimonio interplanetario o, en su defecto, catering. La continuidad funciona.',
        dialogue: [
          { speaker: 'BRUNO', text: '¿Ese dinosaurio vino en la misma nave que la explosión?' },
          { speaker: 'LÍA', text: 'No, Bruno. La nave es el dinosaurio.' },
          { speaker: 'NARRADOR', text: 'El embajador saurio presenta sus credenciales. Son de cartón.' },
        ],
      },
    },
  },
  {
    id: 'blackout',
    act: 3,
    roman: 'III',
    playTitle: 'El jardín de los susurros: el final',
    location: 'El clímax del gazebo',
    timer: 20,
    memoryPrompt:
      'Última escena. Todo lo que has construido —y todo lo que has roto— vuelve ahora. Administra tus recursos: no habrá otra oportunidad.',
    briefing:
      'El clímax final. Lía y Bruno están a punto de decidir si se quedan juntos, se separan o se convierten en una especie protegida. El público contiene la respiración. Entonces, se va la luz.',
    openingLines: [
      { speaker: 'LÍA', text: 'Bruno, pase lo que pase, quiero que sepas...' },
      { speaker: 'BRUNO', text: 'Lía, creo que el técnico acaba de bajar el interruptor general.' },
    ],
    incidentTitle: 'APAGÓN EN EL CLÍMAX',
    incidentText:
      'El escenario queda a oscuras. Solo se oye al público respirar y a la gallina —si existe— picotear el micro. Tienes 20 segundos y tus recursos restantes para conseguir un desenlace.',
    baseTags: ['blackout'],
    affinity: { romance: 2, comedy: 2, scifi: 2 },
    bridges: {
      romance: ['warm', 'intimate', 'sincere', 'music', 'romantic-token', 'organic'],
      comedy: ['silly', 'slapstick', 'absurd', 'animal', 'noise', 'pink'],
      scifi: ['alien', 'space', 'tech', 'weird'],
    },
    variants: {
      romance: {
        headline: 'A OSCURAS, PERO JUNTOS',
        summary:
          'La oscuridad se convierte en intimidad. Lía y Bruno se encuentran por la voz, no por la vista. El público enciende mecheros. El final es pequeño, sincero y probablemente se ve mejor con los ojos cerrados.',
        dialogue: [
          { speaker: 'LÍA', text: 'No te veo, Bruno. Pero sigues siendo la persona más visible de esta sala.' },
          { speaker: 'BRUNO', text: 'Y tú sigues siendo la única que sabe dónde está el cuadro eléctrico.' },
          { speaker: 'NARRADOR', text: 'Un mechero se enciende en la tercera fila. Luego otro. La escena respira.' },
        ],
      },
      comedy: {
        headline: 'EL APAGÓN MÁS LARGO DE LA HISTORIA',
        summary:
          'La gallina encuentra el interruptor, Bruno confunde a Lía con el atrezzo y el apagón se convierte en un número de sombras chinescas. Nadie entiende el final, pero es imposible no aplaudirlo.',
        dialogue: [
          { speaker: 'LÍA', text: 'Bruno, ¿eres tú o el perchero?' },
          { speaker: 'BRUNO', text: 'Soy el perchero. Pero estoy dispuesto a comprometerme.' },
          { speaker: 'GALLINA', text: '(Encuentra el interruptor. Se hace la luz. Nadie sabe cómo.)' },
        ],
      },
      scifi: {
        headline: 'EL NOVIAJE DE LA ÚLTIMA LUZ',
        summary:
          'El apagón es una maniobra de emergencia de la nave-gazebo. Lía y Bruno despegan hacia un futuro sin bombillas. La historia termina en el espacio, que también es una forma de decir "hogar".',
        dialogue: [
          { speaker: 'BRUNO', text: 'Lía, la nave dice que el amor es la única energía que no necesita batería.' },
          { speaker: 'LÍA', text: 'Dile a la nave que el gazebo también viaja con nosotros.' },
          { speaker: 'NARRADOR', text: 'El telón se cierra. En órbita, alguien aplaude con seis manos.' },
        ],
      },
    },
  },
];

INCIDENTS.push(
  {
    id: 'smoke',
    act: 1,
    roman: 'I',
    playTitle: 'La máquina de humo',
    location: 'La tramoya',
    timer: 20,
    memoryPrompt: 'La niebla puede ser atmósfera o un accidente. Tú decides qué respira el público.',
    briefing:
      'La función avanza entre brumas. Alguien ha subido la máquina de humo al máximo y el escenario empieza a desaparecer bajo una niebla espesa.',
    openingLines: [
      { speaker: 'LÍA', text: '¿Por qué huele a algodón de feria?' },
      { speaker: 'BRUNO', text: 'Porque el botón de niebla tiene dos posiciones: off y apocalipsis.' },
    ],
    incidentTitle: 'LA MÁQUINA DE HUMO SE DESCONTROLA',
    incidentText:
      'La niebla cubre las tablas, los actores y media primera fila. El público tose, ríe y espera. Tienes 20 segundos para convertir la bruma en escena.',
    baseTags: ['smoke', 'machine', 'fog'],
    affinity: { romance: 2, comedy: 3, scifi: 2 },
    bridges: {
      romance: ['warm', 'intimate', 'sincere', 'music', 'romantic-token', 'organic'],
      comedy: ['silly', 'slapstick', 'absurd', 'animal', 'noise', 'pink'],
      scifi: ['alien', 'space', 'tech', 'weird'],
    },
    variants: {
      romance: {
        headline: 'NIEBLA DE DOS CORAZONES',
        summary:
          'La bruma se vuelve intimidad. Lía y Bruno se buscan a tientas entre la niebla y encuentran una promesa que no necesitaba decorado. El público romántico suspira; el humo, por una vez, ayuda.',
        dialogue: [
          { speaker: 'LÍA', text: 'No te veo, pero sé perfectamente dónde estás.' },
          { speaker: 'BRUNO', text: 'Es la primera vez que el humo juega a nuestro favor.' },
          { speaker: 'NARRADOR', text: 'La niebla dibuja dos siluetas que se niegan a separarse.' },
        ],
      },
      comedy: {
        headline: 'LA DISCOTECA DEL MÁS ALLÁ',
        summary:
          'El humo se convierte en pista de baile. Bruno encuentra un ritmo imposible, Lía improvisa una coreografía y la primera fila tose al compás. Nadie sabe qué obra está viendo, pero todos bailan.',
        dialogue: [
          { speaker: 'BRUNO', text: '¡Esto no es una avería, es el número de clausura!' },
          { speaker: 'LÍA', text: 'Bruno, estamos en el acto de apertura.' },
          { speaker: 'NARRADOR', text: 'Alguien pone música desde el patio de butacas. La sala entra en éxtasis.' },
        ],
      },
      scifi: {
        headline: 'SEÑAL EN LA NIEBLA',
        summary:
          'La máquina no produce humo: produce una señal. Entre la bruma aparece un mensaje en una lengua que solo los actores fingen entender. El público decide que era parte del guion.',
        dialogue: [
          { speaker: 'LÍA', text: 'Bruno, la niebla acaba de decir tu nombre al revés.' },
          { speaker: 'BRUNO', text: 'Eso explica muchas cosas de mi infancia.' },
          { speaker: 'NARRADOR', text: 'La señal se repite tres veces. El regidor apunta: «contacto exterior, revisar presupuesto».' },
        ],
      },
    },
  },
  {
    id: 'trapdoor',
    act: 1,
    roman: 'I',
    playTitle: 'El sótano del teatro',
    location: 'El centro del escenario',
    timer: 20,
    memoryPrompt: 'El suelo también es un personaje. Y hoy se ha abierto sin pedir permiso.',
    briefing:
      'El decorado cruje. Una trampilla del centro del escenario se abre lentamente y deja ver un sótano que no aparece en los planos del teatro.',
    openingLines: [
      { speaker: 'LÍA', text: 'Bruno, ¿el escenario siempre ha tenido un agujero en el centro?' },
      { speaker: 'BRUNO', text: 'Solo cuando el público merece una sorpresa.' },
    ],
    incidentTitle: 'SE ABRE EL SÓTANO',
    incidentText:
      'La trampilla queda abierta. Del sótano sube un aire frío, un olor a terciopelo viejo y la sensación de que la obra acaba de encontrar una segunda planta.',
    baseTags: ['trapdoor', 'basement', 'below'],
    affinity: { romance: 2, comedy: 2, scifi: 3 },
    bridges: {
      romance: ['warm', 'intimate', 'sincere', 'music', 'romantic-token', 'organic'],
      comedy: ['silly', 'slapstick', 'absurd', 'animal', 'noise', 'pink'],
      scifi: ['alien', 'space', 'tech', 'weird'],
    },
    variants: {
      romance: {
        headline: 'BAJO LA ESCENA, OTRA VEZ TÚ',
        summary:
          'El sótano guarda el decorado de la primera obra de la compañía, y también una carta que Lía y Bruno se escribieron años atrás. La función se vuelve un reencuentro bajo el escenario.',
        dialogue: [
          { speaker: 'LÍA', text: 'Esta carta tiene tu letra. Y polvo de tres temporadas.' },
          { speaker: 'BRUNO', text: 'El sótano siempre fue mejor archivista que yo.' },
          { speaker: 'NARRADOR', text: 'La trampilla se cierra despacio, como si quisiera darles intimidad.' },
        ],
      },
      comedy: {
        headline: 'EL SÓTANO PIDE GUION',
        summary:
          'Del sótano sale un técnico jubilado que exige saber qué obra se está representando. Bruno le entrega el guion, el hombre lo corrige y el público aplaude la única crítica literaria de la noche.',
        dialogue: [
          { speaker: 'TÉCNICO ANTIGUO', text: 'Esto no es un sótano. Es el almacén de las malas ideas.' },
          { speaker: 'BRUNO', text: 'Entonces está usted en su casa.' },
          { speaker: 'LÍA', text: 'Que alguien le dé una silla. Se queda.' },
        ],
      },
      scifi: {
        headline: 'NIVEL -1: ESTACIÓN GAZEBO',
        summary:
          'El sótano es una cámara de descompresión. El teatro llevaba décadas siendo la fachada de una estación orbital y la trampilla acaba de pedir permiso para despegar.',
        dialogue: [
          { speaker: 'LÍA', text: 'Bruno, el sótano tiene gravedad propia.' },
          { speaker: 'BRUNO', text: 'Eso explicaría por qué se me caían siempre las llaves.' },
          { speaker: 'NARRADOR', text: 'Una luz azul sube por la trampilla. El patio de butacas se agarra a las butacas.' },
        ],
      },
    },
  },
  {
    id: 'cake',
    act: 1,
    roman: 'I',
    playTitle: 'La tarta de escayola',
    location: 'El banquete de la obra',
    timer: 20,
    memoryPrompt: 'El atrezo también tiene hambre. Y el público siempre quiere probar la tarta.',
    briefing:
      'La escena del banquete empieza con una tarta enorme en el centro. El problema es que la tarta es de escayola y alguien acaba de anunciar que es comestible.',
    openingLines: [
      { speaker: 'LÍA', text: 'Bruno, ¿seguro que esta tarta es de verdad?' },
      { speaker: 'BRUNO', text: 'Es tan real como nuestro presupuesto de catering.' },
    ],
    incidentTitle: 'LA TARTA DE ESCAYOLA',
    incidentText:
      'La tarta pesa doce kilos, tiene una cereza pintada y una etiqueta que dice «NO COMER». El público espera que alguien la parta.',
    baseTags: ['cake', 'prop', 'banquet'],
    affinity: { romance: 3, comedy: 3, scifi: 1 },
    bridges: {
      romance: ['warm', 'intimate', 'sincere', 'music', 'romantic-token', 'organic'],
      comedy: ['silly', 'slapstick', 'absurd', 'animal', 'noise', 'pink'],
      scifi: ['alien', 'space', 'tech', 'weird'],
    },
    variants: {
      romance: {
        headline: 'EL POSTRE DE LA VERDAD',
        summary:
          'La tarta se convierte en confesión: dentro hay una carta, una alianza y una disculpa de hace diez años. Lía y Bruno deciden que el banquete puede esperar.',
        dialogue: [
          { speaker: 'LÍA', text: 'Hay una carta dentro de la tarta.' },
          { speaker: 'BRUNO', text: 'Y yo pensando que solo había escayola.' },
          { speaker: 'NARRADOR', text: 'La cereza pintada rueda por el plato. Nadie la recoge.' },
        ],
      },
      comedy: {
        headline: 'TARTA PARA LA PRIMERA FILA',
        summary:
          'Bruno lanza la tarta al público por error. La primera fila la esquivia, la segunda la aplaude y la tercera pide una ración. El banquete se convierte en espectáculo participativo.',
        dialogue: [
          { speaker: 'BRUNO', text: '¡Cuidado, que pesa más que el segundo acto!' },
          { speaker: 'LÍA', text: 'Eso no era una indicación, Bruno.' },
          { speaker: 'NARRADOR', text: 'La tarta aterriza en una butaca vacía. El público pide tenedores.' },
        ],
      },
      scifi: {
        headline: 'COMBUSTIBLE DE CUMPLEAÑOS',
        summary:
          'La tarta es un depósito de energía para la nave-gazebo. La cereza es el detonante y la vela, una antena. El banquete despega antes que los actores.',
        dialogue: [
          { speaker: 'LÍA', text: 'La tarta está vibrando.' },
          { speaker: 'BRUNO', text: 'Es normal. Le pasa desde que cambiamos de dimensión.' },
          { speaker: 'NARRADOR', text: 'La cereza se enciende. El regidor reza en varios idiomas.' },
        ],
      },
    },
  },
);

export const PLAYS = [
  {
    id: 'jardin',
    title: 'El jardín de los susurros',
    subtitle: 'Romance de época con exceso de pólvora',
    description:
      'Lía y Bruno prometieron amarse para siempre en un gazebo que ahora huele a gasolina. Una obra de amor, viga caída y atrezo con opiniones.',
    genre: 'romance',
    sceneIds: ['explosion', 'dinosaur', 'smoke', 'trapdoor', 'blackout'],
  },
  {
    id: 'gazebo',
    title: 'El gazebo imposible',
    subtitle: 'Comedia de desastre y compañía itinerante',
    description:
      'La compañía ha montado la misma obra tres veces y ninguna ha salido igual. El gazebo pide protagonismo, la tarta pesa demasiado y nadie recuerda el final.',
    genre: 'comedy',
    sceneIds: ['smoke', 'cake', 'dinosaur', 'explosion', 'blackout'],
  },
  {
    id: 'orbita',
    title: 'Órbita de cartón',
    subtitle: 'Ciencia ficción de bajo presupuesto',
    description:
      'El teatro es una estación orbital disfrazada de teatro. El gazebo es una nave, el dinosaurio un embajador y el sótano una cámara de despegue.',
    genre: 'scifi',
    sceneIds: ['blackout', 'trapdoor', 'explosion', 'smoke', 'dinosaur'],
  },
  {
    id: 'viga',
    title: 'La viga caída',
    subtitle: 'Tragedia de compañía que no cancela nunca',
    description:
      'La Compañía de la Viga Caída lleva años representando la misma función. Hoy el decorado ha decidido participar en el guion.',
    genre: 'romance',
    sceneIds: ['cake', 'explosion', 'blackout', 'trapdoor', 'smoke'],
  },
];

export const getPlay = (id) => PLAYS.find((play) => play.id === id) || PLAYS[0];

export const getIncidentById = (id) =>
  INCIDENTS.find((incident) => incident.id === id) || INCIDENTS[0];

export const getCurrentIncident = (state) => {
  const play = getPlay(state.playId);
  const queue = state.sceneOrder?.length ? state.sceneOrder : play.sceneIds;
  return getIncidentById(queue[state.incidentIndex % queue.length]);
};

export const getIncident = (index) => INCIDENTS[clampIndex(index, 0, INCIDENTS.length - 1)];

function clampIndex(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const REACTION_META = {
  applause: {
    id: 'applause',
    label: 'Aplausos',
    icon: '👏',
    tone: 'positive',
    effect: '+1 satisfacción general y +2 s en la próxima escena.',
  },
  laughs: {
    id: 'laughs',
    label: 'Carcajadas',
    icon: '😂',
    tone: 'positive',
    effect: 'Reduce el aburrimiento y contenta a los amantes del caos.',
  },
  flowers: {
    id: 'flowers',
    label: 'Lluvia de flores',
    icon: '💐',
    tone: 'positive',
    effect: 'Las flores quedan en escena. +1 recurso de improvisación (máx. 5).',
  },
  ovation: {
    id: 'ovation',
    label: 'Ovación en pie',
    icon: '🌹',
    tone: 'positive',
    effect: '+3 satisfacción general, +1 improvisación y +3 s en la próxima escena. Piden un bis.',
  },
  murmurs: {
    id: 'murmurs',
    label: 'Murmullos',
    icon: '…',
    tone: 'neutral',
    effect: 'El público está confundido: la paciencia baja.',
  },
  yawns: {
    id: 'yawns',
    label: 'Bostezos',
    icon: '🥱',
    tone: 'negative',
    effect: 'El aburrimiento sube y la paciencia se agota.',
  },
  boo: {
    id: 'boo',
    label: 'Abucheos',
    icon: '👎',
    tone: 'negative',
    effect: 'La confianza de los actores baja y el descontento sube.',
  },
  tomatoes: {
    id: 'tomatoes',
    label: 'Tomatazos',
    icon: '🍅',
    tone: 'negative',
    effect: 'Un tomate queda en escena. Sube el caos, baja la confianza.',
  },
  walkout: {
    id: 'walkout',
    label: 'Abandono de la sala',
    icon: '🚪',
    tone: 'negative',
    effect: 'Espectadores del grupo más insatisfecho se marchan.',
  },
  protest: {
    id: 'protest',
    label: 'Protesta colectiva',
    icon: '📣',
    tone: 'negative',
    effect: 'El público exige explicaciones: se activa una crisis.',
  },
};

export const CRISIS_ACTIONS = [
  {
    id: 'dialogue',
    label: 'Improvisar diálogo',
    icon: '💬',
    description: 'Los actores justifican el último accidente. Recupera confianza y coherencia.',
    cost: '1 improvisación · 1/escena',
    cooldown: 1,
    tone: 'romance',
  },
  {
    id: 'pacing',
    label: 'Cambiar el ritmo',
    icon: '♫',
    description: 'Música y efectos para recuperar la atención. Reduce el aburrimiento y sube el caos.',
    cost: '1 uso por escena',
    cooldown: 1,
    tone: 'comedy',
  },
  {
    id: 'engage',
    label: 'Interactuar con el público',
    icon: '📣',
    description: 'Los actores responden a una protesta o petición. Ayuda al grupo más descontento.',
    cost: '1 uso por escena',
    cooldown: 1,
    tone: 'scifi',
  },
  {
    id: 'curtain',
    label: 'Bajar el telón',
    icon: '🎭',
    description: 'Reorganiza la escena y calma la crisis, pero rompe el ritmo y enfría al público.',
    cost: '1 uso por escena',
    cooldown: 1,
    tone: 'neutral',
  },
];

export const CRISIS_TYPES = {
  protest: {
    id: 'protest',
    title: 'PROTESTA EN LA PLATEA',
    subtitle: 'Una parte del público se ha puesto en pie y exige explicaciones.',
    severity: 'grave',
    hint: 'Interactuar con el público o improvisar una justificación puede calmar la sala.',
  },
  panic: {
    id: 'panic',
    title: 'PÁNICO EN EL CAMERINO',
    subtitle: 'Los actores han perdido el hilo y miran al técnico como si fuera un dios menor.',
    severity: 'grave',
    hint: 'Improvisar un diálogo devuelve la confianza. Cambiar el ritmo puede tapar el silencio.',
  },
  plot: {
    id: 'plot',
    title: 'LA TRAMA SE DESINTEGRA',
    subtitle: 'Nadie recuerda quién ama a quién, ni por qué hay un dinosaurio en el escenario.',
    severity: 'media',
    hint: 'Un diálogo de emergencia o bajar el telón pueden recomponer la historia.',
  },
  chaos: {
    id: 'chaos',
    title: '¡CAOS EN EL ESCENARIO!',
    subtitle: 'El atrezo se ha rebelado y el regidor ha empezado a rezar en voz baja.',
    severity: 'media',
    hint: 'El caos puede ser tu aliado, pero el público necesita un mínimo de forma.',
  },
  heckler: {
    id: 'heckler',
    title: 'EL ESPECTADOR DEL FONDO',
    subtitle: 'Alguien grita una crítica muy precisa y sorprendentemente bien documentada.',
    severity: 'leve',
    hint: 'Interactuar con el público o cambiar el ritmo puede convertir al crítico en aliado.',
  },
};

export const ENDING_META = {
  comercial: {
    id: 'comercial',
    label: 'ÉXITO COMERCIAL',
    icon: '★',
    tagline: 'La sala se rinde. La taquilla también.',
    description:
      'Has convertido el desastre en un espectáculo que el público recomendaría a sus enemigos. No es perfecto, pero nadie ha pedido la devolución de la entrada.',
    color: '#ffd166',
  },
  culto: {
    id: 'culto',
    label: 'OBRA DE CULTO',
    icon: '☾',
    tagline: 'No lo entienden. Lo adoran.',
    description:
      'La platea está dividida, pero los que se quedan hablan de tu obra como si hubieran presenciado un milagro. Alguien ya está cosiendo una camiseta con el nombre del dinosaurio.',
    color: '#69f0bd',
  },
  caos: {
    id: 'caos',
    label: 'CAOS MEMORABLE',
    icon: '✶',
    tagline: 'Nadie sabe qué ha pasado. Todos lo recuerdan.',
    description:
      'El espectáculo se ha desintegrado con estilo. Hay espectadores que se han ido, otros que han subido al escenario y una gallina que ahora tiene representante. Ha sido inolvidable.',
    color: '#ff6f91',
  },
  fracaso: {
    id: 'fracaso',
    label: 'FRACASO DE LA FUNCIÓN',
    icon: '✕',
    tagline: 'El telón cae. La sala ya se ha levantado.',
    description:
      'La historia se ha roto en más sitios de los que puedes arreglar. La obra termina, pero el público abandona la sala convencido de que el gazebo era lo único que funcionaba.',
    color: '#a9a0a4',
  },
};

export const ACTOR_STATUS = {
  firmes: { label: 'Firmes', description: 'Saben lo que hacen. Más o menos.' },
  tensos: { label: 'Tensos', description: 'Improvisan, pero miran el telar con desconfianza.' },
  nerviosos: { label: 'Nerviosos', description: 'Buscan al técnico en cada pausa.' },
  bloqueados: { label: 'Bloqueados', description: 'Han olvidado su nombre y parte del guion.' },
};
